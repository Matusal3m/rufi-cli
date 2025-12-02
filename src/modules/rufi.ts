import { Builtins, Cli } from 'clipanion';
import { File, RufiLogger } from '@/utils';
import { Init } from '../commands/common/init';
import path from 'path';
import fs from 'fs/promises';

export type PGConfig = {
    host: string;
    database: string;
    user: string;
    port: number;
    password: string;
};

export type GitConfig = {
    token: string;
    username: string;
};

export interface RufiConfig {
    git: GitConfig;
    postgres: PGConfig;
    env: 'development' | 'production';
    coreService: string;
}

export type ServiceConfig = {
    git: {
        repository: string;
        branch: string;
    };
    migrations?: {
        parse?: 'prisma';
        directory: string;
    };
    enable: boolean;
};

export type ServicesConfig = Record<string, ServiceConfig>;

type RegisterFunction = (cli: Cli) => void;

export class Rufi {
    // to enable multiple commands call with the same Rufi instance on test cases
    private loadedCommands = false;

    private dependencies: Record<string, string> = {};

    private readonly cli = new Cli({
        binaryLabel: `The Rufi CLI`,
        binaryName: `rufi`,
    });

    constructor(public readonly config: RufiConfig) {}

    static services(services: ServicesConfig): ServicesConfig {
        return services;
    }

    static async init() {
        const cli = new Cli({
            binaryLabel: `The Rufi CLI`,
            binaryName: `rufi`,
        });

        cli.register(Init);
        // @ts-ignore
        await cli.runExit(process.argv.slice(2), { Logger: RufiLogger });
        process.exit(0);
    }

    async run(args?: string[]) {
        if (!this.loadedCommands) {
            const commandPath = path.join(
                import.meta.dirname,
                '..',
                'commands',
            );
            const commands = await fs.readdir(commandPath);

            await this.loadCommands(commandPath, commands);
            this.cli.register(Builtins.HelpCommand);

            this.loadedCommands = true;
        }

        args = args || this.getArgs();

        await this.cli.run(args, this.dependencies);
        if (process.env.NODE_ENV !== 'test') process.exit(0);
    }

    public setDependencies(deps: Record<string, any>) {
        this.dependencies = deps;
    }

    private async loadCommands(commandPath: string, commands: string[]) {
        for (const command of commands) {
            const register = await this.getCommandRegister(
                commandPath,
                command,
            );

            if (!register) {
                RufiLogger.warn(
                    `Could not find register method to ${command} command`,
                );
                continue;
            }

            register(this.cli);
        }
    }

    private getFileExtension() {
        const ext = import.meta.filename.split('.').at(-1);
        if (!ext) throw new Error('Could not find cli extension type');
        return ext;
    }

    private async getCommandRegister(
        commandPath: string,
        command: string,
    ): Promise<RegisterFunction | null> {
        const ext = this.getFileExtension();

        const commandRegister = path.resolve(
            commandPath,
            command,
            `index.${ext}`,
        );

        const fileExists = await File.exists(commandRegister);
        if (!fileExists) return null;

        const { default: register } = await File.require<any>(commandRegister);
        return register;
    }

    private getArgs() {
        const [_node, _app, ...args] = process.argv;
        return args;
    }
}
