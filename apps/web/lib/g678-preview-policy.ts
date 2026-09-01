/**
 * Edge-safe policy helpers for the G6-G8 shared engineering-preview surface.
 * Keep this module free of `server-only` and filesystem imports because the
 * request proxy bundles it for middleware execution.
 */

export type G678PreviewEnvironment = Readonly<Record<string, string | undefined>>;

export const G678_MODULE_CODE_PATTERN = /^[A-Z]{3}\d{3}$/iu;
export const G678_MODULE_CODES = Object.freeze([
  'NMS002',
  'GEO001',
  'ALG001',
  'DAT001',
] as const);

export function isG678ModuleCode(value: string): boolean {
  return G678_MODULE_CODE_PATTERN.test(value) &&
    G678_MODULE_CODES.includes(value.toUpperCase() as (typeof G678_MODULE_CODES)[number]);
}

export function isG678LocalPreviewEnabled(
  env: G678PreviewEnvironment = process.env,
): boolean {
  const optIn = env.HELP_MATH_G678_LOCAL_PREVIEW;
  return env.NODE_ENV !== 'production' && (optIn === 'true' || optIn === '1');
}

export function isG678ModuleCoursePath(pathname: string): boolean {
  const match = pathname.match(/^\/courses\/[6-8]\/([a-z]{3}\d{3})\/\d{1,2}$/iu);
  return Boolean(match && isG678ModuleCode(match[1]!));
}
