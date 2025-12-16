import { Command } from 'clipanion';
import { PassThrough } from 'stream';
import fs from 'fs/promises';
import path from 'path';

export class Reset extends Command<RufiToolsContext> {
    static paths = [['reset']];
    static usage = Command.Usage({
        category: 'Common',
        description: 'Removes all services and clear the migration registry',
    });

    async execute() {
        const { Services, Logger } = this.context;

        Logger.info('Starting reset process...');

        if (process.env['ENV'] !== 'development') {
            console.warn(
                'Reset command can only be run in development environment',
            );
            Logger;
        }

        Logger.info('Running database reset...');
        await this.cli.run(['db:reset'], {
            stdin: new PassThrough(),
        });
        Logger.info('Database reset completed successfully');

        const services = await Services.local();

        for (const service of services) {
            const servicePath = path.join(process.cwd(), 'services', service);

            try {
                Logger.info(`Removing service: ${service}`);
                await fs.rm(servicePath, { recursive: true, force: true });
                Logger.info(`Successfully removed service: ${service}`);
            } catch (error) {
                Logger.error(`Failed to remove service: ${service}`);
            }
        }

        Logger.info('Reset process completed successfully');
    }
}
