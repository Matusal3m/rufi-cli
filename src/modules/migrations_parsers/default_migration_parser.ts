import { MigrationParser } from './migration_parser';
import * as fs from 'fs';

export class DefaultMigrationParser extends MigrationParser {
    async execute(destination: string): Promise<string[]> {
        const migrationDir = destination;

        return fs
            .readdirSync(migrationDir)
            .filter(file => file.endsWith('.sql'))
            .sort();
    }
}
