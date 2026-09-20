import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { loadLocalEnvFiles } from "./load-local-env.mjs";

loadLocalEnvFiles();

const tsxCli = resolve("node_modules/tsx/dist/cli.mjs");

const child = spawn(
  process.execPath,
  [tsxCli, "watch", "server/_core/index.ts"],
  {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "development" },
  }
);

child.on("error", error => {
  console.error("[run-dev] Failed to start tsx:", error);
  process.exit(1);
});

child.on("exit", code => process.exit(code ?? 1));
