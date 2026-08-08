import { defineConfig } from "drizzle-kit";

function buildConnectionString() {
  const directUrl = process.env.DATABASE_URL || process.env.MYSQL_DATABASE_URL;
  if (directUrl) return directUrl;

  const host = process.env.DB_HOST || process.env.MYSQL_HOST;
  const database = process.env.DB_NAME || process.env.MYSQL_DATABASE;
  const user = process.env.DB_USER || process.env.MYSQL_USER;
  const password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || "";
  const port = process.env.DB_PORT || process.env.MYSQL_PORT || "3306";
  if (host && database && user) {
    const auth = password
      ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}@`
      : `${encodeURIComponent(user)}@`;
    return `mysql://${auth}${host}:${port}/${encodeURIComponent(database)}`;
  }
  return "";
}

const connectionString = buildConnectionString();
if (!connectionString) {
  throw new Error("DATABASE_URL, MYSQL_DATABASE_URL, or DB_HOST/DB_NAME/DB_USER is required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: connectionString,
  },
});
