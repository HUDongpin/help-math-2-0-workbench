export const PRIVATE_CALIBRATION_PATH = '/animations/g4-l12-audio-calibration';

/** Keep only the exact page identity required by the private calibration route. */
export function languageSwitchHref(pathname: string, query: Pick<URLSearchParams, 'entries'>): string {
  if (pathname !== PRIVATE_CALIBRATION_PATH) return pathname;
  const entries = [...query.entries()];
  if (entries.length !== 1 || entries[0][0] !== 'animationId') return pathname;
  const animationId = entries[0][1];
  if (animationId !== 'course-g04-l12-vb-035' && animationId !== 'course-g04-l12-vb-036') return pathname;
  return `${pathname}?animationId=${animationId}`;
}
