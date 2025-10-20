import { Command } from 'clipanion';
import { color } from '@/utils';

export class DbTables extends Command<RufiToolsContext> {
    static paths = [['db:tables']];
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

    private readonly services = this.context.services;
    private readonly logger = this.context.logger;

    async execute() {
        const services = await this.services.local();

        this.logger.info('Fetching tables for each schema...\n');

        if (!services.length) {
            this.logger.info('No schemas registered.');
        }

        for (const service of services) {
            try {
                const tables = await this.services.tablesFrom(service);

                this.logServiceSection(service, tables);

                this.logger.divider();
            } catch (err: any) {
                this.logger.error(
                    `Error fetching tables for service ${service}: ${err.message}`
                );
            }
        }
    }

    private logServiceSection(service: string, tables: string[]) {
        const schema = this.services.getSchemaName(service);
        const isCore = this.services.isCore(service);

        this.logger.section(
            `Schema ${color.green(schema)}` +
                (isCore ? color.gray(` (core)`) : '')
        );

        if (tables.length === 0) {
            this.logger.bullet('No tables found');
            return;
        }

        for (const table of tables) {
            this.logger.bullet(table);
        }
    }
}
