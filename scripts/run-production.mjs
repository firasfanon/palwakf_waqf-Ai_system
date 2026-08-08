import { spawn } from "node:child_process";

const child = spawn(process.execPath, ["dist/index.js"], {
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "production" },
});

child.on("exit", (code) => process.exit(code ?? 1));
