import { Builtins, Cli, Command } from 'clipanion';
import { platform } from 'os';
import { File, RufiLogger } from '@/utils';
import path from 'path';
import fs from 'fs/promises';
import { Init } from '../commands/common/init';
import type { ServiceConfig } from '@/modules';

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

type Services = Record<string, Omit<ServiceConfig, 'name'>>;

type RegisterFunction = (cli: Cli) => void;

export class Rufi {
    private dependencies: Record<string, string> = {};

    private readonly cli = new Cli({
        binaryLabel: `The Rufi CLI`,
        binaryName: `rufi`,
    });

    constructor(public readonly config: RufiConfig) {}

    static services(services: Services): ServiceConfig[] {
        const servicesConfig = [];
        for (const service in services) {
            const serviceConfig = { name: service, ...services[service] };
            servicesConfig.push(serviceConfig);
        }
        return servicesConfig;
    }

    static async init() {
        const cli = new Cli({
            binaryLabel: `The Rufi CLI`,
            binaryName: `rufi`,
        });

        await cli.runExit(new Init());
        process.exit(0);
    }

    async run() {
        const commandPath = path.join(import.meta.dirname, '..', 'commands');
        const commands = await fs.readdir(commandPath);

        await this.loadCommands(commandPath, commands);

        const args = this.getArgs();

        this.cli.register(Builtins.HelpCommand);
        console.log(this.dependencies);
        await this.cli.runExit(args, this.dependencies);
        process.exit(0);
    }

    public setDependencies(deps: Record<string, any>) {
        this.dependencies = deps;
    }

    private async loadCommands(commandPath: string, commands: string[]) {
        for (const command of commands) {
            const register = await this.getCommandRegister(
                commandPath,
                command
            );

            if (!register) {
                RufiLogger.warn(
                    `Could not find register method to ${command} command`
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
        command: string
    ): Promise<RegisterFunction | null> {
        const ext = this.getFileExtension();

        const commandRegister = path.resolve(
            platform() ? 'C:\\' : '',
            commandPath,
            command,
            `index.${ext}`
        );

        const fileExists = await File.exists(commandRegister);
        if (!fileExists) return null;

        const { default: register } = await import(commandRegister);
        return register;
    }

    private getArgs() {
        const [_node, _app, ...args] = process.argv;
        return args;
    }
}
