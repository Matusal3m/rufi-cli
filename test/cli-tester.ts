import { RufiConfigSession } from './rufi-config-session';
import { Runner, RunnerOptions } from './runner';

type CLITesterOptions = {
    logFinalData?: boolean;
};

export class CLITester {
    constructor(
        private readonly runner: Runner,
        private readonly configSession: RufiConfigSession,
        private readonly options?: CLITesterOptions & {
            runner?: RunnerOptions;
        },
    ) {}

    case(name: string, params?: string[]) {
        this.runner.add(name, params);
        return this;
    }

    private async beforeTest() {
        if (this.options?.runner) this.runner.setOptions(this.options?.runner);

        await this.configSession.write();
    }

    private async afterTest() {
        await this.configSession.delete();
    }

    async test() {
        await this.beforeTest();

        const data = await this.runner.run();
        if (this.options?.logFinalData) {
            console.info(data);
        }

        await this.afterTest();
    }
}
