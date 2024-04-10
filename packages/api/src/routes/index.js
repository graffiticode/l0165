import { getConfig } from "./../config/index.js";
import { buildConfigHandler } from "./config.js";

export const configHandler = buildConfigHandler({ getConfig });

export { default as auth } from "./auth.js";
export { default as compile } from "./compile.js";
export { default as root } from "./root.js";
