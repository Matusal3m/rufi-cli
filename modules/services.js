import fs from "fs";
import path from "path";

/**
 * @typedef {Object} ServiceConfig
 * @property {string} name
 * @property {string} repository
 * @property {boolean} enable
 * @property {'prisma'|undefined} parseMethod
 * @property {string|undefined} directoryToParse
 */

export class Services {
    /**
     * @returns {ServiceConfig | undefined}
     * */
    static config(serviceName) {
        const services = this.configs();
        return services.find((service) => service.name === serviceName);
    }

    /**
     * @returns {ServiceConfig[]} An array of configuration objects describing all available services.
     */
    static configs() {
        const servicesConfigPath = path.join(
            process.cwd(),
            "services",
            "services.config.json",
        );

        const config = fs.readFileSync(servicesConfigPath);
        return JSON.parse(config);
    }

    static local() {
        const servicesPath = path.join(process.cwd(), "services");
        return fs
            .readdirSync(servicesPath)
            .filter((service) =>
                fs.lstatSync(path.join(servicesPath, service)).isDirectory(),
            );
    }
}
