import { Pool } from "pg";
import { color } from "../utils/color.js";

export class RufiPersistence {
    /**
     * @type {Pool} #poll
     */
    static #pool = null;
    static #connected = false;

    static #ensurePool() {
        if (this.#pool) return;

        this.#pool = new Pool({
            user: process.env.POSTGRES_USER,
            host: process.env.POSTGRES_HOST,
            database: process.env.POSTGRES_DATABASE,
            port: Number(process.env.POSTGRES_PORT),
            password: process.env.POSTGRES_PASSWORD,
        });
    }

    static async connect() {
        if (this.#connected) return;

        this.#ensurePool();

        try {
            const client = await this.#pool.connect();
            client.release();
            this.#connected = true;
        } catch (err) {
            console.error(color.red(`✖ Failed to connect: ${err.message}`));
            throw err;
        }
    }

    static async close() {
        if (!this.#pool) return;
        try {
            await this.#pool.end();
            this.#pool = null;
            this.#connected = false;
            console.info(color.gray("• Database connection closed."));
        } catch (err) {
            console.error(color.red(`✖ Failed to close pool: ${err.message}`));
        }
    }

    static async query(sql, params = []) {
        this.#ensurePool();
        await this.connect();

        try {
            const result = await this.#pool.query(sql, params);
            return result.rows;
        } catch (err) {
            console.error(color.red(`✖ Query failed: ${err.message}`));
            throw err;
        }
    }

    static async exec(sql) {
        this.#ensurePool();
        await this.connect();

        const statements = sql
            .split(";")
            .map(s => s.trim())
            .filter(s => s.length > 0);

        try {
            for (const statement of statements) {
                await this.#pool.query(statement);
            }
        } catch (err) {
            console.error(color.red(`✖ Execution failed: ${err.message}`));
            throw err;
        }
    }

    /**
     * @param {(client: import("pg").PoolClient) => Promise<void>} callback
     */
    static async transaction(callback) {
        this.#ensurePool();
        await this.connect();
        const client = await this.#pool.connect();
        try {
            await client.query("BEGIN");
            await callback(client);
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            console.error(color.red(`✖ Transaction failed: ${err.message}`));
            throw err;
        } finally {
            client.release();
        }
    }

    static async ensureSchemaExistence(schemaname) {
        try {
            this.#pool.query(`CREATE SCHEMA IF NOT EXISTS ${schemaname}`);
        } catch (err) {
            console.error(color.red(`✖ Execution failed: ${err.message}`));
            throw err;
        }
    }
}
