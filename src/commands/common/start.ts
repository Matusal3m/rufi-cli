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

    async execute() {
        const { Services, Logger } = this.context;

        const services = await Services.local();
        const hasServices = services.length;

        if (hasServices) {
            Logger.error(
                `The ${color.gray(
                    'start'
                )} command can only be executed when there are no initialized services.`
            );
        }

        Logger.info('Starting RUFI environment...');

        await this.cli.run(['service:clone', '--all'], {
            stdout: new PassThrough(),
        });

        await this.cli.run(['migration:all'], {
            stdout: new PassThrough(),
        });

        Logger.success('✅ Environment successfully initialized!');
    }
}
