import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

/**
 * The only environment this framework tests. It is a constant on purpose, not an env var:
 * tests must never be pointed at production or anywhere else (see AGENTS.md).
 */
export const DEV_URL = 'https://dev.agenticlibrary.app';

const envFile = fileURLToPath(new URL('../../.env', import.meta.url));

// Locally, secrets live in .env. In CI they come from GitHub Secrets and there is no file.
// Variables already set in the environment take precedence over the file.
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const EnvSchema = z.object({
  DEV_BASIC_USER: z.string().min(1),
  DEV_BASIC_PASS: z.string().min(1),
  FOLIO_TEST_API_TOKEN: z.string().min(1),
  CI: z.stringbool().default(false),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    // Name the bad variables only. Never echo their values: they are secrets.
    const names = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))];
    throw new Error(
      `Missing or invalid environment variables: ${names.join(', ')}.\n` +
        'Copy .env.example to .env and fill it in (CI reads them from GitHub Secrets).',
    );
  }
  return result.data;
}

export const env = loadEnv();
