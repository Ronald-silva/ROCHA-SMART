import { spawnSync } from "node:child_process";

const shadow = process.env.SHADOW_DATABASE_URL;
if (!shadow || !/^postgres(?:ql)?:\/\//.test(shadow)) {
  console.error("Defina SHADOW_DATABASE_URL para um PostgreSQL temporário e descartável.");
  process.exit(1);
}
const result = spawnSync("npx", ["prisma", "migrate", "diff", "--from-migrations", "prisma/migrations", "--to-schema-datamodel", "prisma/schema.prisma", "--shadow-database-url", shadow, "--exit-code"], { stdio: "inherit" });
process.exit(result.status ?? 1);
