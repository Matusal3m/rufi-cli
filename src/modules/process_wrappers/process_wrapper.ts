import { ChildProcess, spawn, spawnSync } from 'node:child_process';
import { RufiLogger } from '@/utils';

export class ProcessWrapper {
    constructor(protected command: string) {}

    spawn(command: string, params: string[], verbose = false) {
        return spawn(command, params, {
            stdio: verbose ? 'inherit' : 'pipe',
        });
    }

    spawnShell(command: string, verbose = false) {
        return spawn(command, {
            stdio: verbose ? 'inherit' : 'pipe',
        });
    }

    ensureExistence(versionCommand = '--version') {
        const process = spawnSync(this.command, [versionCommand]);
        if (process.error) throw process.error;
    }

    promisify(
        process: ChildProcess,
        successMessage?: string,
        errorMessage?: string
    ) {
        return new Promise<void>((resolve, reject) => {
            process.on('close', code => {
                if (code !== 0 && errorMessage) {
                    if (errorMessage) RufiLogger.error(errorMessage);
                    reject();
                }

                if (successMessage) RufiLogger.success(successMessage);
                resolve();
            });
        });
    }
}
