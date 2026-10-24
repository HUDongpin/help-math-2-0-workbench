import {isP003ScopedAudioRequest} from './alg-l06-p003-local-audio-request-v1';
import type {G678PreviewEnvironment} from './g678-preview-policy';

export const P003_CONTINUOUS_SOURCE_SHA256 =
  '91ddead67e2e39640b4fe76493f9764959daba8dab40e0ac2036670103285111';
export const P003_CONTINUOUS_SOURCE_BYTES = 263640;
export const P003_CONTINUOUS_SOURCE_PATH =
  '/flash-assets/g678-local/shared-alg001-l06-p003/continuous-source-v2';
export const P003_CONTINUOUS_SOURCE_URL =
  `${P003_CONTINUOUS_SOURCE_PATH}?sha256=${P003_CONTINUOUS_SOURCE_SHA256}`;
export const isP003ContinuousSourceRequest = (request:Parameters<typeof isP003ScopedAudioRequest>[0],
  env:G678PreviewEnvironment=process.env) => isP003ScopedAudioRequest(request,
    {path:P003_CONTINUOUS_SOURCE_PATH,sha256:P003_CONTINUOUS_SOURCE_SHA256},env);
