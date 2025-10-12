import { ServiceClone } from "./service_clone.js";
import { ServicePull } from "./service_pull.js";

export default (cli) => {
    cli.register(ServiceClone);
    cli.register(ServicePull);
};
