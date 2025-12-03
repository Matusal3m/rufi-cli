import { Rufi, RufiConfig } from '@/cli-core';
import { color, Log } from '@/utils';
import { RufiMock } from './rufi-mock';

type CommandTest = string[];
type ProcessTest = TestCase[];

type TestCase = { name: string; treatment: Treatment };
type Treatment = CommandTest | ProcessTest | (() => any);

type RegisterTestProcessCase = (name: string, treatment: Treatment) => any;

export class ProcessTester {
    private readonly testCases: TestCase[] = [];
    private afterRunCB: () => any = () => {};
    private beforeRunCB: () => any = () => {};

    constructor(private readonly rufiConfig: RufiConfig) {}

    public testBlock(
        name: string,
        testBlock: (register: RegisterTestProcessCase) => any,
    ) {
        const testsFromBlock: TestCase[] = [];

        const pushTests: RegisterTestProcessCase = (name, treatment) => {
            testsFromBlock.push({ name, treatment });
        };

        testBlock(pushTests);
        this.testCases.push({ name, treatment: testsFromBlock });

        return this;
    }

    public test(name: string, args: Treatment) {
        this.testCases.push({ name, treatment: args });
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

            await this.runTestCases(rufi, this.testCases);
        } catch (error) {
            console.error('Error on test cases', error);
        } finally {
            await this.afterRunCB();
            process.exit(1);
        }
    }

    private async runTestCases(rufi: Rufi, testCases: TestCase[]) {
        for (const test of testCases) {
            const { name, treatment } = test;

            const arrowsCount = this.testCases === testCases ? 1 : 5;
            Log.section(`Test case: ${color.bold(name)}`, arrowsCount);

            if (this.isProcessTest(treatment)) {
                Log.bullet(
                    `${color.yellow('Process test length:')} ${color.blue(
                        String(treatment.length),
                    )}`,
                );
                await this.runTestCases(rufi, treatment);
                continue;
            }

            if (this.isCommand(treatment)) {
                Log.bullet(
                    `${color.yellow('Command(s):')} ${color.blue(
                        treatment.join(', '),
                    )}`,
                );
                await rufi.run(treatment);
                continue;
            }

            if (this.isCallback(treatment)) {
                Log.bullet(color.yellow(`Callback test`));
                await treatment();
                continue;
            }
        }
    }

    private isProcessTest(treatment: Treatment): treatment is ProcessTest {
        return (
            Array.isArray(treatment) &&
            treatment.length > 0 &&
            typeof treatment[0] === 'object' &&
            'name' in treatment[0] &&
            'treatment' in treatment[0]
        );
    }

    private isCommand(treatment: Treatment): treatment is CommandTest {
        return (
            Array.isArray(treatment) &&
            (treatment.length === 0 || typeof treatment[0] === 'string')
        );
    }

    private isCallback(treatment: Treatment): treatment is () => any {
        return typeof treatment === 'function';
    }
}
