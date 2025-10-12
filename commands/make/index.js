import { MakeMigration } from "./make_migration.js";

export default (cli) => {
    cli.register(MakeMigration);
};
