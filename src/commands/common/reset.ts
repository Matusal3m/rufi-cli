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

    private readonly services = this.context.services;
    private readonly logger = this.context.logger;

    async execute() {
        this.logger.info('Starting reset process...');

        if (process.env['ENV'] !== 'development') {
            console.warn(
                'Reset command can only be run in development environment'
            );
            this.logger;
        }

        this.logger.info('Running database reset...');
        await this.cli.run(['db:reset'], {
            stdin: new PassThrough(),
        });
        this.logger.info('Database reset completed successfully');

        const services = await this.services.local();

        for (const service of services) {
            const servicePath = path.join(process.cwd(), 'services', service);

            try {
                this.logger.info(`Removing service: ${service}`);
                await fs.rm(servicePath, { recursive: true, force: true });
                this.logger.info(`Successfully removed service: ${service}`);
            } catch (error) {
                this.logger.error(`Failed to remove service: ${service}`);
            }
        }

        this.logger.info('Reset process completed successfully');
    }
}
