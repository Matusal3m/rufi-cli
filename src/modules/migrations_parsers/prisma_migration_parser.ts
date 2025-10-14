import { color, RufiLogger } from '@/utils';
import { MigrationParser } from './migration_parser';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';

export class PrismaMigrationParser extends MigrationParser {
    async execute(destination: string): Promise<string[]> {
        const { directoryToParse, name } = this.serviceConfig;

        if (!directoryToParse) {
            throw new Error(
                color.red(
                    `${color.bold('directoryToParse')} config is required`
                )
            );
        }

        const sourceDir = path.join(
            process.cwd(),
            'services',
            name,
            directoryToParse
        );

        try {
            this.ensureMigrationDir(sourceDir);
            const migrations = await this.getMigrations(sourceDir);

            this.ensureDir(destination);
            await this.createMigrationFiles(sourceDir, destination, migrations);

            RufiLogger.info(
                `Prisma migrations from ${directoryToParse} parsed to ${destination}`
            );

            return migrations.map(migration => `${migration}.sql`);
        } catch (error) {
            RufiLogger.error(
                `Something whent wrong with Prisma migration parsing process to ${color.bold(
                    name
                )} service.`
            );
            return [];
        }
    }

    private async getMigrations(migrationDir: string): Promise<string[]> {
        const dirContent = await fs.readdir(migrationDir, {
            withFileTypes: true,
        });
        return dirContent
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);
    }

    private async createMigrationFiles(
        sourceDir: string,
        destination: string,
        migrations: string[]
    ) {
        const promises = migrations.map(async migrationName => {
            const migrationPath = path.join(
                sourceDir,
                migrationName,
                'migration.sql'
            );
            this.ensureMigrationExists(migrationPath, migrationName);

            const sql = await fs.readFile(migrationPath);
            const targetPath = path.join(destination, `${migrationName}.sql`);
            await fs.writeFile(targetPath, sql);
        });
        return Promise.all(promises);
    }

    private ensureDir(dirPath: string) {
        if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
    }
}
