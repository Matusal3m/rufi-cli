import { Command, Option } from 'clipanion';
import { color, Format } from '@/utils';

export class MigrationDev extends Command<RufiToolsContext> {
    static paths = [['migration:dev']];

    static usage = Command.Usage({
        category: 'Migration',
        description: 'Reset and reapply all migrations for a service',
        details: `
        Completely resets a service's database schema and reapplies all migrations.
        
        ⚠️ Core service migrations require the --force flag for safety.
        All existing data in the schema will be permanently lost.
        `,
        examples: [
            ['Reset a service database', 'rufi migration:dev my-service'],
            [
                'Reset core service (forced)',
                'rufi migration:dev core-service --force',
            ],
        ],
    });

    service = Option.String({ required: true });
    force = Option.Boolean('--force', false, {
        description: 'Force migration even on core service',
    });

    private readonly services = this.context.services;
    private readonly logger = this.context.logger;
    private readonly migrations = this.context.migrations;

    async execute() {
        const isCore = this.services.isCore(this.service);

        if (isCore && !this.force) {
            return this.warnCoreProtection();
        }

        this.logger.section(
            `Starting development migrations for service: ${color.cyan(
                this.service
            )}`
        );

        const schema = this.services.getSchemaName(this.service);

        try {
            await this.services.dropServiceSchema(this.service);
            await this.services.ensureSchemaExistence(schema);

            const serviceConfig = await this.services.getConfig(this.service);
            const migrationDir = await this.migrations.defaultMigrationDir(
                this.service
            );

            const parser = this.migrations.getParser(serviceConfig!);
            const migrations = await parser.execute(migrationDir);

            if (migrations.length === 0) {
                this.logger.warn(
                    'No migration files found. Nothing will be applied.'
                );
                return;
            }

            await this.migrations.applyMigrations(
                migrations,
                schema,
                migrationDir
            );
        } catch (err: any) {
            this.logger.error('Error while running dev migration');
            this.logger.error(err.message || err);
            throw err;
        }

        this.logger.section(
            `Done. Reapplied migration(s) for ${color.cyan(this.service)}.`
        );
    }

    private warnCoreProtection() {
        const warning = Format.template.flat(
            `${color.yellow(
                `Migration blocked for core service: "${this.service}"`
            )}
            This schema may contain tables referenced by other services,
            and running migrations directly could cause data loss or integrity issues.

            If you really need to proceed, use:
            ${color.gray(`rufi migration:dev ${this.service} --force`)}`
        );

        this.logger.warn(warning);
    }
}
