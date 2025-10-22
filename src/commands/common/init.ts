import { Format, File } from '@/utils';
import { Command, Option } from 'clipanion';
import path from 'path';
import fs from 'fs/promises';

export class Init extends Command<RufiToolsContext> {
    static paths?: string[][] | undefined = [['init']];
    static usage = Command.Usage({
        category: 'Common',
        description: `
            Creates a rufi.config.(js|ts) file with the default configurations.
            If --with-services is included, also creates the services.config.(js|ts).
            `,
    });

    withServices = Option.Boolean('--with-services', false);

    ts = Option.Boolean('--ts', false);

    async execute() {
        const { Logger } = this.context;
        const ext = this.ts ? '.ts' : '.js';

        const configPath = path.join(process.cwd(), 'rufi.config');

        const alreadyExistsConfig = await File.hasJsOrTS(configPath);

        if (this.withServices) {
            await this.createServicesConfig(ext);
        }

        if (alreadyExistsConfig) {
            Logger.error('The config file already exists.');
            process.exit(1);
        }

        const configContent = `
            import { Rufi } from 'rufi-cli';
            // Comment or remove that block if you're using any runtime that loads .env automatically
            import path from 'path';
            const envPath = path.join(process.cwd(), '.env');
            process.loadEnvFile(envPath);

            const env = varEnv => process.env[varEnv] || '';

            export default new Rufi({
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
                env: env('ENV'),
                coreService: env('CORE_SERVICE'),
            });`;

        const formattedConfig = Format.template.withIndent(configContent);
        await fs.writeFile(configPath + ext, formattedConfig);
        Logger.success('Rufi config file created successfully.');
    }

    private async createServicesConfig(ext: '.ts' | '.js') {
        const { Logger } = this.context;

        const servicesDir = path.join(process.cwd(), 'services');

        const hasServicesDir = await File.exists(servicesDir);
        if (!hasServicesDir) {
            await fs.mkdir(servicesDir);
        }

        const servicesConfigPath = path.join(servicesDir, 'services.config');

        const alreadyExistsServicesConfig =
            await File.hasJsOrTS(servicesConfigPath);

        if (alreadyExistsServicesConfig) {
            Logger.error('The services config file already exists.');
            process.exit(1);
        }

        const servicesConfig = `
            import { Rufi } from "rufi-cli";

            export default Rufi.services({
                core: {
                    git: {
                        repository: "github.com/org/core",
                    },
                    enable: true,
                },
                stock: {
                    enable: true,
                    git: {
                        repository: "github.com/org/stock",
                    },
                    migrations: {
                        parse: "prisma",
                        directory: "database/prisma/migrations",
                    },
                },
            });`;

        const formattedServicesConfig =
            Format.template.withIndent(servicesConfig);

        await fs.writeFile(servicesConfigPath + ext, formattedServicesConfig);
        Logger.success('Services config file created successfully.');
    }
}
