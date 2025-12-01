import { ChildProcess, execSync, fork } from 'child_process';
import { File } from '../src/utils';
import { join } from 'path';
import { chdir } from 'process';

export type RunnerOptions = {
    build?: boolean;
    overrideBuild?: boolean;
};

type ProcessRegister = { name: string; params?: string[] };

export class Runner {
    private readonly processes: ProcessRegister[] = [];

    constructor(
        private readonly filepath: string,
        private options: RunnerOptions,
    ) {}

    public async run() {
        if (this.options.build) {
            this.buildProject();
        }

        await this.ensureFilepath();

        const promises = this.processes.map(({ name, params }) => {
            const child = fork(this.filepath, { execArgv: params });
            return this.addListeners(name, child);
        });

        return Promise.all(promises);
    }

    public async ensureFilepath() {
        const existsFile = await File.exists(this.filepath);
        if (!existsFile) {
            throw new Error(`File path ${this.filepath} does not exist`);
        }
    }

    public add(name: string, params?: string[]) {
        this.processes.push({ name, params });
    }

    private addListeners(name: string, child: ChildProcess): Promise<any> {
        return new Promise<{ name: string; data: string }>(
            (resolve, reject) => {
                let data = '';

                child.on('message', message => {
                    console.log(message);
                });

                child.stdout?.on('data', chunk => {
                    data += chunk;
                });

                child.on('error', err => {
                    reject(new ProcessError(name, err));
                });

                child.on('exit', code => {
                    if (code !== 0) {
                        return reject(
                            new Error(
                                `Process ${name} exited with code ${code}`,
                            ),
                        );
                    }

                    console.info(`Process ${name} finished successfully`);
                });

                resolve({ name, data: this.parse(data) });
            },
        );
    }

    private async buildProject() {
        const hasBuildFile = await File.exists(join(process.cwd(), 'dist'));

        if (hasBuildFile && !this.options.overrideBuild) return;

        execSync('npm run build', { stdio: 'inherit' });
    }

    private parse(data: string = '') {
        try {
            return JSON.parse(data);
        } catch {
            return data;
        }
    }

    public setOptions(options: RunnerOptions) {
        this.options = options;
    }
}

class ProcessError extends Error {
    constructor(processName: string, err: Error) {
        super(`Occurred an error while running process ${processName}`);
        console.error(err);
    }
}
