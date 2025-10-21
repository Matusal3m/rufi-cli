import fs from 'fs/promises';

export class File {
    static async exists(path: string) {
        try {
            await fs.access(path);
            return true;
        } catch {
            return false;
        }
    }
    static require<T = any>(path: string): Promise<{ default: T }> {
        path = this.resolvePlatformPath(path);
        return import(path);
    }

    static async hasJsOrTS(path: string): Promise<string | undefined> {
        if (await this.exists(path + '.ts')) {
            return path + '.ts';
        }

        if (await this.exists(path + '.js')) {
            return path + '.js';
        }
    }

    private static resolvePlatformPath(path: string) {
        if (process.platform === 'win32') {
            return 'file://' + path;
        }
        return path;
    }
}
