import { Pool, type PoolClient } from 'pg';
import { RufiLogger } from '@/utils';

type TransactionCallback = (client: PoolClient) => Promise<void>;

export class RufiPersistence {
    private static pool: Pool | null = null;

    private static getPool(): Pool {
        if (this.pool) return this.pool;

        const config = process.env;
        this.pool = new Pool({
            user: config.user,
            host: config.host,
            database: config.database,
            port: Number(config.port),
            password: config.password,
        });

        return this.pool;
    }

    static async ensureConnection() {
        if (this.pool) return;

        try {
            const pool = this.getPool();
            const client = await pool.connect();
            client.release();
        } catch (err: any) {
            RufiLogger.error(
                `Error while connecting to PG: ${err.message || err}`
            );
            throw err;
        }
    }

    static async close(): Promise<void> {
        if (!this.pool) return;

        try {
            await this.pool.end();
            this.pool = null;
            RufiLogger.bullet('Database connection closed.');
        } catch (err: any) {
            RufiLogger.error(`Failed to close pool: ${err.message || err}`);
        }
    }

    static async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        const pool = this.getPool();

        try {
            const result = await pool.query(sql, params);
            return result.rows;
        } catch (err: any) {
            RufiLogger.error(`Query failed: ${err.message || err}`);
            throw err;
        }
    }

    static async transaction(callback: TransactionCallback): Promise<void> {
        const pool = this.getPool();
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            await callback(client);
            await client.query('COMMIT');
        } catch (err: any) {
            await client.query('ROLLBACK');
            RufiLogger.error(`Transaction failed: ${err.message || err}`);
            throw err;
        }
    }

    static async ensureSchemaExistence(schemaName: string): Promise<void> {
        const pool = this.getPool();
        try {
            await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
        } catch (err: any) {
            RufiLogger.error(
                `Failed to ensure schema existence: ${err.message || err}`
            );
            throw err;
        }
    }
}
