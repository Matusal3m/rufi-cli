import { ServicesConfig } from '../src/modules/cli_core';
import { EnvironmentManager, ProcessTester } from '../src/modules/test';

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

    await new ProcessTester(config)
        .beforeRun(async () => {
            await envManager.writeConfigFile();
        })
        .afterRun(async () => {
            await envManager.removeConfigFile();
            await envManager.removeServiceDir();
            await envManager.removeMockedServices();
        })
        .testBlock('Services Process', register => {
            register('test a log', () => {
                console.log({ data: 'from test block' })
            })
        })
        .test('Test help function', ['--help'])
        .test('Test Rufi Start', ['start'])
        .run();
})();
