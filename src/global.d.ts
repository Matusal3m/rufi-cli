import { Migrations, RufiConfig, Services } from '@/modules';
import { RufiLogger } from './utils';
import { BaseContext } from 'clipanion';

declare global {
    interface RufiToolsContext extends BaseContext {
        services: Services;
        migrations: Migrations;
        logger: typeof RufiLogger;
        config: RufiConfig;
    }
}
