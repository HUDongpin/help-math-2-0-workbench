import {
  currentJsShowcasePublication,
  G5_L4_SHOWCASE_RELEASE_ID,
  type CurrentJsShowcaseEnvironment,
} from './current-js-showcase-publication';

export interface PublicCourseDiscoveryInput {
  readonly g4L3Available: boolean;
  readonly env?: CurrentJsShowcaseEnvironment;
}

export interface PublicCourseDiscovery {
  readonly g5L4ShowcaseEnabled: boolean;
  readonly lessonRoutes: readonly string[];
  readonly g5L4RobotDisallow: readonly string[];
}

/**
 * Keeps public discovery aligned with the exact G5 L4 current-JS showcase
 * authorization without expanding the separate strict release ledger.
 */
export function resolvePublicCourseDiscovery({
  g4L3Available,
  env = process.env,
}: PublicCourseDiscoveryInput): PublicCourseDiscovery {
  const g5L4ShowcaseEnabled = currentJsShowcasePublication(
    G5_L4_SHOWCASE_RELEASE_ID,
    env,
  ).enabled;

  return Object.freeze({
    g5L4ShowcaseEnabled,
    lessonRoutes: Object.freeze([
      ...(g4L3Available ? ['/courses/4/3'] : []),
      ...(g5L4ShowcaseEnabled ? ['/courses/5/4'] : []),
    ]),
    g5L4RobotDisallow: Object.freeze(g5L4ShowcaseEnabled
      ? []
      : ['/courses/5/4', '/es/courses/5/4']),
  });
}
