import { Command } from "clipanion";
import { PassThrough } from "stream";
import { RufiLogger } from "../../utils/rufi_logger.js";
import fs from "fs";
import path from "path";

export class Reset extends Command {
    static paths = [["reset"]];
    static usage = Command.Usage({
        category: "Common",
        description: "Removes all services and clear the migration registry",
    });

    async execute() {
        RufiLogger.info("Starting reset process...");

        if (process.env["ENV"] !== "development") {
            console.warn(
                "Reset command can only be run in development environment",
            );
            RufiLogger;
        }

        RufiLogger.info("Running database reset...");
        await this.cli.run(["db:reset"], {
            stdin: new PassThrough(),
        });
        RufiLogger.info("Database reset completed successfully");

        const servicesPath = path.join(process.cwd(), "services");

        const services = fs
            .readdirSync(servicesPath)
            .filter((s) =>
                fs.lstatSync(path.join(servicesPath, s)).isDirectory(),
            );

        for (const service of services) {
            const servicePath = path.join(process.cwd(), "services", service);

            try {
                RufiLogger.info(`Removing service: ${service}`);
                fs.rmSync(servicePath, { recursive: true, force: true });
                RufiLogger.info(`Successfully removed service: ${service}`);
            } catch (error) {
                RufiLogger.error(`Failed to remove service: ${service}`, error);
            }
        }

        RufiLogger.info("Reset process completed successfully");
    }
}
