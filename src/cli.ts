#!/usr/bin/env node

import path from 'path';
import { color, File, RufiLogger } from '@/utils';
import { Rufi } from './modules/rufi';
import { Migrations, Services } from './modules';
import { MigrationsRegistry, ServicesPersistence } from './persistence';

(async () => {
    const rufiConfigPath = await File.hasJsOrTS(
        path.join(process.cwd(), 'rufi.config')
    );

    const command = process.argv[2];

    if (command == 'init') {
        await Rufi.init();
        process.exit(0);
    }

    if (!rufiConfigPath) {
        RufiLogger.error('The Rufi config file was not found.');
        const initCommand = color.bold('rufi init');
        RufiLogger.info(`Run ${initCommand} to create a Rufi config file.`);
        process.exit(1);
    }

    const { default: rufi } = await File.require<Rufi>(rufiConfigPath);

    const servicesPersistence = new ServicesPersistence(rufi.config.postgres);
    const migrationsRegistry = new MigrationsRegistry(rufi.config.postgres);

    await migrationsRegistry.init();

    const services = new Services(
        servicesPersistence,
        migrationsRegistry,
        rufi.config
    );
    const migrations = new Migrations(migrationsRegistry, services);

    rufi.setDependencies({
        Services: services,
        Migrations: migrations,
        Logger: RufiLogger,
        config: rufi.config,
    });

    await rufi.run();
})();
