// Loads .env.local for standalone scripts. Import this first.
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());