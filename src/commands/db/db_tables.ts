import { Command } from 'clipanion';

export class DbTables extends Command<RufiToolsContext> {
    static paths = [['db:tables']];
    static usage = Command.Usage({
        category: 'Database',
        description: 'List all tables from datatabase',
        details: `
            This command displays all database tables without schema organization.
        `,
        examples: [
            ['List all tables from all registered schemas', 'rufi db:tables'],
        ],
    });

    async execute() {
        const { Services, Logger } = this.context;

        try {
            const tables = await Services.allTables();

            if (tables.length === 0) {
                Logger.info('No tables found in the database.');
                return;
            }

            Logger.info('Database Tables:\n');

            tables.forEach(({ schema, table }) => {
                Logger.bullet(`${schema}.${table}`);
            });
        } catch (error: any) {
            Logger.error(`Error fetching tables: ${error.message || error}`);
        }
    }
}
