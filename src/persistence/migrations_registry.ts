import { Database } from './database';

interface ServiceMigration {
    id: number;
    name: string;
    applied_at: string;
    service: string;
}

export class MigrationsRegistry extends Database {
    async init() {
        await this.query(`CREATE SCHEMA IF NOT EXISTS rufi`);
        await this.query(`
            CREATE TABLE IF NOT EXISTS rufi.rufi_migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                service VARCHAR(255) NOT NULL
            );
        `);
    }

    async addMigration(name: string, service: string) {
        const sql = `
            INSERT INTO rufi.rufi_migrations (name, service)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const [migration] = await this.query<ServiceMigration>(sql, [
            name,
            service,
        ]);
        if (!migration)
            throw new Error(`Something whent wrong adding migration ${name}`);
        return this.normalize(migration);
    }

    async allMigrations() {
        const rows = await this.query<ServiceMigration>(`
            SELECT *
            FROM rufi.rufi_migrations
            ORDER BY applied_at ASC
        `);
        return rows.map(this.normalize);
    }

    async migrationsFromService(service: string) {
        const rows = await this.query<ServiceMigration>(
            `SELECT *
             FROM rufi.rufi_migrations
             WHERE service = $1
             ORDER BY applied_at ASC`,
            [service]
        );
        return rows.map(this.normalize);
    }

    async getRegisteredMigrations() {
        const rows = await this.query<{ service: string }>(`
            SELECT DISTINCT service
            FROM rufi.rufi_migrations
            ORDER BY service ASC
        `);
        return rows.map(r => r.service);
    }

    async checkMigrationExistence(name: string) {
        const [result] = await this.query<{ count: string }>(
            `SELECT COUNT(*) AS count
             FROM rufi.rufi_migrations
             WHERE name = $1`,
            [name]
        );
        return result ? Number(result.count) > 0 : false;
    }

    async getLastByService(service: string) {
        const [last] = await this.query<ServiceMigration>(
            `SELECT * FROM rufi.rufi_migrations
             WHERE service = $1
             ORDER BY applied_at DESC
             LIMIT 1`,
            [service]
        );
        return last ? this.normalize(last) : undefined;
    }

    async clear() {
        await this.query(`DROP SCHEMA IF EXISTS rufi`);
    }

    async clearService(service: string) {
        await this.query(
            `DELETE FROM rufi.rufi_migrations WHERE service = $1`,
            [service]
        );
    }

    private normalize = (m: ServiceMigration) => ({
        ...m,
        applied_at: new Date(m.applied_at).toLocaleString(),
    });

    runMigration(sql: string, schema: string) {
        return this.transaction(async client => {
            try {
                await client.query(`SET SEARCH_PATH = ${schema}`);
            } catch (error) {
                console.error(
                    `Failed to set search path to schema ${schema}:`,
                    error
                );
                throw error;
            }

            try {
                await client.query(sql);
            } catch (error) {
                console.error(`Failed to execute migration SQL:`, error);
                throw error;
            }
        });
    }
}
