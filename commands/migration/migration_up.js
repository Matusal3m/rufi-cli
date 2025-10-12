import { Command, Option } from "clipanion";
import { color } from "../../utils/color.js";
import { RufiPersistence } from "../../persistence/rufi_persistence.js";
import { RufiLogger } from "../../utils/rufi_logger.js";
import { Migration } from "../../modules/migration.js";
import fs from "fs";
import path from "path";
import { Services } from "../../modules/services.js";

export class MigrationUp extends Command {
    static paths = [[`migration:up`]];
    static usage = Command.Usage({
        category: "Migration",
        description: "Apply pending migrations for a specific service",
        details: `
            This command applies all pending SQL migrations for the specified service.
            Migrations are executed in alphabetical order based on their filenames.
            Only migrations that haven't been applied previously will be executed.
            
            Migration files should:

            - Be located in the service's 'migrations' directory 
            - Have a .sql extension
            - Start with a number for proper ordering
            
            If a migration fails, the process stops and no further migrations are applied.
        `,
        examples: [
            [
                "Apply migrations for a specific service",
                "rufi migration:up my-service",
            ],
        ],
    });

    service = Option.String({
        description: "The name of the service to apply migrations for",
    });
    all = Option.Boolean("--all");

    async execute() {
        RufiLogger.section(`Starting migrations for service: ${this.service}`);

        const defaultMigrationDir = Migration.defaultMigrationDir(this.service);

        const serviceConfig = Services.config(this.service);
        const migrationParser = Migration.getParser(serviceConfig);
        const migrations = await migrationParser.parseTo(defaultMigrationDir);

        if (migrations.length === 0) {
            RufiLogger.warn("No migration files found.");
            return;
        }

        RufiLogger.info(`Found ${migrations.length} migration(s):`);
        migrations.forEach((m) => RufiLogger.bullet(m));
        RufiLogger.section("Applying migrations...");

        let appliedCount = 0;

        const isCore = process.env["CORE_SERVICE"] === this.service;
        const schema = isCore ? "public" : this.service;

        RufiPersistence.ensureSchemaExistence(schema);

        for (const migration of migrations) {
            const migrationPath = path.join(defaultMigrationDir, migration);

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
                appliedCount++;
            } catch (error) {
                RufiLogger.error(
                    `Failed to apply ${migration}: ${error.message}`,
                );
                RufiLogger.warn("Migration process stopped due to error.");
                break;
            }
        }

        if (appliedCount > 0) {
            RufiLogger.section(
                `Done. Applied ${appliedCount} new migration(s).`,
            );
        } else {
            RufiLogger.info("Zero migrations to run. Nothing was applied.");
        }
    }
}
