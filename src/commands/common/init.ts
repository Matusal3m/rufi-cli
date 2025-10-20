import { Format, File } from '@/utils';
import { Command, Option } from 'clipanion';
import path from 'path';
import fs from 'fs/promises';

export class Init extends Command<RufiToolsContext> {
    static paths?: string[][] | undefined = [['init']];
    static usage = Command.Usage({
        category: 'Common',
        description: `
            Creates a rufi.config.js file with the default configurations.
            If --with-services is included, also creates the services.config.js.
            `,
    });

    withServices = Option.Boolean('--with-services');

    private readonly logger = this.context.logger;

    async execute() {
        const configPath = path.join(process.cwd(), 'rufi.config.js');

        const alreadyExistsConfig = await File.exists(configPath);
        if (this.withServices) {
            const servicesDir = path.join(process.cwd(), 'services');

            const hasServicesDir = await File.exists(servicesDir);
            if (!hasServicesDir) {
                await fs.mkdir(servicesDir);
            }

            const servicesConfigPath = path.join(
                servicesDir,
                'services.config.js'
            );

            const servicesConfig = `
            import { Rufi } from 'rufi-cli';

            export default Rufi.services({
                core: {
                    repository: "github.com/Coacervados/rufi",
                    enable: true,
                },
                stock: {
                    repository: "github.com/Coacervados/stock-project",
                    enable: true,
                    parseMethod: "prisma",
                    directoryToParse: "database/prisma/migrations",
                },
            });`;

            const formattedServicesConfig =
                Format.template.withIndent(servicesConfig);
            await fs.writeFile(servicesConfigPath, formattedServicesConfig);
            this.logger.success('Services config file created successfully.');
        }

        if (alreadyExistsConfig) {
            this.logger.error('The config file already exists.');
            process.exit(1);
        }

        const configContent = `
            import { Rufi } from 'rufi-cli';
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
                env: 'development',
                coreService: env('CORE_SERVICE'),
            });`;

        const formattedConfig = Format.template.withIndent(configContent);
        await fs.writeFile(configPath, formattedConfig);
        this.logger.success('Rufi config file created successfully.');
    }
}
