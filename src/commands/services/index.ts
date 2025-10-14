import type { Cli } from 'clipanion';
import { ServiceClone } from './service_clone';
import { ServicePull } from './service_pull';

export default (cli: Cli) => {
    cli.register(ServiceClone);
    cli.register(ServicePull);
};
