import {isSameOriginServerRequest} from './same-origin-request.server';

export function isSameOriginLearningEventRequest(request: Request): boolean {
  return isSameOriginServerRequest(request);
}
