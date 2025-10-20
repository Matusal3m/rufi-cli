import { Command, Option, UsageError } from 'clipanion';
import { Git } from '@/modules';

export class ServiceClone extends Command<RufiToolsContext> {
    static paths = [['service:clone']];
    static usage = Command.Usage({
        category: 'Service',
        description: 'Pull one or all services from the source',
    });

    service = Option.String({ required: false });
    all = Option.Boolean('--all');
    verbose = Option.Boolean('--verbose');

    private readonly services = this.context.services;
    private readonly logger = this.context.logger;

    async execute() {
        const token = this.context.config.git.token;
        const username = this.context.config.git.username;
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
        const service = await this.services.getConfig(serviceName);
        if (!service || !service.enable) {
            this.logger.warn('The service is invalid or is not enabled');
            return;
        }

        const { name, repository } = service;
        await git.clone(repository, {
            name,
            verbose: this.verbose,
            rootDir: process.cwd() + '/services',
        });
    }

    private async cloneAll(git: Git) {
        const servicesConfigs = await this.services.configs();
        const servicesEnabled = servicesConfigs.filter(
            service => service.enable
        );

        const promises = [];
        for (const { name, repository } of servicesEnabled) {
            const promise = git.clone(repository, {
                name,
                verbose: this.verbose,
                rootDir: process.cwd() + '/services',
            });
            promises.push(promise);
        }

        await Promise.all(promises);
    }
}
