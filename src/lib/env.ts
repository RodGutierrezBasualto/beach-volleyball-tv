/** Reads a setting from the server environment (or .env during `npm run dev`). */
export const env = (key: string): string | undefined =>
  process.env[key] || (import.meta.env as Record<string, string | undefined>)[key] || undefined;
