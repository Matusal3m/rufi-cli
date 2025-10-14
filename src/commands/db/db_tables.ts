import { Command } from 'clipanion';
import { RufiManagementRegistry, RufiPersistence } from '@/persistence/';
import { RufiLogger, color } from '@/utils';

export class DbTables extends Command {
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

    async execute() {
        const schemas = RufiManagementRegistry.listRegisteredServices();

        RufiLogger.info('Fetching tables for each schema...\n');

        if (!schemas || !schemas.length) {
            RufiLogger.info('No schemas registered.');
        }

        for (let schema of schemas) {
            const core = process.env['CORE_SERVICE'];
            const isCore = schema === core;
            try {
                schema = isCore ? 'public' : schema;
                const result = await RufiPersistence.query(
                    `SELECT * from pg_tables WHERE schemaname = $1`,
                    [schema]
                );

                const tables = Array.isArray(result) ? result : [];

                if (tables.length === 0) {
                    RufiLogger.bullet('no tables found');
                    continue;
                }

                RufiLogger.info(
                    `Schema ${color.green(schema)}` +
                        (isCore ? color.gray(` (${core})`) : '')
                );
                for (const { tablename } of tables) {
                    RufiLogger.bullet(tablename);
                }

                RufiLogger.divider();
            } catch (err: any) {
                RufiLogger.error(
                    `Error fetching tables for schema "${schema}": ${err.message}`
                );
            }
        }
    }
}
