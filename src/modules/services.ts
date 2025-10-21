import { color, File, RufiLogger } from '@/utils';
import { MigrationsRegistry, ServicesPersistence } from '@/persistence';
import * as fs from 'fs/promises';
import * as path from 'path';
import { RufiConfig, ServiceConfig, ServicesConfig } from '.';

export class Services {
    constructor(
        private readonly servicesPersistence: ServicesPersistence,
        private readonly migrationsRegistry: MigrationsRegistry,
        private readonly config: RufiConfig
    ) {}

    async getConfig(serviceName: string): Promise<ServiceConfig> {
        const services = await this.configs();
        const serviceConfig = services[serviceName];
        if (!serviceConfig) {
            throw new Error(
                `Could not find configuration for service "${serviceName}".`
            );
        }
        return serviceConfig;
    }

    async configs(): Promise<ServicesConfig> {
        const servicesConfigPath = await File.hasJsOrTS(
            path.join(process.cwd(), 'services', 'services.config')
        );

        if (!servicesConfigPath) {
            throw new Error(`Could not find ${color.blue('services.config')}`);
        }

        const { default: config } = await import(servicesConfigPath);
        return config;
    }

    async local(): Promise<string[]> {
        const servicesPath = path.join(process.cwd(), 'services');
        const fileTypes = await fs.readdir(servicesPath, {
            withFileTypes: true,
        });
        const directories = fileTypes.filter(fileType =>
            fileType.isDirectory()
        );
        return directories.map(dir => dir.name);
    }

    async ensureSchemaExistence(schema: string): Promise<void> {
        try {
            await this.servicesPersistence.createSchema(schema);
        } catch (err: any) {
            RufiLogger.error(
                `Failed to ensure schema existence: ${err.message || err}`
            );
            throw err;
        }
    }

    isCore(service: string): boolean {
        return this.config.coreService === service;
    }

    getSchemaName(service: string): string {
        if (!service) throw new Error('Service cannot be empty');
        return this.isCore(service) ? 'public' : service;
    }

    async dropServiceSchema(service: string): Promise<void> {
        const migrations = await this.migrationsRegistry.migrationsFromService(
            service
        );

        if (!migrations || !migrations.length) {
            RufiLogger.warn('No migrations registered for this service.');
            return;
        }

        const schema = this.getSchemaName(service);
        try {
            await this.servicesPersistence.dropSchema(schema);
        } catch (err: any) {
            RufiLogger.error(
                `Error while dropping schema "${schema}": ${err.message || err}`
            );
            throw err;
        }
    }

    async tablesFrom(service: string): Promise<string[]> {
        const schema = this.getSchemaName(service);

        const rows = await this.servicesPersistence.query<{
            tablename: string;
        }>(`SELECT tablename FROM pg_tables WHERE schemaname = $1`, [schema]);

        return rows.map(row => row.tablename);
    }

    async allTables(): Promise<{ schema: string; table: string }[]> {
        const rows = await this.servicesPersistence.query<{
            schemaname: string;
            tablename: string;
        }>(
            `SELECT schemaname, tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')`
        );

        return rows.map(row => ({
            schema: row.schemaname,
            table: row.tablename,
        }));
    }
}
