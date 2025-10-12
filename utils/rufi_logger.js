import { color } from "./color.js";

export class RufiLogger {
    static info(message) {
        console.info(`${color.blue(">")} ${message}`);
    }

    static success(message) {
        console.info(`${color.green("✔")} ${message}`);
    }

    static warn(message) {
        console.warn(`${color.yellow("!")} ${message}`);
    }

    static error(message) {
        console.error(`${color.red("✖")} ${message}`);
    }

    static skip(message) {
        console.info(`${color.cyan("↷")} ${message}`);
    }

    static bullet(message) {
        console.info(`   ${color.gray("•")} ${message}`);
    }

    static section(title) {
        console.info(`\n${color.blue(">")} ${color.cyan(title)}\n`);
    }

    static divider() {
        console.info(
            color.gray("--------------------------------------------------"),
        );
    }
}
