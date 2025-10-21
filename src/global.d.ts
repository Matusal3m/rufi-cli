import { Migrations, RufiConfig, Services } from '@/modules';
import { RufiLogger } from './utils';
import { BaseContext } from 'clipanion';

declare global {
    interface RufiToolsContext extends BaseContext {
        Services: Services;
        Migrations: Migrations;
        Logger: typeof RufiLogger;
        config: RufiConfig;
    }
}
