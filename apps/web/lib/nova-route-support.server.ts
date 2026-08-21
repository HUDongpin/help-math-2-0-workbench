import {isSameOriginServerRequest} from './same-origin-request.server';

export function isNovaTutorEnabled(
  environment: NodeJS.ProcessEnv = process.env,
) {
  return environment.NOVA_TUTOR_ENABLED === 'true';
}

export function isNovaFrameContextEnabled(
  environment: NodeJS.ProcessEnv = process.env,
) {
  return environment.NOVA_ALLOW_FRAME_CONTEXT === 'true';
}

export const isSameOriginNovaRequest = isSameOriginServerRequest;
