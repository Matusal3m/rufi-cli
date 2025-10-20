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

    private readonly migrations = this.context.migrations;
    private readonly services = this.context.services;
    private readonly logger = this.context.logger;

    async execute() {
        this.logger.info('Dropping all PostgreSQL schemas...');

        const services = await this.services.local();

        if (services.length === 0) {
            this.logger.warn('No schemas registered — nothing to drop.');
            return;
        }

        const dropSchemasPromises = [];
        for (const service of services) {
            dropSchemasPromises.push(this.services.dropServiceSchema(service));
        }

        try {
            await Promise.all(dropSchemasPromises);
        } catch (err: any) {
            this.logger.warn('Something whent wrong while dropping schemas.');
            throw err;
        }

        try {
            await this.migrations.clear();
            this.logger.success('Registry of services cleared successfully.');
        } catch (err: any) {
            this.logger.warn(`Could not clear services migrations registry.`);
            throw err;
        }

        this.logger.success('All schemas dropped successfully!');
    }
}
