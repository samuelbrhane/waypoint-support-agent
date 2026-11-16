// Checks that the database and the OpenAI key work
import { loadEnvConfig } from "@next/env";
import OpenAI from "openai";
import postgres from "postgres";

loadEnvConfig(process.cwd());

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);
  const [row] = await sql`SELECT version()`;
  console.log("Database:", row.version.split(",")[0]);
  await sql.end();

  const openai = new OpenAI();
  const response = await openai.responses.create({
    model: "gpt-5.4-mini",
    input: "Say OK",
  });
  console.log("OpenAI:", response.output_text);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});