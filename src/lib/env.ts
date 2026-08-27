/**
 * Read an environment variable at runtime.
 *
 * On Cloudflare Workers, `@cloudflare/vite-plugin` replaces `process.env.XXX`
 * at *build time* with whatever was in the shell environment then — secrets set
 * via `wrangler secret put` aren't present at build time, so the replacement
 * becomes `undefined`.  The Worker fetch handler receives the real bindings in
 * its `env` parameter and copies them to `globalThis.__WORKER_ENV` (see
 * `src/server.ts`).  This helper reads from there first, falling back to
 * `process.env` for local development / non-Cloudflare environments.
 */
export function getWorkerEnv(): Record<string, string> {
  return (
    ((globalThis as Record<string, unknown>).__WORKER_ENV as Record<string, string>) ?? {}
  );
}

export function getEnvVar(name: string): string | undefined {
  return getWorkerEnv()[name] ?? process.env[name];
}
