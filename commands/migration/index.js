import { MigrationUp } from "./migration_up.js";
import { MigrationDev } from "./migration_dev.js";
import { MigrationAll } from "./migration_all.js";

export default (cli) => {
    cli.register(MigrationUp);
    cli.register(MigrationDev);
    cli.register(MigrationAll);
};
