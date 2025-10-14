import { color } from './color';

export class RufiLogger {
    static info(message: string) {
        console.info(`${color.blue('>')} ${message}`);
    }

    static success(message: string) {
        console.info(`${color.green('✔')} ${message}`);
    }

    static warn(message: string) {
        console.warn(`${color.yellow('!')} ${message}`);
    }

    static error(message: string) {
        console.error(`${color.red('✖')} ${message}`);
    }

    static skip(message: string) {
        console.info(`${color.cyan('↷')} ${message}`);
    }

    static bullet(message: string) {
        console.info(`   ${color.gray('•')} ${message}`);
    }

    static section(title: string) {
        console.info(`\n${color.blue('>')} ${color.cyan(title)}\n`);
    }

    static divider() {
        console.info(
            color.gray('--------------------------------------------------'),
        );
    }
}
