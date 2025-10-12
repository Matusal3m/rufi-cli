import { MigrationParser } from "./migration_parser.js";
import { RufiLogger } from "../../utils/rufi_logger.js";
import fs from "fs";
import path from "path";

export class PrismaMigrationParser extends MigrationParser {
    execute(destination) {
        const directoryToParse = path.join(
            process.cwd(),
            "services",
            this.config.name,
            this.config.directoryToParse,
        );

        this.ensureMigrationDir(directoryToParse);

        const migrations = fs
            .readdirSync(directoryToParse)
            .filter((migrationName) =>
                fs
                    .lstatSync(path.join(directoryToParse, migrationName))
                    .isDirectory(),
            );

        for (const migrationName of migrations) {
            const migrationPath = path.join(
                directoryToParse,
                migrationName,
                "migration.sql",
            );

            this.ensureMigrationExists(migrationPath, migrationName);

            const sql = fs.readFileSync(migrationPath);
            if (!fs.existsSync(destination)) fs.mkdirSync(destination);
            fs.writeFileSync(
                path.join(destination, migrationName + ".sql"),
                sql,
            );
        }

        RufiLogger.info(
            `Prisma migrations from ${directoryToParse} parsed to ${destination}`,
        );

        return migrations.map((m) => m + ".sql");
    }
}
