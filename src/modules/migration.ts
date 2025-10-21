import type { ServiceConfig } from '@/modules';
import { UsageError } from 'clipanion';
import { MigrationsRegistry } from '@/persistence';
import { PrismaMigrationParser, MigrationParser, Services } from '@/modules';
import { DefaultMigrationParser } from './migrations_parsers';
import { color, File, RufiLogger } from '@/utils';
import * as fs from 'fs/promises';
import * as path from 'path';

export class Migrations {
    constructor(
        private readonly migrationsRegistry: MigrationsRegistry,
        private readonly services: Services
    ) {}

    private async servicePath(service: string) {
        const serviceDir = path.join(process.cwd(), 'services', service);

        const hasServiceDir = await File.exists(serviceDir);

        if (!hasServiceDir) {
            throw new UsageError(
                `${color.red('Service')} ${color.blue(service)} ${color.red(
                    'could not be found'
                )}`
            );
        }

        return serviceDir;
    }

    async defaultMigrationDir(service: string) {
        const serviceDir = await this.servicePath(service);
        return path.join(serviceDir, 'migrations');
    }

    async isValidMigration(migrationPath: string, migration: string) {
        const stat = await fs.stat(migrationPath);
        if (!stat.isFile()) {
            return { isValid: false, message: `is not a file` };
        }

        if (!/^[0-9]/.test(migration)) {
            return { isValid: false, message: `should start with a number.` };
        }

        const migrationExists =
            await this.migrationsRegistry.checkMigrationExistence(migration);

        if (migrationExists) {
            return {
                isValid: false,
                message: `already applied.`,
            };
        }

        return { isValid: true, message: '' };
    }

    getParser(serviceConfig: ServiceConfig): MigrationParser {
        switch (serviceConfig.parseMethod) {
            case 'prisma':
                return new PrismaMigrationParser(serviceConfig);
            default:
                return new DefaultMigrationParser(serviceConfig);
        }
    }

    async applyMigrations(
        migrations: string[],
        service: string,
        dir: string
    ): Promise<number> {
        const schema = this.services.getSchemaName(service);
        let appliedCount = 0;

        await this.services.ensureSchemaExistence(schema);

        for (const migration of migrations) {
            const migrationPath = path.join(dir, migration);
            const { isValid, message } = await this.isValidMigration(
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

                await this.migrationsRegistry.runMigration(sql, schema);
                await this.migrationsRegistry.addMigration(migration, service);

                RufiLogger.success(`Migration applied: ${migration}`);
                appliedCount++;
            } catch (err: any) {
                RufiLogger.error(
                    `Failed to apply ${migration}: ${err.message || err}`
                );
                RufiLogger.warn('Migration process stopped due to error.');
                throw err;
            }
        }

        return appliedCount;
    }

    register(migration: string, service: string) {
        return this.migrationsRegistry.addMigration(migration, service);
    }

    getServiceMigrations(service: string) {
        if (!service) throw new Error('Service cannot be empty');
        return this.migrationsRegistry.migrationsFromService(service);
    }

    clear() {
        return this.migrationsRegistry.clear();
    }

    async clearService(service: string) {
        if (!service) throw new Error('The service to flush cannot be empty');
        await this.migrationsRegistry.clearService(service);
    }
}
