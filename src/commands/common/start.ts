import { Command } from 'clipanion';
import { PassThrough } from 'stream';
import { RufiLogger, color } from '@/utils';
import { Services } from '@/modules';

export class Start extends Command {
    static paths = [['start']];

    static usage = Command.Usage({
        category: 'Common',
        description:
            'Initializes the environment by cloning all services and applying database migrations.',
    });

    async execute() {
        const services = await Services.local();
        const hasServices = services.length;

        if (hasServices) {
            RufiLogger.error(
                `The ${color.gray(
                    'start'
                )} command can only be executed when there are no initialized services.`
            );
        }

        RufiLogger.info('Starting RUFI environment...');

        await this.cli.run(['service:clone', '--all'], {
            stdout: new PassThrough(),
        });

        await this.cli.run(['migration:all'], {
            stdout: new PassThrough(),
        });

        RufiLogger.success('✅ Environment successfully initialized!');
    }
}
