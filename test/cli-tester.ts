import { Rufi, RufiConfig } from '../src/modules';
import { color, RufiLogger as Log } from '../src/utils';
import { RufiMock } from './rufi-mock';

type CLITesterOptions = {
    logFinalData?: boolean;
};

export interface Session {
    start(): Promise<void> | void;
    end(): Promise<void> | void;
}

type TestCaseInfo = { name: string; args?: string[] };
type TestCase = (caseInfo: TestCaseInfo) => any;

type Callback = () => any;
type TestCaseBlockInfo = Array<TestCaseInfo | Callback>;

export class CLITester {
    private readonly testCases: Array<TestCaseInfo | TestCaseBlockInfo> = [];
    private afterRunCB: () => any = () => {};
    private beforeRunCB: () => any = () => {};

    constructor(
        private readonly rufiConfig: RufiConfig,
        private readonly options?: CLITesterOptions,
    ) {}

    public testBlock(test: (register: TestCase | Callback) => any) {
        const testBlock: TestCaseBlockInfo = [];
        test(testBlock.push);
        this.testCases.push(testBlock);
    }

    public test(name: string, args?: string[]) {
        this.testCases.push({ name, args });
        return this;
    }

    public afterRun(callback: () => any) {
        this.afterRunCB = callback;
        return this;
    }

    public beforeRun(callback: () => any) {
        this.beforeRunCB = callback;
        return this;
    }

    public async run() {
        try {
            await this.beforeRunCB();

            const rufi = await new RufiMock(this.rufiConfig).get();

            await this.runTestCases(rufi);
        } catch (error) {
            console.error('Error on test cases', error);
        } finally {
            await this.afterRunCB();
            process.exit(1);
        }
    }

    private async runTestCases(rufi: Rufi) {
        for (const testCase of this.testCases) {
            if (Array.isArray(testCase)) {
                await this.runTestCaseBlock(rufi, testCase);
                continue;
            }

            await this.runTestCase(rufi, testCase);
        }
    }

    private async runTestCase(rufi: Rufi, { name, args }: TestCaseInfo) {
        Log.section(`Testing case: ${name}`);

        await rufi.run(args);
        const argsMessage = args ? `With args: ${args.join(', ')}` : 'None';

        Log.bullet(color.blue(argsMessage));
    }

    private async runTestCaseBlock(
        rufi: Rufi,
        testCaseBlock: TestCaseBlockInfo,
    ) {
        Log.section('Running test block');

        for (const testCase of testCaseBlock) {
            if (typeof testCase === 'function') {
                await testCase();
                continue;
            }
            this.runTestCase(rufi, testCase);
        }
    }
}
