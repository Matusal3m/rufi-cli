import { Command, Option } from 'clipanion';

export class MigrationUp extends Command<RufiToolsContext> {
    static paths = [[`migration:up`]];
    static usage = Command.Usage({
        category: 'Migration',
        description: 'Apply pending migrations for a specific service',
        details: `
            Applies all pending SQL migrations for the specified service.

            - Migrations must be in the service's 'migrations' directory
            - Must have a .sql extension
            - Must start with a number for proper ordering
            
            Execution stops immediately if any migration fails.
        `,
        examples: [
            [
                'Apply migrations for a specific service',
                'rufi migration:up my-service',
            ],
        ],
    });

    service = Option.String({
        required: true,
        name: 'service #0',
    });

    async execute() {
        const { Migrations, Logger } = this.context;

        Logger.section(`Starting migrations for service: ${this.service}`);

        const defaultMigrationDir = await Migrations.defaultMigrationDir(
            this.service,
        );

        const parser = await Migrations.getParser(this.service);
        const migrations = await parser.parseTo(defaultMigrationDir);

        if (migrations.length === 0) {
            Logger.warn('No migration files found.');
            return;
        }

        this.logMigrationsFound(migrations);

        const appliedCount = await Migrations.applyMigrations(
            migrations,
            this.service,
            defaultMigrationDir,
        );

        if (appliedCount > 0) {
            Logger.section(`Done. Applied ${appliedCount} new migration(s).`);
            return;
        }
        Logger.info('Zero migrations to run. Nothing was applied.');
    }

    private logMigrationsFound(migrations: string[]) {
        const { Logger } = this.context;

        Logger.info(`Found ${migrations.length} migration(s):`);
        migrations.forEach(migration => Logger.bullet(migration));
        Logger.section('Applying migrations...');
    }
}
