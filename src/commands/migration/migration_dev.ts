import { Command, Option } from 'clipanion';
import { RufiLogger, color } from '@/utils';
import { RufiPersistence, RufiManagementRegistry } from '@/persistence';
import { Migration, Services } from '@/modules';
import * as path from 'path';
import * as fs from 'fs/promises';

export class MigrationDev extends Command {
    static paths = [['migration:dev']];

    static usage = Command.Usage({
        category: 'Migration',
        description: 'Reset and reapply all migrations for a service',
        details: `
        Completely resets a service's database schema and reapplies all migrations.
        
        ⚠️ Core service migrations require the --force flag for safety.
        All existing data in the schema will be permanently lost.
        `,
        examples: [
            ['Reset a service database', 'rufi migration:dev my-service'],
            [
                'Reset core service (forced)',
                'rufi migration:dev core-service --force',
            ],
        ],
    });

    service = Option.String({ required: true });
    force = Option.Boolean('--force', false, {
        description: 'Force migration even on core service',
    });

    async execute() {
        const isCore = process.env['CORE_SERVICE'] === this.service;
        const schema = isCore ? 'public' : this.service;

        if (isCore && !this.force) {
            return this.warnCoreProtection();
        }

        RufiLogger.section(
            `Starting development migrations for service: ${color.cyan(
                this.service
            )}`
        );

        await this.dropSchema(schema);
        RufiPersistence.ensureSchemaExistence(schema);

        const serviceConfig = await this.ensureServiceConfig();
        const migrationDir = Migration.defaultMigrationDir(this.service);

        const parser = Migration.getParser(serviceConfig!);
        const migrations = await parser.execute(migrationDir);

        if (migrations.length === 0) {
            RufiLogger.warn(
                'No migration files found. Nothing will be applied.'
            );
            return;
        }

        await this.applyMigrations(migrations, schema, migrationDir);

        RufiLogger.section(
            `Done. Reapplied ${migrations.length} migration(s) for ${color.cyan(
                this.service
            )}.`
        );
    }

    private warnCoreProtection() {
        RufiLogger.warn(`${color.yellow(
            `Migration blocked for core service: "${this.service}"`
        )}
This schema may contain tables referenced by other services,
and running migrations directly could cause data loss or integrity issues.

If you really need to proceed, use:
${color.gray(`rufi migration:dev ${this.service} --force`)}
        `);
    }

    private ensureServiceConfig() {
        const serviceConfig = Services.config(this.service);
        if (!serviceConfig) {
            throw new Error(
                `Could not find configuration for service "${this.service}".`
            );
        }
        return serviceConfig;
    }

    private async dropSchema(schema: string) {
        const registeredMigrations =
            RufiManagementRegistry.listServiceMigrations(this.service);

        if (!registeredMigrations || registeredMigrations.length === 0) {
            RufiLogger.warn('No migrations registered for this service.');
            RufiLogger.info(
                `Run ${color.gray(
                    `rufi migration:up ${this.service}`
                )} instead if you only need to apply.`
            );
        }

        RufiLogger.info(`Dropping schema ${color.bold(schema)}...`);

        try {
            await RufiPersistence.query(
                `DROP SCHEMA IF EXISTS "${schema}" CASCADE;`
            );
            RufiManagementRegistry.clearService(this.service);
            RufiLogger.success(`Schema "${schema}" dropped successfully.`);
        } catch (err: any) {
            RufiLogger.error(
                `Error while dropping schema "${schema}": ${err.message || err}`
            );
            throw err;
        }
    }

    private async applyMigrations(
        migrations: string[],
        schema: string,
        dir: string
    ) {
        RufiLogger.section('Reapplying migrations...');

        let appliedCount = 0;
        for (const migration of migrations) {
            const migrationPath = path.join(dir, migration);
            const { isValid, message } = Migration.isValidMigration(
                migrationPath,
                migration
            );

            if (!isValid) {
                RufiLogger.warn(
                    `Skipping migration ${color.bold(migration)}: ${message}`
                );
                continue;
            }

            try {
                const sql = await fs.readFile(migrationPath, 'utf8');
                RufiLogger.info(
                    `Applying ${color.cyan(migration)} to schema ${color.gray(
                        schema
                    )}...`
                );

                await this.runMigration(sql, schema);
                Migration.register(migration, this.service);

                RufiLogger.success(`Migration applied: ${migration}`);
                appliedCount++;
            } catch (err: any) {
                RufiLogger.error(
                    `Failed to apply ${migration}: ${err.message || err}`
                );
                RufiLogger.warn('Migration process stopped due to error.');
                break;
            }
        }

        if (appliedCount === 0) {
            RufiLogger.info('No migrations were applied.');
        }
    }

    private async runMigration(sql: string, schema: string) {
        await RufiPersistence.transaction(async client => {
            await client.query(`SET search_path TO ${schema}, public;`);
            await client.query(sql);
        });
    }
}
