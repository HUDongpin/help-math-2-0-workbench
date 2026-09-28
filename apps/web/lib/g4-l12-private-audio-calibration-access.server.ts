import 'server-only';

import {
  G4_L12_SHOWCASE_RELEASE_ID,
  currentJsShowcasePublication,
} from './current-js-showcase-publication';

export const G4_L12_PRIVATE_AUDIO_CALIBRATION_FLAG =
  'CURRENT_JS_PRIVATE_G4_L12_AUDIO_CALIBRATION_ENABLED';

type HeaderReader = Pick<Headers, 'get'>;

export type G4L12PrivateAudioCalibrationEnvironment = Readonly<
  Record<string, string | undefined>
>;

export interface G4L12PrivateAudioCalibrationAccessInput {
  readonly headers: HeaderReader;
  readonly url?: string | URL;
  readonly env?: G4L12PrivateAudioCalibrationEnvironment;
}

function validPort(value: string | undefined) {
  if (value === undefined) return true;
  if (!/^[1-9][0-9]{0,4}$/u.test(value)) return false;
  const port = Number(value);
  return port >= 1 && port <= 65_535;
}

export function isG4L12PrivateAudioCalibrationLoopbackHost(
  value: string | null | undefined,
) {
  if (!value) return false;
  const ipv4OrLocalhost = value.match(
    /^(?:127\.0\.0\.1|localhost)(?::([0-9]+))?$/iu,
  );
  if (ipv4OrLocalhost) return validPort(ipv4OrLocalhost[1]);
  const ipv6 = value.match(/^\[::1\](?::([0-9]+))?$/u);
  return Boolean(ipv6 && validPort(ipv6[1]));
}

function isPlainHttp(value: string | null | undefined) {
  return value === 'http' || value === 'http:';
}

/**
 * Exact local-only admission for the G4 L12 VB035/VB036 audio calibration.
 *
 * Server components may omit `url` when they have only request headers. In
 * that case an exact loopback Host plus an absent or plain-HTTP forwarded
 * protocol is the direct-local HTTP signal. Route handlers pass the complete
 * URL, which is validated independently as plain HTTP loopback.
 */
export function isG4L12PrivateAudioCalibrationAllowed({
  headers,
  url,
  env = process.env,
}: G4L12PrivateAudioCalibrationAccessInput): boolean {
  if (
    env.NODE_ENV !== 'development' ||
    env[G4_L12_PRIVATE_AUDIO_CALIBRATION_FLAG] !== 'true' ||
    env.VERCEL_ENV !== undefined ||
    !currentJsShowcasePublication(G4_L12_SHOWCASE_RELEASE_ID, env).enabled
  ) {
    return false;
  }

  const host = headers.get('host');
  const forwardedHost = headers.get('x-forwarded-host');
  const forwardedProtocol = headers.get('x-forwarded-proto');
  if (!isG4L12PrivateAudioCalibrationLoopbackHost(host)) return false;
  if (
    forwardedHost !== null &&
    !isG4L12PrivateAudioCalibrationLoopbackHost(forwardedHost)
  ) {
    return false;
  }
  if (forwardedProtocol !== null && !isPlainHttp(forwardedProtocol)) {
    return false;
  }

  if (url !== undefined) {
    let parsed: URL;
    try {
      parsed = url instanceof URL ? url : new URL(url);
    } catch {
      return false;
    }
    if (
      !isPlainHttp(parsed.protocol) ||
      !isG4L12PrivateAudioCalibrationLoopbackHost(parsed.host) ||
      parsed.username ||
      parsed.password
    ) {
      return false;
    }
  }
  return true;
}
