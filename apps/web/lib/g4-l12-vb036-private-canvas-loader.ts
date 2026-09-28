import type {G4L12Vb036PrivateBehavior} from './g4-l12-vb036-private-behavior.server';

export type G4L12Vb036PrivateCanvasAsset = Readonly<{
  metadata: Readonly<{
    schemaVersion: number;
    animationId: string;
    fps: number;
    sourceSwfSha256: string;
    audioRendering: string;
    sourceButton52States: Readonly<Record<string, unknown>>;
    sourceBehaviorComposite: Readonly<{
      contractId: string;
      sourceContractFingerprintSha256: string;
      stateIds: readonly string[];
      avm1Executed: boolean;
    }>;
  }>;
  ready: () => Promise<void>;
  renderComposite: (canvas: HTMLCanvasElement, request: Readonly<{
    frame: number;
    scenario: 'source-static-frame';
    lang: 'en';
    seed: 0;
    behaviorCompositeContractId: string;
    behaviorCompositeState: string;
    button52State?: 'up' | 'over' | 'down';
    button52DownFrame?: number;
  }>) => Readonly<{
    frameDomain: string;
    localFrame: number;
    rootFrame: number;
    scenario: string;
    lang: string;
    seed: number;
    visualOnly: boolean;
    audioRendered: boolean;
    behaviorCompositeContractId: string;
    behaviorCompositeState: string;
    button52State: 'up' | 'over' | 'down';
    button52DownFrame: number;
    button52HitTestDiagnostic: false;
  }>;
}>;

const ANIMATION_ID = 'course-g04-l12-vb-036';
const SCRIPT_SHA = '0e957d8c210cb8bea7fb284055e38381c45bb9d08aa261e46bcd8a351c66eb9f';
const SCRIPT_INTEGRITY = 'sha256-DpV9jCEMuL6n+yhAVeODgcRbudCKomHka82KNRxm658=';
const CONTRACT_ID = 'g4-l12-vb036-source-controller-composite-v1';
const CONTRACT_FINGERPRINT = 'cb4a98cb70c4d466d2b34b4827d049b7b18ffd24a9aad295387045996b09fd9e';
const SOURCE_SHA = '08c76350118e13f0e423692a57881fec48506aed533c780e2662503b08e96f3b';

function expectedBehavior(behavior: G4L12Vb036PrivateBehavior) {
  return behavior.animationId === ANIMATION_ID && behavior.sha256 === SCRIPT_SHA &&
    behavior.bytes === 1_865_848 && behavior.contractId === CONTRACT_ID &&
    behavior.sourceContractFingerprintSha256 === CONTRACT_FINGERPRINT &&
    behavior.url === `/flash-assets/current-js-audio-calibration-v1/${ANIMATION_ID}/source-behavior?sha256=${SCRIPT_SHA}` &&
    behavior.stateIds.length === 201 && new Set(behavior.stateIds).size === 201 &&
    behavior.stateIds[0] === 'main-source-frame';
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'undefined';
}

// SRI and the server reader pin all source records. Here reject an old API or
// drift in the request/result surface before the component can use this realm.
function expectedButtonContract(value: Readonly<Record<string, unknown>> | undefined) {
  const states = ['up', 'over', 'down', 'hit-test'];
  return value?.contractId === 'g4-l12-vb036-source-button52-states-v1' &&
    value.sourceSwfSha256 === SOURCE_SHA &&
    value.sourceXmlSha256 === '5ad69306d727906b07b8653cb0e7091e7cf7abd6265e222bb86fabb1d1b15567' &&
    value.buttonCharacterId === 52 && value.ownerPopupCharacterId === 53 && value.defaultState === 'up' &&
    value.hitTestDiagnosticOnly === true && stableJson(value.states) === stableJson(states) &&
    stableJson(value.downSprite) === stableJson({characterId: 51, frameDomain: 'sprite-51', firstFrame: 1, lastFrame: 5, stopFrames: [5]}) &&
    stableJson(value.request) === stableJson({method: 'renderComposite', fieldsRejectedByRender: true, fields: {
      button52State: {type: 'enum', values: states, optional: true, default: 'up', hitTestDiagnosticOnly: true},
      button52DownFrame: {type: 'integer', minimum: 1, maximum: 5, optional: true, default: 1, drawingAppliesOnlyToState: 'down'},
    }}) && stableJson(value.result) === stableJson({method: 'renderComposite', fields: {
      button52State: {type: 'enum', values: states, normalizedRequestField: 'button52State'},
      button52DownFrame: {type: 'integer', minimum: 1, maximum: 5, normalizedRequestField: 'button52DownFrame'},
      button52HitTestDiagnostic: {type: 'boolean', trueExactlyWhen: {button52State: 'hit-test'}},
    }}) && ['audioRendered', 'avm1Executed', 'originalPointerLifecycleEstablished', 'originalRuntimeAccepted', 'visualFidelityAccepted']
      .every((key) => value[key] === false);
}

function expectedAsset(asset: G4L12Vb036PrivateCanvasAsset | undefined, behavior: G4L12Vb036PrivateBehavior) {
  const metadata = asset?.metadata, composite = metadata?.sourceBehaviorComposite;
  return metadata?.schemaVersion === 1 && metadata.animationId === ANIMATION_ID && metadata.fps === 12 &&
    metadata.sourceSwfSha256 === SOURCE_SHA && metadata.audioRendering === 'not-included' &&
    expectedButtonContract(metadata.sourceButton52States) &&
    composite?.contractId === behavior.contractId &&
    composite.sourceContractFingerprintSha256 === behavior.sourceContractFingerprintSha256 &&
    composite.avm1Executed === false && JSON.stringify(composite.stateIds) === JSON.stringify(behavior.stateIds) &&
    typeof asset?.ready === 'function' && typeof asset.renderComposite === 'function';
}

/**
 * One trusted, fixed-SRI script in one owned same-origin realm per component.
 * This is registry/lifetime isolation, not an untrusted-code sandbox. The top
 * window's registry is never read, deleted, replaced, or restored.
 */
export function createG4L12Vb036PrivateCanvasLoader(
  behavior: G4L12Vb036PrivateBehavior,
  ownerDocument: Document = document,
): Readonly<{ready: Promise<G4L12Vb036PrivateCanvasAsset>; dispose: () => void}> {
  if (!expectedBehavior(behavior)) throw new Error('Private behavior descriptor changed');
  const sourceUrl = new URL(behavior.url, ownerDocument.baseURI);
  if (sourceUrl.origin !== ownerDocument.location.origin || sourceUrl.protocol !== 'http:' ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(sourceUrl.hostname)) {
    throw new Error('Private behavior requires the exact same-origin loopback asset');
  }
  const frame = ownerDocument.createElement('iframe');
  frame.hidden = true;
  frame.inert = true;
  frame.style.display = 'none';
  frame.tabIndex = -1;
  frame.title = 'Private VB036 renderer realm';
  frame.setAttribute('aria-hidden', 'true');
  frame.referrerPolicy = 'no-referrer';
  frame.src = 'about:blank';
  frame.dataset.g4L12Vb036PrivateRealm = SCRIPT_SHA;
  let disposed = false, settled = false;
  let script: HTMLScriptElement | null = null;
  let resolveReady!: (asset: G4L12Vb036PrivateCanvasAsset) => void;
  let rejectReady!: (error: Error) => void;
  const ready = new Promise<G4L12Vb036PrivateCanvasAsset>((resolve, reject) => {
    resolveReady = resolve; rejectReady = reject;
  });
  const timer = setTimeout(() => fail(new Error('Private behavior load exceeded its bounded deadline')), 30_000);

  function detachHandlers() {
    frame.onload = null;
    frame.onerror = null;
    if (script) { script.onload = null; script.onerror = null; }
  }

  function fail(error: Error) {
    if (settled || disposed) return;
    settled = true; clearTimeout(timer); detachHandlers(); frame.remove(); rejectReady(error);
  }

  frame.onload = () => {
    if (disposed || settled) return;
    // Only the initial about:blank load creates a script. Its later load event
    // cannot create a second registration in this realm.
    frame.onload = null;
    try {
      const realmDocument = frame.contentDocument;
      const realm = frame.contentWindow as (Window & {
        HELP_MATH_CANVAS_ASSETS?: Record<string, G4L12Vb036PrivateCanvasAsset>;
      }) | null;
      if (!realmDocument || !realm || realmDocument.URL !== 'about:blank' ||
        realm === ownerDocument.defaultView) throw new Error('Private behavior realm was not isolated');
      script = realmDocument.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.integrity = SCRIPT_INTEGRITY;
      script.referrerPolicy = 'no-referrer';
      script.src = sourceUrl.href;
      script.dataset.g4L12Vb036PrivateBehavior = SCRIPT_SHA;
      script.onerror = () => fail(new Error('Private behavior fixed-SRI script failed to load'));
      script.onload = () => {
        if (disposed || settled) return;
        void (async () => {
          const captured = realm.HELP_MATH_CANVAS_ASSETS?.[ANIMATION_ID];
          if (!captured || !expectedAsset(captured, behavior)) throw new Error('Private behavior API changed');
          await captured.ready();
          if (disposed || settled) return;
          if (frame.contentWindow !== realm || frame.contentDocument !== realmDocument ||
            realm.HELP_MATH_CANVAS_ASSETS?.[ANIMATION_ID] !== captured) throw new Error('Private behavior realm changed during readiness');
          settled = true; clearTimeout(timer); detachHandlers();
          // Retain this realm and its decoded images until this owner unmounts.
          resolveReady(captured);
        })().catch((error: unknown) => fail(error instanceof Error ? error : new Error('Private behavior readiness failed')));
      };
      realmDocument.head.append(script);
    } catch (error) { fail(error instanceof Error ? error : new Error('Private behavior realm initialization failed')); }
  };
  frame.onerror = () => fail(new Error('Private behavior realm failed to load'));
  try { ownerDocument.body.append(frame); }
  catch (error) { fail(error instanceof Error ? error : new Error('Private behavior realm could not attach')); }

  return Object.freeze({ready, dispose() {
    if (disposed) return;
    disposed = true; clearTimeout(timer); detachHandlers(); frame.remove();
    if (!settled) { settled = true; rejectReady(new Error('Private behavior owner disposed')); }
  }});
}
