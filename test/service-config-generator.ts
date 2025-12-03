import { ServiceConfig, ServicesConfig } from '../src/modules';

export class ServiceConfigGenerator {
    private parseServiceConfig(name: string, service: ServiceConfig): string {
        const migrationsBlock = service.migrations
            ? `
        migrations: {
            directory: "${service.migrations.directory}",
            parse: "${service.migrations.parse}",
        },`
            : '';

        return `
    ${name}: {
        enable: ${service.enable},
        git: {
            branch: "${service.git.branch}",
            repository: "${service.git.repository}",
        },${migrationsBlock}
    },`;
    }

    public generate(services: ServicesConfig): string {
        let servicesConfigContent = '';

        for (const serviceName in services) {
            const service = services[serviceName];
            servicesConfigContent += this.parseServiceConfig(
                serviceName,
                service,
            );
        }

        return `
import { Rufi } from "../src";

export default Rufi.services({${servicesConfigContent}
});
`;
    }
}
