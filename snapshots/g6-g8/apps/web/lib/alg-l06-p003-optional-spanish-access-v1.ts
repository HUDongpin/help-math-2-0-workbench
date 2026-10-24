import {isP003ScopedAudioRequest} from './alg-l06-p003-local-audio-request-v1';
import type {G678PreviewEnvironment} from './g678-preview-policy';
export const P003_OPTIONAL_SPANISH_SHA256='d280e8f5e653c165755baf2f8960cfd667f03205d2f9aaafe1820a15d327f89a';
export const P003_OPTIONAL_SPANISH_BYTES=135408;
export const P003_OPTIONAL_SPANISH_PATH='/flash-assets/g678-local/shared-alg001-l06-p003/optional-spanish-audio-v1';
export const P003_OPTIONAL_SPANISH_URL=`${P003_OPTIONAL_SPANISH_PATH}?sha256=${P003_OPTIONAL_SPANISH_SHA256}`;
export const isP003OptionalSpanishRequest=(request:Parameters<typeof isP003ScopedAudioRequest>[0],
 env:G678PreviewEnvironment=process.env)=>isP003ScopedAudioRequest(request,
  {path:P003_OPTIONAL_SPANISH_PATH,sha256:P003_OPTIONAL_SPANISH_SHA256},env);
