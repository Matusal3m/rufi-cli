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

    async execute() {
        const { Services, Migrations, Logger } = this.context;

        const isCore = Services.isCore(this.service);

        if (isCore && !this.force) {
            return this.warnCoreProtection();
        }

        Logger.section(
            `Starting development migrations for service: ${color.cyan(
                this.service,
            )}`,
        );

        const schema = Services.getSchemaName(this.service);

        try {
            await Services.dropServiceSchema(this.service);
            await Services.ensureSchemaExistence(schema);

            const migrationDir = await Migrations.defaultMigrationDir(
                this.service,
            );

            const parser = await Migrations.getParser(this.service);
            const migrations = await parser.execute(migrationDir);

            if (migrations.length === 0) {
                Logger.warn(
                    'No migration files found. Nothing will be applied.',
                );
                return;
            }

            await Migrations.applyMigrations(migrations, schema, migrationDir);
        } catch (err: any) {
            Logger.error('Error while running dev migration');
            Logger.error(err.message || err);
            throw err;
        }

        Logger.section(
            `Done. Reapplied migration(s) for ${color.cyan(this.service)}.`,
        );
    }

    private warnCoreProtection() {
        const { Logger } = this.context;

        const warning = Format.template.flat(
            `${color.yellow(
                `Migration blocked for core service: "${this.service}"`,
            )}
            This schema may contain tables referenced by other services,
            and running migrations directly could cause data loss or integrity issues.

            If you really need to proceed, use:
            ${color.gray(`rufi migration:dev ${this.service} --force`)}`,
        );

        Logger.warn(warning);
    }
}
