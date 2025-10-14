import { UsageError } from 'clipanion';
import { RufiManagementRegistry } from '@/persistence';
import { PrismaMigrationParser, MigrationParser } from '@/modules';
import { DefaultMigrationParser } from './migrations_parsers';
import type { ServiceConfig } from '@/modules';
import { color } from '@/utils';
import * as fs from 'fs';
import * as path from 'path';

export class Migration {
    private static servicePath(service: string) {
        const serviceDir = path.join(process.cwd(), 'services', service);

        if (!fs.existsSync(serviceDir)) {
            throw new UsageError(
                `${color.red('Service')} ${color.blue(service)} ${color.red(
                    'could not be found'
                )}`
            );
        }

        return serviceDir;
    }

    static defaultMigrationDir(service: string) {
        const serviceDir = this.servicePath(service);
        const migrationDir = path.join(serviceDir, 'migrations');

        return migrationDir;
    }

    static isValidMigration(migrationPath: string, migration: string) {
        if (!fs.statSync(migrationPath).isFile()) {
            return { isValid: false, message: `not a valid file` };
        }

        if (!/^[0-9]/.test(migration)) {
            return { isValid: false, message: `should start with a number.` };
        }

        if (RufiManagementRegistry.hasMigration(migration)) {
            return {
                isValid: false,
                message: `already applied.`,
            };
        }

        return { isValid: true, message: '' };
    }

    static register(migration: string, service: string) {
        RufiManagementRegistry.addMigration(migration, service);
    }

    static getParser(serviceConfig: ServiceConfig): MigrationParser {
        if (serviceConfig.parseMethod === 'prisma') {
            return new PrismaMigrationParser(serviceConfig);
        }

        return new DefaultMigrationParser(serviceConfig);
    }
}
