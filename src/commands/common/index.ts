import type { Cli } from 'clipanion';
import { Reset } from './reset';
import { Start } from './start';
import { Init } from './init';

export default (cli: Cli) => {
    cli.register(Start);
    cli.register(Reset);
    cli.register(Init);
};
