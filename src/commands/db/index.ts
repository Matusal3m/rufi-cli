import type { Cli } from 'clipanion';
import { DbReset } from './db_reset';
import { DbTables } from './db_tables';

export default (cli: Cli) => {
    cli.register(DbReset);
    cli.register(DbTables);
};
