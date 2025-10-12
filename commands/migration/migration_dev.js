import { Command, Option, UsageError } from "clipanion";
import { RufiPersistence } from "../../persistence/rufi_persistence.js";
import fs from "fs";
import path from "path";
import { color } from "../../utils/color.js";
import { RufiLogger } from "../../utils/rufi_logger.js";
import { RufiManagementRegistry } from "../../persistence/rufi_management_registry.js";
import { Migration } from "../../modules/migration.js";

export class MigrationDev extends Command {
    static paths = [["migration:dev"]];
    static usage = Command.Usage({
        category: "Migration",
        description: "Reset and reapply all migrations for a service",
        details: `
        This command completely resets a service's database by dropping the schema
        and reapplying all migrations from scratch.
        
        Core service migrations require the --force flag for safety.
        All existing data in the schema will be permanently lost.
        `,
        examples: [
            ["Reset a service database", "rufi migration:dev my-service"],
            ["Reset core service", "rufi migration:dev core-service --force"],
        ],
    });

    service = Option.String({ required: true });
    force = Option.Boolean("--force", false, {
        description: "Force migration even on core service",
    });

    async execute() {
        const isCore = process.env["CORE_SERVICE"] === this.service;
        const schema = isCore ? "public" : this.service;

        if (isCore && !this.force) {
            RufiLogger.warn(`${color.yellow(`Migration blocked for core service: "${this.service}"`)}
This schema may contain tables referenced by other services,
and running migrations directly could cause data loss or integrity issues.

If you really need to proceed, use:
rufi migration:dev ${this.service} --force
            `);
        }

        const registeredMigrations =
            RufiManagementRegistry.listServiceMigrations(this.service);

        if (!registeredMigrations || registeredMigrations.length == 0) {
            RufiLogger.warn(
                "No migrations registered to this service. Nothing will be dropped.",
            );
            RufiLogger.info(
                `Run ${color.gray(`rufi migration:up ${this.service}`)} instead`,
            );
        }

        RufiLogger.info(
            `Starting development migrations for service: ${color.cyan(
                this.service,
            )}`,
        );

        try {
            RufiLogger.info(`Dropping ${schema} tables.`);

            await RufiPersistence.query(
                `DROP SCHEMA IF EXISTS "${schema}" CASCADE;`,
            );
            RufiManagementRegistry.clearService(this.service);

            RufiLogger.success(
                color.green(`All tables and types dropped successfully.`),
            );
        } catch (err) {
            RufiLogger.error(`Error while dropping ${schema} schema.`);
            throw err;
        }

        RufiPersistence.ensureSchemaExistence(schema);

        const migrationDir = Migration.defaultMigrationDir(this.service);
        const migrations = Migration.getSortedMigrations(migrationDir);

        for (const migration of migrations) {
            const migrationPath = path.join(migrationDir, migration);

            const { isValid, message } = Migration.isValidMigration(
                migrationPath,
                migration,
            );

            if (!isValid) {
                RufiLogger.warn(
                    `Skipping migration ${color.bold(migration)}: ${message}`,
                );
                continue;
            }

            try {
                const sql = fs.readFileSync(migrationPath, "utf8");
                RufiLogger.info(`Applying ${migration} to schema ${schema}...`);

                await RufiPersistence.transaction(async (client) => {
                    await client.query(`SET search_path TO ${schema}, public;`);
                    await client.query(sql);
                });

                Migration.register(migration, this.service);
                RufiLogger.success(`Migration applied: ${migration}`);
            } catch (error) {
                RufiLogger.error(
                    `Failed to apply ${migration}: ${error.message}`,
                );
                RufiLogger.warn("Migration process stopped due to error.");
                break;
            }
        }
    }
}
