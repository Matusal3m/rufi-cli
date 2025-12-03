import { Migrations, Rufi, RufiConfig, Services } from '../src/modules';
import { RufiLogger } from '../src/utils';
import { MigrationsRegistry, ServicesPersistence } from '../src/persistence';

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
            Logger: RufiLogger,
            config: this.config,
        };
    }
}
