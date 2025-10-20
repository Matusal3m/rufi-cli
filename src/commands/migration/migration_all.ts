import { Command, Option } from 'clipanion';
import { PassThrough } from 'stream';
import { color } from '@/utils';

export class MigrationAll extends Command<RufiToolsContext> {
    static paths = [['migration:all']];

    dev = Option.Boolean('--dev');

    private readonly services = this.context.services;
    private readonly logger = this.context.logger;

    async execute() {
        const services = await this.services.local();
        const coreName = process.env['CORE_SERVICE'];

        this.logger.info('Checking for core service...');

        const coreIndex = services.findIndex(
            (service: any) => service === coreName
        );
        if (coreIndex === -1) {
            this.logger.error(
                `Core service '${coreName}' not found among local services.`
            );
            throw new Error(
                `Migration aborted: missing core service '${coreName}'.`
            );
        }

        const [coreService] = services.splice(coreIndex, 1);

        this.logger.info(
            `Running migrations for ${color.bold(
                'core'
            )} service: ${coreService}`
        );

        try {
            await this.cli.run(['migration:up', coreService!], {
                stdout: new PassThrough(),
            });
            this.logger.success(`Core migration completed successfully.`);
        } catch (error) {
            this.logger.error(
                `Migration failed for core service '${coreService}'.`
            );
            throw error;
        }

        this.logger.info('Running migrations for remaining services...');

        const migrationsPromises: Promise<any>[] = [];
        for (const service of services) {
            this.logger.divider();
            this.logger.info(`Starting migration for ${service}...`);

            try {
                await this.cli.run(['migration:up', service], {
                    stdout: new PassThrough(),
                });
                this.logger.success(`Migration completed for ${service}.`);
            } catch (error) {
                this.logger.warn(
                    `Could not run migration for service ${color.bold(
                        service
                    )}.`
                );
            }
        }
        this.logger.divider();

        await Promise.all(migrationsPromises);
        this.logger.success('All migrations finished!');
    }
}
