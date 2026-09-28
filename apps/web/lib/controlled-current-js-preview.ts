import {isPublic1751Production, public1751RequestAllowed} from './current-js-1751-public-production';
import program from '../config/current-js-controlled-preview.v1.json';
import supplement from '../config/current-js-controlled-preview-supplement.v1.json';

export const CONTROLLED_CURRENT_JS_PREVIEW = 'current-js-1751-controlled-preview-v1';
export const CONTROLLED_PREVIEW_PROJECT_ID = 'prj_q3v5Ue0zCL1T9rzTFD21KpNc5tzu';
type Environment = Readonly<Record<string, string | undefined>>;

if (program.schemaVersion !== 1 || program.profileId !== CONTROLLED_CURRENT_JS_PREVIEW ||
  program.scope.occurrenceCount !== 1751 || program.scope.lessonCount !== 29 ||
  program.courses.length !== 29 || program.courses.reduce((sum, course) => sum + course.pageCount, 0) !== 1751 ||
  new Set(program.courses.map((course) => course.releaseId)).size !== 29 ||
  Object.values(program.authority).some(Boolean)) {
  throw new Error('Controlled Current-JS preview scope is invalid');
}

export function controlledCurrentJsPreviewBuildRequested(env: Environment = process.env) {
  return env.HELP_MATH_CONTROLLED_CURRENT_JS_PREVIEW === CONTROLLED_CURRENT_JS_PREVIEW;
}

export function controlledCurrentJsPreviewEnvironmentAllowed(env: Environment = process.env) {
  if (env.NODE_ENV !== 'production') return false;
  if (env.VERCEL_ENV === 'preview') return env.VERCEL_PROJECT_ID === CONTROLLED_PREVIEW_PROJECT_ID;
  return env.VERCEL_ENV === undefined &&
    env.HELP_MATH_CONTROLLED_CURRENT_JS_PREVIEW_LOCAL === CONTROLLED_CURRENT_JS_PREVIEW;
}

export function isControlledCurrentJsPreview(env: Environment = process.env) {
  return isPublic1751Production(env) ||
    (process.env.HELP_MATH_CONTROLLED_CURRENT_JS_PREVIEW_BUILD === CONTROLLED_CURRENT_JS_PREVIEW &&
      controlledCurrentJsPreviewEnvironmentAllowed(env));
}

export function controlledPreviewReleaseAvailable(releaseId: string) {
  return program.courses.some((course) => course.releaseId === releaseId);
}

export function controlledPreviewCoursePathAvailable(pathname: string) {
  return program.courses.some((course) => pathname === `/courses/${course.grade}/${course.lesson}`);
}

export function controlledPreviewRequestAllowed(url: URL, hostHeader: string | null, env: Environment = process.env) {
  if (isPublic1751Production(env)) return public1751RequestAllowed(url, hostHeader, env);
  if (!isControlledCurrentJsPreview(env)) return false;
  if (url.username || url.password || hostHeader === null) return false;
  if (env.VERCEL_ENV === 'preview') {
    const hostnames = [env.VERCEL_URL, env.VERCEL_BRANCH_URL].filter(Boolean);
    return hostHeader === url.host && url.protocol === 'https:' && hostnames.includes(url.hostname) && url.hostname.endsWith('.vercel.app');
  }
  // NextURL canonicalizes loopback addresses to localhost. Verify both the
  // original Host and that normalized URL without accepting a public alias.
  const localHost = /^(127\.0\.0\.1|localhost|\[::1\])(?::([0-9]{1,5}))?$/u.exec(hostHeader);
  return url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
    && localHost !== null && Number(localHost[2] ?? 80) === Number(url.port || 80);
}

export const CONTROLLED_PREVIEW_COURSES = Object.freeze(program.courses);

export function controlledPreviewSupplementRecord(segments: readonly string[]) {
  const assetPath = segments.join('/');
  return supplement.entries.find((record) => record.assetPath === assetPath);
}
