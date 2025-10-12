import { Cli, Builtins, UsageError } from "clipanion";
import { RufiManagementRegistry } from "./persistence/rufi_management_registry.js";
import { RufiPersistence } from "./persistence/rufi_persistence.js";
import { RufiLogger } from "./utils/rufi_logger.js";
import { color } from "./utils/color.js";
import fs from "fs";
import path from "path";

if (!process.cwd().endsWith("rufi")) {
    throw new UsageError("You should this CLI inside the Rufi project");
}

try {
    RufiManagementRegistry.initialize();
    await RufiPersistence.connect();
} catch (error) {
    RufiLogger.error(
        color.red("Something whent wrong with the persitence layer..."),
    );
    process.exit(1);
}

const [_node, _app, ...args] = process.argv;

const cli = new Cli({
    binaryLabel: `The Rufi CLI`,
    binaryName: `rufi`,
    binaryVersion: `1.0.0`,
    enableColors: true,
});

const commandsPath = path.join(process.cwd(), "cli", "commands");
const commands = fs.readdirSync(commandsPath);

for (const command of commands) {
    let commandRegister = path.resolve(commandsPath, command, "index.js");
    if (!fs.existsSync(commandRegister)) continue;

    if (commandRegister.startsWith("C:\\")) {
        commandRegister = "file://" + commandRegister;
    }

    const { default: register } = await import(commandRegister);
    register(cli);
}

cli.register(Builtins.HelpCommand);
await cli.runExit(args);
process.exit(0);
