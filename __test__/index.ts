import {
    EnvironmentManager,
    EnvironmentManagerOptions,
    ProcessTester,
} from '../src/modules/test';

(async () => {
    const { default: servicesConfig } = await import('./services');

    const options: EnvironmentManagerOptions = {
        withFakeServices: true,
    };
    const envManager = new EnvironmentManager(servicesConfig(), options);
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
