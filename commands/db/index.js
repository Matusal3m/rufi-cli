import { DbReset } from "./db_reset.js";
import { DbTables } from "./db_tables.js";

export default (cli) => {
    cli.register(DbReset);
    cli.register(DbTables);
};
