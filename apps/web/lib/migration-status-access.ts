export function isMigrationStatusAvailable(
  env: Readonly<Record<string, string | undefined>> = process.env,
) {
  return env.NODE_ENV !== 'production'
    || env.MIGRATION_STATUS_ENABLED === '1';
}

export function isMigrationStatusDesignerViewRequested(
  value: string | readonly string[] | null | undefined,
) {
  if (Array.isArray(value)) return value.length === 1 && value[0] === 'designer';
  return value === 'designer';
}
