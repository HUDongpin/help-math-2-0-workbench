const ALG_L6_P001_DOCUMENT_REFERERS: ReadonlySet<string> = new Set([
  '/en/migration-status/g678-calibration/shared-alg001-l06-p001',
  '/es/migration-status/g678-calibration/shared-alg001-l06-p001',
  '/en/migration-status/g678-hfr/shared-alg001-l06-p001/candidate',
  '/es/migration-status/g678-hfr/shared-alg001-l06-p001/candidate',
  '/en/migration-status/g678-hfr/shared-alg001-l06-p001/registered',
  '/es/migration-status/g678-hfr/shared-alg001-l06-p001/registered',
]);

/** Pathname only. A query, including an audio play flag, is not part of this gate. */
export function isAlgL6P001DocumentReferer(pathname: string): boolean {
  return ALG_L6_P001_DOCUMENT_REFERERS.has(pathname);
}
