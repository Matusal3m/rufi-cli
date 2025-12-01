import { join } from 'path';
import { File, Format } from '../src/utils';
import fs from 'fs/promises';

export class RufiConfigSession {
    private path = join(process.cwd(), 'dist', 'rufi.config.js');
    private wasGenerated = false;

    async write() {
        if (await File.exists(this.path)) return;

        const configContent = this.getConfigContent();
        const formattedConfig = Format.template.withIndent(configContent);
        await fs.writeFile(this.path, formattedConfig);
        this.wasGenerated = true;
    }

    async delete() {
        if (!this.wasGenerated) return;
        await fs.rm(this.path);
    }

    private getConfigContent() {
        return `
            import { Rufi } from '.';
            // Comment or remove that block if you're using any runtime that loads .env automatically
            // import path from 'path';
            // const envPath = path.join(process.cwd(), '.env');
            // process.loadEnvFile(envPath);

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
    }
}
