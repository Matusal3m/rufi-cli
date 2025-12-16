import { Migrations } from '@/migration';
import { RufiConfig, Services } from '@/cli-core';
import { Log } from './utils';
import { BaseContext } from 'clipanion';

declare global {
    interface RufiToolsContext extends BaseContext {
        Services: Services;
        Migrations: Migrations;
        Logger: typeof Log;
        config: RufiConfig;
    }
}
