import fs from "fs";
import { RufiLogger } from "../../utils/rufi_logger.js";
import { color } from "../../utils/color.js";
import { Migration } from "../migration.js";
import path from "path";

export class MigrationParser {
    constructor(serviceConfig) {
        this.config = serviceConfig;

        if (!this.config) throw new Error(`All services needs a configuration`);
    }

    ensureMigrationDir(migrationDir) {
        if (!fs.existsSync(migrationDir)) {
            throw new Error(
                `Migration dir ${color.bold(migrationDir)} not found`,
            );
        }
    }

    ensureMigrationsFound(migrations) {
        if (!migrations.length) {
            throw new Error(
                `Zero migrations found at ${color.bold(this.config.directoryToParse)}`,
            );
        }
    }

    ensureMigrationExists(migrationPath, migrationName) {
        if (!fs.existsSync(path.join(migrationPath))) {
            throw new Error(`Could not find path to ${migrationName}`);
        }
    }

    async parseTo(destination) {
        if (!this.config.parseMethod) {
            RufiLogger.info(
                "No parser defined, running with default behaviour.",
            );

            const migrationDir = Migration.defaultMigrationDir(
                this.config.name,
            );

            return fs
                .readdirSync(migrationDir)
                .filter((file) => file.endsWith(".sql"))
                .sort();
        }

        if (!this.execute) {
            throw new Error(`Execute method was not implemented`);
        }

        try {
            return await this.execute(destination);
        } catch (error) {
            RufiLogger.error(error.message);
            return [];
        }
    }
}
