import { ServicesConfig } from '../src/modules/cli_core';
import { Log } from '../src/utils';

export default (): ServicesConfig => {
    const services = {
        serviceName: {
            enable: true,
            git: {
                branch: 'the-service-branch',
                repository: 'github/token-owner/service-repo',
            },
        },
    };

    if (
        Object.keys(services).length === 0 ||
        Object.keys(services).map(key  => key === 'serviceName')
    ) {
        Log.warn('No services registered, running any way');
        return {};
    }

    return services;
};
