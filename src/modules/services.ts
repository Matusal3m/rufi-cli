import * as fs from 'fs/promises';
import * as path from 'path';

type ParseMethod = 'prisma';

export interface ServiceConfig {
    name: string;
    repository: string;
    enable: boolean;
    parseMethod: ParseMethod | undefined;
    directoryToParse: string | undefined;
}

export class Services {
    static async config(serviceName: string) {
        const services = await this.configs();
        return services.find(service => service.name === serviceName);
    }

    static async configs(): Promise<ServiceConfig[]> {
        const servicesConfigPath = path.join(
            process.cwd(),
            'services',
            'services.config.json',
        );

        const config = await fs.readFile(servicesConfigPath, {
            encoding: 'utf8',
        });

        return JSON.parse(config);
    }

    static async local() {
        const servicesPath = path.join(process.cwd(), 'services');
        const fileTypes = await fs.readdir(servicesPath, {
            withFileTypes: true,
        });
        const files = fileTypes.filter(fileType => fileType.isFile());
        return files.map(file => file.name);
    }
}
