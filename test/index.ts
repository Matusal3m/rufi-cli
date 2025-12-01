import { CLITester } from './cli-tester';
import { RufiConfigSession } from './rufi-config-session';
import { Runner } from './runner';

(async () => {
    const runner = new Runner('dist/cli.js', {
        build: true,
        overrideBuild: true,
    });

    const configSession = new RufiConfigSession();
    try {
        await new CLITester(runner, configSession, { logFinalData: true })
            .case('start up')
            .test();
    } catch (error) {
        configSession.delete();
        console.error('Error running test');
        console.error(error);
    }
})();
