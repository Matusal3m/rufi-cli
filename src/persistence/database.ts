import { PGConfig } from '@/modules';
import { RufiLogger } from '@/utils';
import { Pool, type PoolClient } from 'pg';

type TransactionCallback = (client: PoolClient) => Promise<void>;

export abstract class Database {
    private pool: Pool | null = null;

    constructor(config: PGConfig) {
        this.pool = new Pool({
            user: config.user,
            host: config.host,
            database: config.database,
            port: Number(config.port),
            password: config.password,
        });

        if (!this.pool) throw new Error('Could not connect to database.');
    }

    async close(): Promise<void> {
        if (!this.pool) return;

        try {
            await this.pool.end();
            this.pool = null;
            RufiLogger.bullet('Database connection closed.');
        } catch (err: any) {
            RufiLogger.error(`Failed to close pool: ${err.message || err}`);
        }
    }

    async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        if (!this.pool) return [];

        try {
            const result = await this.pool.query(sql, params);
            return result.rows;
        } catch (err: any) {
            RufiLogger.error(`Query failed: ${err.message || err}`);
            throw err;
        }
    }

    async transaction(callback: TransactionCallback): Promise<void> {
        if (!this.pool) return;

        const client = await this.pool.connect();
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
}
