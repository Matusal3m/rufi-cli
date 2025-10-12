import { RufiManagementRegistry } from "../persistence/rufi_management_registry.js";
import { color } from "../utils/color.js";
import { UsageError } from "clipanion";
import fs from "fs";
import path from "path";
import { PrismaMigrationParser } from "./migrations_parsers/prisma_migration_parser.js";
import { MigrationParser } from "./migrations_parsers/migration_parser.js";

export class Migration {
    static #servicePath(service) {
        const serviceDir = path.join(process.cwd(), "services", service);

        if (!fs.existsSync(serviceDir)) {
            throw new UsageError(
                `${color.red("Service")} ${color.blue(service)} ${color.red("could not be found")}`,
            );
        }

        return serviceDir;
    }

    static defaultMigrationDir(service) {
        const serviceDir = this.#servicePath(service);
        const migrationDir = path.join(serviceDir, "migrations");

        return migrationDir;
    }

    static isValidMigration(migrationPath, migration) {
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

        return { isValid: true, message: "" };
    }

    static register(migration, service) {
        RufiManagementRegistry.addMigration(migration, service);
    }

    static getParser(serviceConfig) {
        if (serviceConfig.parseMethod === "prisma") {
            return new PrismaMigrationParser(serviceConfig);
        }

        return new MigrationParser(serviceConfig);
    }
}
