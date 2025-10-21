import { Database } from './database';

export class ServicesPersistence extends Database {
    createSchema(schema: string) {
        return this.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    }
    dropSchema(schema: string) {
        return this.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    }
}
