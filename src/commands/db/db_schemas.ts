import { Command } from 'clipanion';
import { color } from '@/utils';

export class DbSchemas extends Command<RufiToolsContext> {
    static paths = [['db:schemas']];
    static usage = Command.Usage({
        category: 'Database',
        description: 'List all tables from registered schemas',
        details: `
            This command displays all database tables organized by schema.
            
            It will:
            - Fetch all registered schemas from the management registry
            - Query PostgreSQL system tables to list all tables in each schema
            - Display the results in a formatted bullet list
            
            If a schema has no tables, it will be skipped in the output.
            Any errors during schema query will be displayed but won't stop the process.
        `,
        examples: [
            ['List all tables from all registered schemas', 'rufi db:tables'],
        ],
    });

    async execute() {
        const { Services, Logger } = this.context;

        const services = await Services.local();

        Logger.info('Fetching tables for each schema...\n');

        if (!services.length) {
            Logger.info('No schemas registered.');
        }

        for (const service of services) {
            try {
                const tables = await Services.tablesFrom(service);

                this.logServiceSection(service, tables);

                Logger.divider();
            } catch (err: any) {
                Logger.error(
                    `Error fetching tables for service ${service}: ${err.message}`,
                );
            }
        }
    }

    private logServiceSection(service: string, tables: string[]) {
        const { Services, Logger } = this.context;

        const schema = Services.getSchemaName(service);
        const isCore = Services.isCore(service);

        Logger.section(
            `Schema ${color.green(schema)}` +
                (isCore ? color.gray(` (core)`) : ''),
        );

        if (tables.length === 0) {
            Logger.bullet('No tables found');
            return;
        }

        for (const table of tables) {
            Logger.bullet(table);
        }
    }
}
