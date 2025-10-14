import type { Cli } from 'clipanion';
import { MakeMigration } from './make_migration';

export default (cli: Cli) => {
    cli.register(MakeMigration);
};
