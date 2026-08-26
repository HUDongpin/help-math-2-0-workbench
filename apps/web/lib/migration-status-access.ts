export function isMigrationStatusAvailable(
  env: Readonly<Record<string, string | undefined>> = process.env,
) {
  // Migration status contains source-ledger and workbench diagnostics. It is a
  // local engineering surface, never a public-launch feature. In particular,
  // a legacy deployment variable must not be able to reopen it in Production.
  return env.NODE_ENV !== 'production';
}

export function isMigrationStatusDesignerViewRequested(
  value: string | readonly string[] | null | undefined,
) {
  if (Array.isArray(value)) return value.length === 1 && value[0] === 'designer';
  return value === 'designer';
}
