import { color } from '@/utils';
import { ProcessWrapper } from './process_wrapper';
import * as path from 'node:path';

type DefaultGitOptions = {
    name?: string;
    verbose?: boolean;
    rootDir?: string;
};

type PullOptions = {
    branch?: string;
} & DefaultGitOptions;

type DiffOptions = {
    args: string[];
} & Omit<DefaultGitOptions, 'name'>;

export class Git extends ProcessWrapper {
    constructor(
        private username?: string,
        private token?: string,
    ) {
        super('git');
        this.ensureExistence();
    }

    url(repository: string) {
        const auth = this.username && this.token;
        return auth
            ? `https://${this.username}:${this.token}@${repository}.git`
            : `https://${repository}.git`;
    }

    clone(repository: string, { name, verbose, rootDir }: DefaultGitOptions) {
        rootDir = rootDir || process.cwd();
        const url = this.url(repository);

        const target = path.join(rootDir, name || '');
        const git = this.spawn('git', ['clone', url, target], verbose);

        let errorMessage = '';
        git.stderr?.on('data', data => {
            errorMessage += String(data);
        });

        const successMessage = `Repository ${color.bold(
            repository,
        )} cloned successfully to: ${color.bold(
            name || repository.split('/').at(-1)!,
        )}`;

        return this.promisify(git, successMessage, errorMessage);
    }

    pull(repository: string, { branch, rootDir, verbose, name }: PullOptions) {
        const url = this.url(repository);
        const gitDir = path.join(rootDir ?? process.cwd(), name || repository);

        const git = this.spawnShell(
            `cd ${gitDir} && git pull ${url} ${branch ?? 'master'}`,
            verbose,
        );

        const successMessage = `Repository ${color.bold(
            repository,
        )} pulled successfully${branch ? ` on branch ${branch}` : ''}.`;

        let errorMessage = '';
        git.stderr?.on('data', data => {
            errorMessage += String(data);
        });

        return this.promisify(git, successMessage, errorMessage);
    }

    async diff(name: string, { verbose, rootDir, args }: DiffOptions) {
        const gitDir = path.join(rootDir ?? process.cwd(), name || '');

        const git = this.spawnShell(
            `cd ${gitDir} && git diff ${args.join(' ')}`,
            verbose,
        );

        let data = '';
        git.stdout?.on('data', chunk => {
            data += String(chunk);
        });

        await this.promisify(git);

        return data;
    }
}
