import { Reset } from "./reset.js";
import { Start } from "./start.js";

export default (cli) => {
    cli.register(Start);
    cli.register(Reset);
};
