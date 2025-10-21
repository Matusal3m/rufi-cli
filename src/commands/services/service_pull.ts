import { Git } from '@/modules';
import { Command, Option, UsageError } from 'clipanion';

export class ServicePull extends Command<RufiToolsContext> {
    static paths = [['service:pull']];
    static usage = Command.Usage({
        category: 'Service',
        description: 'Pull updates for a specific service from the source',
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
            await this.pullAll(git);
            return;
        }

        await this.pullOne(git, this.service!);
    }

    private async hasServicelocally(service: string) {
        const { Services } = this.context;
        const services = await Services.local();
        return services.some(s => s === service);
    }

    private async pullOne(git: Git, serviceName: string) {
        const { Services } = this.context;

        const service = await Services.getConfig(serviceName);

        const hasServicelocally = await this.hasServicelocally(serviceName);
        if (!hasServicelocally) {
            throw new UsageError(
                `Service "${service}" does not exist locally.`
            );
        }

        const {
            git: { repository },
        } = service;
        await git.pull(repository, {
            name: serviceName,
            verbose: this.verbose,
            rootDir: process.cwd() + '/services',
        });
    }

    private async pullAll(git: Git) {
        const { Services } = this.context;

        const services = await Services.local();

        const promises = [];
        for (const service of services) {
            const config = await Services.getConfig(service);
            const { repository, branch } = config.git;
            const { enable } = config;

            if (!enable) continue;

            const promise = git.pull(repository, {
                name: service,
                verbose: this.verbose,
                rootDir: process.cwd() + '/services',
                branch,
            });
            promises.push(promise);
        }

        await Promise.all(promises);
    }
}
