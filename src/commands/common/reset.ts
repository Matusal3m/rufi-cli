import { Command } from 'clipanion';
import { PassThrough } from 'stream';
import { RufiLogger } from '@/utils';
import { Services } from '@/modules';
import * as fs from 'fs/promises';
import * as path from 'path';

export class Reset extends Command {
    static paths = [['reset']];
    static usage = Command.Usage({
        category: 'Common',
        description: 'Removes all services and clear the migration registry',
    });

    async execute() {
        RufiLogger.info('Starting reset process...');

        if (process.env['ENV'] !== 'development') {
            console.warn(
                'Reset command can only be run in development environment'
            );
            RufiLogger;
        }

        RufiLogger.info('Running database reset...');
        await this.cli.run(['db:reset'], {
            stdin: new PassThrough(),
        });
        RufiLogger.info('Database reset completed successfully');

        const services = await Services.local();

        for (const service of services) {
            const servicePath = path.join(process.cwd(), 'services', service);

            try {
                RufiLogger.info(`Removing service: ${service}`);
                await fs.rm(servicePath, { recursive: true, force: true });
                RufiLogger.info(`Successfully removed service: ${service}`);
            } catch (error) {
                RufiLogger.error(`Failed to remove service: ${service}`);
            }
        }

        RufiLogger.info('Reset process completed successfully');
    }
}
