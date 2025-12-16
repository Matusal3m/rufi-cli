import { Command, Option } from 'clipanion';
import { PassThrough } from 'stream';
import { color } from '@/utils';

export class MigrationAll extends Command<RufiToolsContext> {
    static paths = [['migration:all']];

    dev = Option.Boolean('--dev');

    async execute() {
        const { Services, Logger } = this.context;

        const services = await Services.local();
        const coreName = process.env['CORE_SERVICE'];

        Logger.info('Checking for core service...');

        const coreIndex = services.findIndex(
            (service: any) => service === coreName,
        );
        if (coreIndex === -1) {
            Logger.error(
                `Core service '${coreName}' not found among local services.`,
            );
            throw new Error(
                `Migration aborted: missing core service '${coreName}'.`,
            );
        }

        const [coreService] = services.splice(coreIndex, 1);

        Logger.info(
            `Running migrations for ${color.bold(
                'core',
            )} service: ${coreService}`,
        );

        try {
            await this.cli.run(['migration:up', coreService], {
                stdout: new PassThrough(),
            });
            Logger.success(`Core migration completed successfully.`);
        } catch (error) {
            Logger.error(`Migration failed for core service '${coreService}'.`);
            throw error;
        }

        Logger.info('Running migrations for remaining services...');

        const migrationsPromises: Promise<any>[] = [];
        for (const service of services) {
            Logger.divider();
            Logger.info(`Starting migration for ${service}...`);

            try {
                await this.cli.run(['migration:up', service], {
                    stdout: new PassThrough(),
                });
                Logger.success(`Migration completed for ${service}.`);
            } catch (error) {
                Logger.warn(
                    `Could not run migration for service ${color.bold(
                        service,
                    )}.`,
                );
            }
        }
        Logger.divider();

        await Promise.all(migrationsPromises);
        Logger.success('All migrations finished!');
    }
}
