import fs from 'fs/promises';
import { Rufi } from './modules/rufi';

(async () => {
    process.send?.({
        cwd: process.cwd(),
        files: await fs.readdir('.'),
    });
})();

export { Rufi };
