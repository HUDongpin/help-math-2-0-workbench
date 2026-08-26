import {isSameOriginServerRequest} from './same-origin-request.server';
import {publicFeatureEnabled} from './public-launch-manifest.server';

export function isNovaTutorEnabled(
  environment: NodeJS.ProcessEnv = process.env,
) {
  return environment.NOVA_TUTOR_ENABLED === 'true'
    && (environment.NODE_ENV !== 'production'
      || publicFeatureEnabled('novaTutor'));
}

export function isNovaFrameContextEnabled(
  environment: NodeJS.ProcessEnv = process.env,
) {
  return environment.NOVA_ALLOW_FRAME_CONTEXT === 'true'
    && (environment.NODE_ENV !== 'production'
      || publicFeatureEnabled('novaTutor'));
}

export const isSameOriginNovaRequest = isSameOriginServerRequest;
