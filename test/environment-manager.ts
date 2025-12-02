import { ServiceConfig, ServicesConfig } from '../src/modules';
import { Format } from '../src/utils';
import fs from 'fs/promises';

export class EnvironmentManager {
    private readonly filepath = 'services/services.config.js';

    public constructor(
        private readonly services: ServicesConfig,
        private readonly fakeServices?: ServicesConfig,
    ) {}

    public async writeConfigFile() {
        await fs.mkdir('services');
        const configString = this.makeServiceString(this.services);
        await fs.writeFile(this.filepath, configString);
    }

    public removeServiceDir() {
        return fs.rmdir('services', {
            recursive: true,
        });
    }

    public removeConfigFile() {
        return fs.rm(this.filepath);
    }

    private makeServiceString(services: ServicesConfig) {
        let servicesConfig = `
            import { Rufi } from "../src";

            export default Rufi.services({`;

        for (const serviceName in services) {
            const service = services[serviceName];
            servicesConfig += this.parseServiceConfig(serviceName, service);
        }

        servicesConfig += '})';
        const formattedServicesConfig =
            Format.template.withIndent(servicesConfig);

        return formattedServicesConfig;
    }

    private parseServiceConfig(name: string, service: ServiceConfig) {
        return `
                ${name}: {
                    enable: ${service.enable},
                    git: {
                        branch: "${service.git.branch}",
                        repository: "${service.git.repository}"
                    },
                    ${
                        service.migrations
                            ? `migrations: {
                        directory: "${service.migrations?.directory}",
                        parse: "${service.migrations?.parse}" 
                    }`
                            : ''
                    }
                },`;
    }
}
