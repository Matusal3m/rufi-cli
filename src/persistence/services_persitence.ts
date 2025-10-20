import { Database } from './database';

export class ServicesPersistence extends Database {
    createSchema(schema: string) {
        return this.query('CREATE SCHEMA IF NOT EXISTS $1', [schema]);
    }
    dropSchema(schema: string) {
        return this.query(`DROP SCHEMA IF EXISTS $1 CASCADE`, [schema]);
    }
}
