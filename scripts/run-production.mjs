import { spawn } from "node:child_process";
import { loadLocalEnvFiles } from "./load-local-env.mjs";

loadLocalEnvFiles();

const child = spawn(process.execPath, ["dist/index.js"], {
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "production" },
});

child.on("exit", (code) => process.exit(code ?? 1));
