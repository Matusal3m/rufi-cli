import { Command, Option, UsageError } from "clipanion";
import { color } from "../../utils/color.js";
import path from "path";
import fs from "fs";
import { RufiLogger } from "../../utils/rufi_logger.js";

export class MakeMigration extends Command {
    static paths = [["make:migration"]];
    static usage = Command.Usage({
        category: "Make",
        description: "Create a new migration file",
        details: `
            This command generates a new SQL migration file for the specified service.
            The migration file will be timestamped and placed in the service's migrations directory.
            
            For core service, the schema will be 'public', for other services it uses the service name.
        `,
        examples: [
            [
                "Create a table migration",
                "rufi make:migration create users auth-service",
            ],
        ],
    });

    type = Option.String({
        required: true,
        description: "Type of migration: create, drop, or alter",
    });
    table = Option.String({ required: true });
    service = Option.String({ required: true });

    async execute() {
        RufiLogger.section("Creating Migration");

        const migrationsPath = path.join(
            process.cwd(),
            "services",
            this.service,
            "migrations",
        );

        if (!fs.existsSync(migrationsPath)) {
            throw new UsageError(
                `Could not found path ${color.yellow(
                    migrationsPath.replace(process.cwd() + "/", ""),
                )}`,
            );
        }

        const migration = `${new Date().getTime()}_${this.type}_${this.table}`;

        const schema =
            this.service === process.env["CORE_SERVICE"]
                ? "public"
                : this.service;

        const template = this.#template(migration, schema);
        const filePath = `${migrationsPath}/${migration}.sql`;

        fs.writeFileSync(filePath, template);

        RufiLogger.success(`Migration created: ${migration}.sql`);
        RufiLogger.bullet(
            `Location: ${filePath.replace(process.cwd() + "/", "")}`,
        );
    }

    #template(migration, schema) {
        const templates = {
            create: `-- Migration: ${migration}"

CREATE TABLE IF NOT EXISTS ${schema}.${this.table} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`,

            drop: `-- Migration: ${migration}

DROP TABLE IF EXISTS ${schema}.${this.table};`,

            alter: `-- Migration: ${this.name}

ALTER TABLE IF NOT EXISTS ${schema}.${this.table} 
ADD COLUMN new_column VARCHAR(255),
DROP COLUMN old_column,
ALTER COLUMN existing_column TYPE TEXT;`,
        };

        if (!(this.type in templates)) {
            throw new UsageError(
                `Unknown migration ${color.red(
                    this.type,
                )}.\nAvailable types: ${color.blue("create")}, ${color.blue(
                    "drop",
                )} and ${color.blue("alter")}`,
            );
        }

        return templates[this.type]
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
            .join("\n");
    }
}
