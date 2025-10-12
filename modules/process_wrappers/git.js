import path from "node:path";
import { color } from "../../utils/color.js";
import { ProcessWrapper } from "./process_wrapper.js";

export class Git extends ProcessWrapper {
    constructor(username, token) {
        super("git");
        this.ensureExistence();

        this.username = username;
        this.token = token;
    }

    url(repository) {
        const auth = this.username && this.token;
        return auth
            ? `https://${this.username}:${this.token}@${repository}.git`
            : `https://${repository}.git`;
    }

    clone(repository, { name, verbose, rootDir } = {}) {
        rootDir = rootDir || process.cwd();
        const url = this.url(repository);

        const target = path.join(rootDir, name);
        const git = this.spawn("git", ["clone", url, target], verbose);

        let errorMessage = "";
        git.stderr?.on("data", (data) => {
            errorMessage += String(data);
        });

        const successMessage = `Repository ${color.bold(
            repository,
        )} cloned successfully to: ${color.bold(name)}`;

        return this.promisify(git, successMessage, errorMessage);
    }

    pull(repository, { branch, rootDir, verbose, name } = {}) {
        const url = this.url(repository);
        const gitDir = path.join(rootDir ?? process.cwd(), name || repository);

        const git = this.spawnShell(
            `cd ${gitDir} && git pull ${url} ${branch ?? "master"}`,
            verbose,
        );

        return this.promisify(git);
    }
}
