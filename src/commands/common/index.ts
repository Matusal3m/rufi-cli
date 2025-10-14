import type { Cli } from 'clipanion';
import { Reset } from './reset';
import { Start } from './start';

export default (cli: Cli) => {
    cli.register(Start);
    cli.register(Reset);
};
