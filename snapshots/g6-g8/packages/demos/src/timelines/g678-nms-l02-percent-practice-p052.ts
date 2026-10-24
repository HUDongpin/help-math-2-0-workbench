import type {RuntimeContext} from '../contract';
import {P052_CAPTURE_SCENARIOS, type P052CaptureScenario} from '../nms-l02-p052-capture-state-v1';
import {p052BoundCapture, type P052CaptureIdentityRequest} from '../nms-l02-p052-capture-identity-v1';
import {P052_CAPTURE_IDENTITIES} from '../generated/nms-l02-p052-capture-identities-v1';
export {P052_AUDIO_SOURCE_SHA256 as SOURCE_SWF_SHA} from '../generated/nms-l02-p052-runtime-audio-v1';

/** Capture traces keep the caller's identity. A lesson host supplies sprite-350
 * and the route language; the published identity for that scenario is filled in. */
export function p052ModuleCapture(frame: number, context: RuntimeContext) {
  if (context.frame !== frame || context.frameDomain !== 'sprite-350' || context.rootFrame !== 6
    || (context.replay !== undefined && context.replay !== 0)) throw Error('P052_MODULE_CAPTURE_CONTEXT');
  if (context.lang !== 'en' && context.lang !== 'es') throw Error('P052_LANGUAGE');
  if (!Object.hasOwn(P052_CAPTURE_SCENARIOS, context.scenario)) throw Error('P052_CAPTURE_SCENARIO');
  const scenario = context.scenario as P052CaptureScenario;
  const captureTrace = context.traceId?.startsWith('candidate-') === true;
  const definition = P052_CAPTURE_SCENARIOS[scenario];
  const bounded = Math.min(definition.last, Math.max(definition.first, frame));
  const trace = `candidate-${scenario}-${context.lang}-seed-${context.seed}`;
  const request: P052CaptureIdentityRequest = captureTrace ? {
    frame, frameDomain: 'sprite-350', rootFrame: 6, scenario, language: context.lang, seed: context.seed,
    requirementId: context.requirementId ?? '', traceId: context.traceId ?? '',
    entryStateSha256: context.entryStateSha256 ?? '',
  } : {
    frame: bounded, frameDomain: 'sprite-350', rootFrame: 6, scenario, language: context.lang, seed: context.seed,
    requirementId: `req-${trace}`, traceId: trace,
    entryStateSha256: P052_CAPTURE_IDENTITIES[trace as keyof typeof P052_CAPTURE_IDENTITIES] ?? '',
  };
  return {...p052BoundCapture(request), request};
}
export {p052ModuleCapture as getFrameState};
