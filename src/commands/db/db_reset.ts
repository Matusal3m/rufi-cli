import { Command } from 'clipanion';

export class DbReset extends Command<RufiToolsContext> {
    static paths = [['db:reset']];
    static usage = Command.Usage({
        category: 'Database',
        description: 'Reset the development database by dropping all schemas',
        details: `
            This command will:
            - Drop all PostgreSQL schemas registered in the management registry
            - Clear the service registry
            - Reset the development environment to a clean state
            
            ⚠️  This command is ONLY available in development environment (CLI_ENV=development)
            and will exit with an error if used in other environments.
            
            The 'public' schema corresponds to the core service defined in CORE_SERVICE environment variable.
        `,
        examples: [['Reset development database', 'rufi db:reset']],
    });

    async execute() {
        const { Services, Migrations, Logger } = this.context;

        Logger.info('Dropping all PostgreSQL schemas...');

        const services = await Services.local();

        if (services.length === 0) {
            Logger.warn('No schemas registered — nothing to drop.');
            return;
        }

        const dropSchemasPromises = [];
        for (const service of services) {
            dropSchemasPromises.push(Services.dropServiceSchema(service));
        }

        try {
            await Promise.all(dropSchemasPromises);
        } catch (err: any) {
            Logger.warn('Something whent wrong while dropping schemas.');
            throw err;
        }

        try {
            await Migrations.clear();
            Logger.success('Registry of services cleared successfully.');
        } catch (err: any) {
            Logger.warn(`Could not clear services migrations registry.`);
            throw err;
        }

        Logger.success('All schemas dropped successfully!');
    }
}
