import { RufiLogger, color } from '@/utils';
import type { ServiceConfig } from '@/modules';
import * as fs from 'fs';

export abstract class MigrationParser {
    constructor(public serviceConfig: ServiceConfig) {}

    abstract execute(destination: string): Promise<string[]>;

    ensureMigrationDir(migrationDir: string) {
        if (!fs.existsSync(migrationDir)) {
            throw new Error(
                `Migration dir ${color.bold(migrationDir)} not found`
            );
        }
    }

    ensureMigrationsFound(migrations: string[]) {
        if (migrations.length) return;

        const migrationDir =
            this.serviceConfig.directoryToParse ||
            this.serviceConfig.name + '/migrations';

        throw new Error(`Zero migrations found at ${color.bold(migrationDir)}`);
    }

    ensureMigrationExists(migrationPath: string, migrationName: string) {
        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Could not find path to ${migrationName}`);
        }
    }

    async parseTo(destination: string) {
        try {
            return await this.execute(destination);
        } catch (err: any) {
            RufiLogger.error(err);
            return [];
        }
    }
}
