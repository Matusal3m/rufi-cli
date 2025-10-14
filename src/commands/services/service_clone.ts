import { Command, Option, UsageError } from 'clipanion';
import { Services, Git } from '@/modules';
import { RufiLogger } from '@/utils';

export class ServiceClone extends Command {
    static paths = [['service:clone']];
    static usage = Command.Usage({
        category: 'Service',
        description: 'Pull one or all services from the source',
    });

    service = Option.String({ required: false });
    all = Option.Boolean('--all');
    verbose = Option.Boolean('--verbose');

    async execute() {
        const token = process.env['GIT_TOKEN'];
        const username = process.env['GIT_USERNAME'];
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
            await this.#cloneAll(git);
            return;
        }

        await this.#cloneOne(git, this.service!);
    }

    async #cloneOne(git: Git, serviceName: string) {
        const service = await Services.config(serviceName);
        if (!service || !service.enable) {
            RufiLogger.warn('The service is invalid or is not enabled');
            return;
        }

        const { name, repository } = service;
        await git.clone(repository, {
            name,
            verbose: this.verbose,
            rootDir: process.cwd() + '/services',
        });
    }

    async #cloneAll(git: Git) {
        const servicesConfigs = await Services.configs();
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
