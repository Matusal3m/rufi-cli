import { Command } from "clipanion";
import { RufiLogger } from "../../utils/rufi_logger.js";
import { RufiManagementRegistry } from "../../persistence/rufi_management_registry.js";
import { RufiPersistence } from "../../persistence/rufi_persistence.js";

export class DbReset extends Command {
    static paths = [["db:reset"]];
    static usage = Command.Usage({
        category: "Database",
        description: "Reset the development database by dropping all schemas",
        details: `
            This command will:
            - Drop all PostgreSQL schemas registered in the management registry
            - Clear the service registry
            - Reset the development environment to a clean state
            
            ⚠️  This command is ONLY available in development environment (CLI_ENV=development)
            and will exit with an error if used in other environments.
            
            The 'public' schema corresponds to the core service defined in CORE_SERVICE environment variable.
        `,
        examples: [["Reset development database", "rufi db:reset"]],
    });

    async execute() {
        if (process.env["CLI_ENV"] !== "development") {
            RufiLogger.error(
                "Command allowed only in development environment.",
            );
        }

        RufiLogger.info("Dropping all PostgreSQL schemas...");

        const schemas = RufiManagementRegistry.listRegisteredServices();

        if (!schemas || schemas.length === 0) {
            RufiLogger.warn("No schemas registered — nothing to drop.");
        }

        for (let schema of schemas) {
            schema = schema === process.env["CORE_SERVICE"] ? "public" : schema;
            const sql = `DROP SCHEMA IF EXISTS "${schema}" CASCADE;`;

            RufiLogger.info(`Dropping schema: ${schema}`);
            try {
                await RufiPersistence.query(sql);
                RufiLogger.success(`Schema "${schema}" dropped successfully.`);
            } catch (err) {
                RufiLogger.error(
                    `Failed to drop schema "${schema}": ${err.message}`,
                );
            }
        }

        try {
            RufiManagementRegistry.clear();
            RufiLogger.success("Registry of services cleared successfully.");
        } catch (error) {
            RufiLogger.warn(
                `Could not clear service registry: ${error.message}`,
            );
        }

        RufiLogger.divider();
        RufiLogger.success("All schemas dropped successfully!");
        RufiLogger.info("Development environment has been reset.");
        RufiLogger.divider();
    }

    catch(error) {
        RufiLogger.error(`${color.red("Error")}: ${error.message}`);
    }
}
