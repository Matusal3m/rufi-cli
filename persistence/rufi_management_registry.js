import { DatabaseSync } from "node:sqlite";

export class RufiManagementRegistry {
    static db = new DatabaseSync("./db.sqlite");

    static #connection() {
        if (!this.db) {
            throw new Error("Error with database connection.");
        }
        return this.db;
    }

    static #createMigrationTable() {
        this.#connection().exec(`
            CREATE TABLE IF NOT EXISTS rufi_migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                applied_at INTEGER NOT NULL,
                service TEXT NOT NULL
            )
        `);
    }

    static #formatDateTime(dateTime) {
        return new Date(dateTime).toLocaleString();
    }

    static initialize() {
        this.#createMigrationTable();
    }

    static addMigration(name, service) {
        const now = new Date().getTime();
        const stmt = this.#connection().prepare(`
            INSERT INTO rufi_migrations (name, applied_at, service)
            VALUES (?, ?, ?)
        `);
        stmt.run(name, now, service);
    }

    static listAllMigrations() {
        const stmt = this.#connection().prepare(`
            SELECT name, applied_at, service
            FROM rufi_migrations
            ORDER BY applied_at ASC
        `);
        const migrations = stmt.all();

        return migrations.map((m) => ({
            ...m,
            applied_at: this.#formatDateTime(m.applied_at),
        }));
    }

    static listServiceMigrations(service) {
        const stmt = this.#connection().prepare(`
            SELECT name, applied_at, service
            FROM rufi_migrations
            WHERE service = ?
            ORDER BY applied_at ASC
        `);
        const migrations = stmt.all(service);

        return migrations.map((m) => ({
            ...m,
            applied_at: this.#formatDateTime(m.applied_at),
        }));
    }

    static listRegisteredServices() {
        const stmt = this.#connection().prepare(`
            SELECT DISTINCT service
            FROM rufi_migrations
            ORDER BY service ASC
        `);

        const rows = stmt.all();

        return rows.map((row) => row.service);
    }

    static hasMigration(name) {
        const stmt = this.#connection().prepare(`
            SELECT COUNT(*) AS count
            FROM rufi_migrations
            WHERE name = ?
        `);
        const { count } = stmt.get(name);
        return count > 0;
    }

    static getLast(service) {
        const stmt = this.#connection().prepare(`
            SELECT * FROM rufi_migrations
            WHERE service = ?
            ORDER BY applied_at ASC
            LIMIT 1
        `);
        const result = stmt.get(service);

        if (!result) return;

        return {
            ...result,
            applied_at: this.#formatDateTime(result.applied_at),
        };
    }

    static clear() {
        this.#connection().exec(`DELETE FROM rufi_migrations`);
    }

    static clearService(service) {
        const stmt = this.#connection().prepare(
            `DELETE FROM rufi_migrations WHERE service = ?`,
        );
        stmt.run(service);
    }

    static exec(sql) {
        return this.#connection().exec(sql);
    }
}
