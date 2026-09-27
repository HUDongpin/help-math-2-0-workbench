/** Public serving authorization is independent of migration and listening acceptance. */
export const CURRENT_JS_1751_PUBLIC_PRODUCTION = 'current-js-1751-public-production-v1';
export const CURRENT_JS_1751_PUBLIC_PROJECT = 'prj_q3v5Ue0zCL1T9rzTFD21KpNc5tzu';
const PUBLIC_HOSTS = ['helpmath.ai', 'www.helpmath.ai'];
type Environment = Readonly<Record<string, string | undefined>>;

export function public1751BuildRequested(env: Environment = process.env) {
  return env.HELP_MATH_1751_PUBLIC_PRODUCTION === CURRENT_JS_1751_PUBLIC_PRODUCTION;
}

export function public1751EnvironmentAllowed(env: Environment = process.env) {
  if (env.NODE_ENV !== 'production') return false;
  if (env.VERCEL_ENV === 'production') return env.VERCEL_PROJECT_ID === CURRENT_JS_1751_PUBLIC_PROJECT;
  return env.VERCEL_ENV === undefined &&
    env.HELP_MATH_1751_PUBLIC_PRODUCTION_LOCAL === CURRENT_JS_1751_PUBLIC_PRODUCTION;
}

export function isPublic1751Production(env: Environment = process.env) {
  return process.env.HELP_MATH_1751_PUBLIC_PRODUCTION_BUILD === CURRENT_JS_1751_PUBLIC_PRODUCTION &&
    public1751BuildRequested(env) && public1751EnvironmentAllowed(env);
}

export function public1751RequestAllowed(url: URL, hostHeader: string | null, env: Environment = process.env) {
  if (!isPublic1751Production(env) || url.username || url.password || hostHeader === null) return false;
  if (env.VERCEL_ENV === 'production') {
    const stagedHost = env.VERCEL_URL;
    const allowedHost = PUBLIC_HOSTS.includes(url.hostname) ||
      (stagedHost === url.hostname && stagedHost.endsWith('.vercel.app'));
    return url.protocol === 'https:' && url.port === '' && hostHeader === url.host && allowedHost;
  }
  const localHost = /^(127\.0\.0\.1|localhost|\[::1\])(?::([0-9]{1,5}))?$/u.exec(hostHeader);
  return url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) &&
    localHost !== null && Number(localHost[2] ?? 80) === Number(url.port || 80);
}
