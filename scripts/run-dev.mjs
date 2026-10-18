import { spawn } from "node:child_process";
import { loadLocalEnvFiles } from "./load-local-env.mjs";

loadLocalEnvFiles();

const child = spawn(
  process.execPath,
  [
    "--watch-path=server",
    "--watch-path=shared",
    "--watch-path=vite.config.ts",
    "--import",
    "tsx",
    "server/_core/index.ts",
  ],
  {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "development" },
  }
);

child.on("error", error => {
  console.error("[run-dev] Failed to start development runtime:", error);
  process.exit(1);
});

child.on("exit", code => process.exit(code ?? 1));
