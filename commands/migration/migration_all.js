import { Command, Option } from "clipanion";
import { Services } from "../../modules/index.js";
import { RufiLogger } from "../../utils/rufi_logger.js";
import { PassThrough } from "stream";
import { color } from "../../utils/color.js";

export class MigrationAll extends Command {
    static paths = [["migration:all"]];

    dev = Option.Boolean("--dev");

    async execute() {
        const services = Services.local();
        const coreName = process.env["CORE_SERVICE"];

        RufiLogger.info("Checking for core service...");

        const coreIndex = services.findIndex((service) => service === coreName);
        if (coreIndex === -1) {
            RufiLogger.error(
                `Core service '${coreName}' not found among local services.`,
            );
            throw new Error(
                `Migration aborted: missing core service '${coreName}'.`,
            );
        }

        const [coreService] = services.splice(coreIndex, 1);

        RufiLogger.info(
            `Running migrations for ${color.bold("core")} service: ${coreService}`,
        );

        try {
            await this.cli.run(["migration:up", coreService], {
                stdout: new PassThrough(),
            });
            RufiLogger.success(`Core migration completed successfully.`);
        } catch (error) {
            RufiLogger.error(
                `Migration failed for core service '${coreService}'.`,
            );
            throw error;
        }

        RufiLogger.info("Running migrations for remaining services...");

        const migrationsPromises = [];
        for (const service of services) {
            RufiLogger.divider();
            RufiLogger.info(`Starting migration for ${service}...`);

            try {
                await this.cli.run(["migration:up", service], {
                    stdout: new PassThrough(),
                });
                RufiLogger.success(`Migration completed for ${service}.`);
            } catch (error) {
                RufiLogger.warn(
                    `Could not run migration for service ${color.bold(
                        service,
                    )}.`,
                );
            }
        }
        RufiLogger.divider();

        await Promise.all(migrationsPromises);
        RufiLogger.success("All migrations finished!");
    }
}
