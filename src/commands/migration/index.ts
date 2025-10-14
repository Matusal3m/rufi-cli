import type { Cli } from 'clipanion';
import { MigrationUp } from './migration_up';
import { MigrationDev } from './migration_dev';
import { MigrationAll } from './migration_all';

export default (cli: Cli) => {
    cli.register(MigrationUp);
    cli.register(MigrationDev);
    cli.register(MigrationAll);
};
