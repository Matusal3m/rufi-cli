import { Command, Option, UsageError } from 'clipanion';
import { Git } from '@/modules';

export class ServiceClone extends Command<RufiToolsContext> {
    static paths = [['service:clone']];
    static usage = Command.Usage({
        category: 'Service',
        description: 'Pull one or all services from the source',
    });

    service = Option.String({ required: false });
    all = Option.Boolean('--all', false);
    verbose = Option.Boolean('--verbose', false);

    async execute() {
        const { config } = this.context;

        const token = config.git.token;
        const username = config.git.username;
        const git = new Git(username, token);

        if (!this.all && !this.service) {
            throw new UsageError('Specify at least one: <service> or --all');
        }

        if (this.service && this.all) {
            throw new UsageError(
                'Only one can be selected: <service> or --all'
            );
        }

        if (this.all) {
            await this.cloneAll(git);
            return;
        }

        await this.cloneOne(git, this.service!);
    }

    private async cloneOne(git: Git, serviceName: string) {
        const { Services, Logger } = this.context;

        const service = await Services.getConfig(serviceName);
        if (!service || !service.enable) {
            Logger.warn('The service is invalid or is not enabled');
            return;
        }

        const {
            git: { repository },
        } = service;
        await git.clone(repository, {
            name: serviceName,
            verbose: this.verbose,
            rootDir: process.cwd() + '/services',
        });
    }

    private async cloneAll(git: Git) {
        const { Services } = this.context;

        const servicesConfigs = await Services.configs();

        const promises = [];
        for (const serviceName in servicesConfigs) {
            const { repository } = servicesConfigs[serviceName].git;
            const { enable } = servicesConfigs[serviceName];

            if (!enable) continue;

            const promise = git.clone(repository, {
                name: serviceName,
                verbose: this.verbose,
                rootDir: process.cwd() + '/services',
            });
            promises.push(promise);
        }

        await Promise.all(promises);
    }
}
