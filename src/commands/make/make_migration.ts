import { Command, Option, UsageError } from 'clipanion';
import { Format, color } from '@/utils';
import path from 'path';
import fs from 'fs';

type MigrationType = 'create' | 'drop' | 'alter';

export class MakeMigration extends Command<RufiToolsContext> {
    static paths = [['make:migration']];
    static usage = Command.Usage({
        category: 'Make',
        description: 'Create a new migration file',
        details: `
            This command generates a new SQL migration file for the specified service.
            The migration file will be timestamped and placed in the service's migrations directory.
            
            For core service, the schema will be 'public', for other services it uses the service name.
        `,
        examples: [
            [
                'Create a table migration',
                'rufi make:migration create users auth-service',
            ],
        ],
    });

    migrationType: MigrationType = Option.String({
        name: 'migrationType #0',
        required: true,
    });
    table = Option.String({ name: 'table #1', required: true });
    service = Option.String({ name: 'service #2', required: true });

    async execute() {
        const { Logger } = this.context;
        Logger.section('Creating Migration');

        const migrationsPath = path.join(
            process.cwd(),
            'services',
            this.service,
            'migrations'
        );

        if (!fs.existsSync(migrationsPath)) {
            throw new UsageError(
                `Could not found path ${color.yellow(
                    migrationsPath.replace(process.cwd() + '/', '')
                )}`
            );
        }

        const migration = `${new Date().getTime()}_${this.migrationType}_${
            this.table
        }`;

        const schema =
            this.service === process.env['CORE_SERVICE']
                ? 'public'
                : this.service;

        const template = this.template(migration, schema);
        const filePath = `${migrationsPath}/${migration}.sql`;

        fs.writeFileSync(filePath, template);

        Logger.success(`Migration created: ${migration}.sql`);

        Logger.bullet(`Location: ${filePath.replace(process.cwd() + '/', '')}`);
    }

    private template(migration: string, schema: string) {
        const templates = {
            create: `
                -- Migration: ${migration}"
                CREATE TABLE IF NOT EXISTS ${schema}.${this.table} (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );`,

            drop: `
                -- Migration: ${migration}
                DROP TABLE IF EXISTS ${schema}.${this.table};`,

            alter: `
                -- Migration: ${this.migrationType}
                ALTER TABLE IF NOT EXISTS ${schema}.${this.table} 
                ADD COLUMN new_column VARCHAR(255),
                DROP COLUMN old_column,
                ALTER COLUMN existing_column TYPE TEXT;`,
        };

        if (!(this.migrationType in templates)) {
            throw new UsageError(
                `Unknown migration ${color.red(
                    this.migrationType
                )}.\nAvailable types: ${color.blue('create')}, ${color.blue(
                    'drop'
                )} and ${color.blue('alter')}`
            );
        }

        return Format.template.withIndent(templates[this.migrationType]);
    }
}
