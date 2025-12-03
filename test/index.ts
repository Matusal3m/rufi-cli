import { ServicesConfig } from '../src/modules';
import { CLITester } from './cli-tester';
import { EnvironmentManager } from './environment-manager';

(async () => {
    const realServices: ServicesConfig = {
        rufi: {
            enable: true,
            git: {
                branch: 'master',
                repository: 'github/Coacervados/rufi-panel',
            },
        },
        stock: {
            enable: true,
            migrations: {
                parse: 'prisma',
                directory: 'prisma/migrations',
            },
            git: {
                branch: 'main',
                repository: 'github/Coacervados/kaution-system',
            },
        },
    };

    const envManager = new EnvironmentManager(realServices, {
        withFakeServices: true,
    });

    const config = envManager.configFromEnv();

    await new CLITester(config)
        .beforeRun(async () => {
            await envManager.writeConfigFile();
        })
        .afterRun(async () => {
            await envManager.removeConfigFile();
            await envManager.removeServiceDir();
        })
        .testBlock('Logs test', register => {
            register('Log nomes', () => {
                console.log(['matusalem', 'livia']);
            });
            register('Log coisas', () => {
                console.log(['mesa', 'cadeira', 'lapis']);
            });
            register('Log comidas', () => {
                console.log(['banana', 'maçã', 'pão']);
            });
        })
        .run();
})();
