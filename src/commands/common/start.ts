import { color } from '@/utils';
import { Command } from 'clipanion';
import { PassThrough } from 'stream';

export class Start extends Command<RufiToolsContext> {
    static paths = [['start']];

    static usage = Command.Usage({
        category: 'Common',
        description:
            'Initializes the environment by cloning all services and applying database migrations.',
    });

    private readonly services = this.context.services;
    private readonly logger = this.context.logger;

    async execute() {
        const services = await this.services.local();
        const hasServices = services.length;

        if (hasServices) {
            this.logger.error(
                `The ${color.gray(
                    'start'
                )} command can only be executed when there are no initialized services.`
            );
        }

        this.logger.info('Starting RUFI environment...');

        await this.cli.run(['service:clone', '--all'], {
            stdout: new PassThrough(),
        });

        await this.cli.run(['migration:all'], {
            stdout: new PassThrough(),
        });

        this.logger.success('✅ Environment successfully initialized!');
    }
}
