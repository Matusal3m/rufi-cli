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
}
