import { Command, Option } from 'clipanion';

export class MigrationUp extends Command<RufiToolsContext> {
    static paths = [[`migration:up`]];
    static usage = Command.Usage({
        category: 'Migration',
        description: 'Apply pending migrations for a specific service',
        details: `
            Applies all pending SQL migrations for the specified service.

            - this.migrations must be in the service's 'migrations' directory
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

    private readonly services = this.context.services;
    private readonly logger = this.context.logger;
    private readonly migrations = this.context.migrations;

    async execute() {
        this.logger.section(`Starting migrations for service: ${this.service}`);

        const serviceConfig = await this.services.getConfig(this.service);
        const defaultMigrationDir = await this.migrations.defaultMigrationDir(
            this.service
        );

        const parser = this.migrations.getParser(serviceConfig!);
        const migrations = await parser.parseTo(defaultMigrationDir);

        if (migrations.length === 0) {
            this.logger.warn('No migration files found.');
            return;
        }

        this.logMigrationsFound(migrations);

        const appliedCount = await this.migrations.applyMigrations(
            migrations,
            this.service,
            defaultMigrationDir
        );

        if (appliedCount > 0) {
            this.logger.section(
                `Done. Applied ${appliedCount} new migration(s).`
            );
            return;
        }
        this.logger.info('Zero migrations to run. Nothing was applied.');
    }

    private logMigrationsFound(migrations: string[]) {
        this.logger.info(`Found ${migrations.length} migration(s):`);
        migrations.forEach(migration => this.logger.bullet(migration));
        this.logger.section('Applying migrations...');
    }
}
