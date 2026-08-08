import { spawn } from "node:child_process";
import { resolve } from "node:path";

const command = process.platform === "win32"
  ? resolve("node_modules/.bin/tsx.cmd")
  : resolve("node_modules/.bin/tsx");

const child = spawn(command, ["watch", "server/_core/index.ts"], {
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "development" },
});

child.on("exit", (code) => process.exit(code ?? 1));
