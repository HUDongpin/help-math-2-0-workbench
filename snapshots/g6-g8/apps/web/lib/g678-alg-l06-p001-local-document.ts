const P001_PLACEMENT = 'shared-alg001-l06-p001';
const LOCALE = '(?:en|es)';

export type P001LocalDocument =
  | {readonly kind: 'calibration'}
  | {readonly kind: 'hfr-review'; readonly mode: 'candidate' | 'registered'};

/** A loopback document that is showing this one placement. Glyphs and narration decide separately. */
export function p001LocalDocument(pathname: string): P001LocalDocument | null {
  if (new RegExp(
    `^/${LOCALE}/migration-status/g678-calibration/${P001_PLACEMENT}$`,
    'u',
  ).test(pathname)) return {kind: 'calibration'};
  const review = pathname.match(new RegExp(
    `^/${LOCALE}/migration-status/g678-hfr/${P001_PLACEMENT}/(candidate|registered)$`,
    'u',
  ));
  const mode = review?.[1];
  if (mode !== 'candidate' && mode !== 'registered') return null;
  return {kind: 'hfr-review', mode};
}
