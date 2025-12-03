import { Migrations } from '@/migration';
import { Log } from '../../utils';
import { Rufi, RufiConfig, Services } from '@/cli-core';
import { MigrationsRegistry, ServicesPersistence } from '../../persistence';

export class RufiMock {
    constructor(private readonly config: RufiConfig) {}

    async get() {
        const dependencies = await this.getDepencencies();
        const rufi = new Rufi(this.config);
        rufi.setDependencies(dependencies);
        return rufi;
    }

    private async getDepencencies() {
        // TODO: improve the abstraction to mock the dependencies
        const servicesPersistence = new ServicesPersistence(
            this.config.postgres,
        );
        const migrationsRegistry = new MigrationsRegistry(this.config.postgres);

        await migrationsRegistry.init();

        const services = new Services(
            servicesPersistence,
            migrationsRegistry,
            this.config,
        );
        const migrations = new Migrations(migrationsRegistry, services);

        return {
            Services: services,
            Migrations: migrations,
            Logger: Log,
            config: this.config,
        };
    }
}
