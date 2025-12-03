import { RufiConfig, ServiceConfig, ServicesConfig } from '../src/modules';
import { ServiceConfigGenerator } from './service-config-generator';
import { Format } from '../src/utils';
import fs from 'fs/promises';
import { faker } from '@faker-js/faker';
import { join } from 'path';

type EnvironmentManagerOptions = {
    withFakeServices?: boolean;
    fakeServicesCount?: number;
};

export class EnvironmentManager {
    private readonly filepath = 'services/services.config.js';
    private readonly configGenerator = new ServiceConfigGenerator();
    private readonly servicesDir = 'services';
    private readonly mockedServices: string[] = [];

    public constructor(
        private readonly services: ServicesConfig,
        private readonly options?: EnvironmentManagerOptions,
    ) {}

    public async writeConfigFile() {
        await fs.mkdir(this.servicesDir, { recursive: true });

        const services = await this.getServices();
        const configString = this.configGenerator.generate(services);
        const formatedConfig = Format.template.withIndent(configString);

        await fs.writeFile(this.filepath, formatedConfig, 'utf-8');
    }

    public removeServiceDir() {
        return fs.rm(this.servicesDir, { recursive: true, force: true });
    }

    public removeConfigFile() {
        return fs.rm(this.filepath, { force: true });
    }

    public configFromEnv(): RufiConfig {
        const env = (varEnv: string) => process.env[varEnv] || '';

        const portNumber = parseInt(env('POSTGRES_PORT'), 10);
        const port = isNaN(portNumber) ? 5432 : portNumber;

        return {
            git: {
                token: env('GIT_TOKEN'),
                username: env('GIT_USERNAME'),
            },
            postgres: {
                host: env('POSTGRES_HOST'),
                database: env('POSTGRES_DATABASE'),
                user: env('POSTGRES_USER'),
                port: port,
                password: env('POSTGRES_PASSWORD'),
            },
            env: 'development',
            coreService: env('CORE_SERVICE'),
        };
    }

    private async getServices() {
        let services = this.services;

        if (this.options?.withFakeServices) {
            const fakeServices = this.generateFakeServices();
            services = { ...services, ...fakeServices };

            for (const serviceName in fakeServices) {
                const fakeService = fakeServices[serviceName];
                await this.makeServiceMock(serviceName, fakeService);
            }
        }

        return services;
    }

    private generateFakeServices() {
        const count =
            this.options?.fakeServicesCount ||
            faker.number.int({ min: 1, max: 8 });

        const fakeServices: ServicesConfig = {};
        for (let i = 0; i < count; i++) {
            const noun = faker.word.noun();
            fakeServices[noun] = {
                enable: faker.helpers.arrayElement([true, false]),
                git: {
                    branch: faker.git.branch(),
                    repository: `github.com/company/${noun}`,
                },
                migrations: faker.helpers.maybe(() => ({
                    directory: 'prisma/migrations',
                    parse: 'prisma',
                })),
            };
        }
        return fakeServices;
    }

    private async makeServiceMock(serviceName: string, service: ServiceConfig) {
        const serviceDir = join(
            this.servicesDir,
            serviceName,
            service.migrations?.directory || 'migrations',
        );

        this.mockedServices.push(serviceDir);

        await fs.mkdir(serviceDir, { recursive: true });
    }
}
