import {
  isG678LocalPreviewRequestUrl,
  type G678PreviewEnvironment,
} from './g678-preview-policy';

/** A distinct engineering evidence route; this is not a placement identity. */
export const ALG_L12_P006_ADMISSION_PATH =
  '/migration-status/g678-calibration/shared-alg001-l12-p006-admission';

export function isAlgL12P006AdmissionPath(pathname: string): boolean {
  return pathname === ALG_L12_P006_ADMISSION_PATH;
}

export function isAlgL12P006AdmissionRequest(
  request: Readonly<{pathname: string; method: string; url: Pick<URL, 'hostname'>}>,
  env: G678PreviewEnvironment = process.env,
): boolean {
  return (request.method === 'GET' || request.method === 'HEAD') &&
    isAlgL12P006AdmissionPath(request.pathname) &&
    isG678LocalPreviewRequestUrl(request.url, env);
}
