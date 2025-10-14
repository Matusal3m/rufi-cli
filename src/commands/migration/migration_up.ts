import { Command, Option } from 'clipanion';
import { RufiPersistence } from '@/persistence';
import { RufiLogger, color } from '@/utils';
import { Migration, Services } from '@/modules';
import * as fs from 'fs/promises';
import * as path from 'path';

export class MigrationUp extends Command {
    static paths = [[`migration:up`]];
    static usage = Command.Usage({
        category: 'Migration',
        description: 'Apply pending migrations for a specific service',
        details: `
            Applies all pending SQL migrations for the specified service.

            - Migrations must be in the service's 'migrations' directory
            - Must have a .sql extension
            - Must start with a number for proper ordering
            
            Execution stops immediately if any migration fails.
        `,
        examples: [
            [
                'Apply migrations for a specific service',
                'rufi migration:up my-service',
            ],
        ],
    });

    service = Option.String('service', {
        description: 'Service name to apply migrations for',
        required: true,
    });

    async execute() {
        RufiLogger.section(`Starting migrations for service: ${this.service}`);

        const serviceConfig = await this.ensureServiceConfig();
        const defaultMigrationDir = Migration.defaultMigrationDir(this.service);

        const parser = Migration.getParser(serviceConfig!);
        const migrations = await parser.parseTo(defaultMigrationDir);

        if (migrations.length === 0) {
            RufiLogger.warn('No migration files found.');
            return;
        }

        this.logMigrationsFound(migrations);

        const schema = this.getSchemaName();
        RufiPersistence.ensureSchemaExistence(schema);

        const appliedCount = await this.applyMigrations(
            migrations,
            schema,
            defaultMigrationDir
        );

        if (appliedCount > 0) {
            RufiLogger.section(
                `Done. Applied ${appliedCount} new migration(s).`
            );
            return;
        }
        RufiLogger.info('Zero migrations to run. Nothing was applied.');
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

    private logMigrationsFound(migrations: string[]) {
        RufiLogger.info(`Found ${migrations.length} migration(s):`);
        migrations.forEach(migration => RufiLogger.bullet(migration));
        RufiLogger.section('Applying migrations...');
    }

    private getSchemaName(): string {
        return process.env['CORE_SERVICE'] === this.service
            ? 'public'
            : this.service;
    }

    private async applyMigrations(
        migrations: string[],
        schema: string,
        dir: string
    ): Promise<number> {
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
                const sql = await fs.readFile(migrationPath, {
                    encoding: 'utf8',
                });
                RufiLogger.info(`Applying ${migration} to schema ${schema}...`);

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

        return appliedCount;
    }

    private async runMigration(sql: string, schema: string) {
        await RufiPersistence.transaction(async client => {
            await client.query(`SET search_path TO ${schema}, public;`);
            await client.query(sql);
        });
    }
}
