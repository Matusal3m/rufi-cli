import { RufiConfig } from '../src/modules';
import { CLITester } from './cli-tester';
import { EnvironmentManager } from './environment-manager';

(async () => {
    const env = (varEnv: string) => process.env[varEnv] || '';

    const config: RufiConfig = {
        git: {
            token: env('GIT_TOKEN'),
            username: env('GIT_USERNAME'),
        },
        postgres: {
            host: env('POSTGRES_HOST'),
            database: env('POSTGRES_DATABASE'),
            user: env('POSTGRES_USER'),
            port: Number(env('POSTGRES_PORT')),
            password: env('POSTGRES_PASSWORD'),
        },
        env: 'development',
        coreService: env('CORE_SERVICE'),
    };

    const envManager = new EnvironmentManager({
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
    });

    await new CLITester(config, { logFinalData: true })
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
