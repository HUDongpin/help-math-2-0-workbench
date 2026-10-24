import {
  ADVANCED_MANUAL_ACCEPTANCE_EFFECTS,
  clamp,
  isActivationInput,
  type ActivationInput,
} from './contracts';

const TOTAL_MEDIA_FRAMES = 127;
const PROGRESS_TRACK_WIDTH = 110;

export const GEO001_L01_P001_BEHAVIOR_IR_V1 = Object.freeze({
  schemaVersion: 1,
  artifactType: 'help-math-source-bound-advanced-manual-behavior-ir',
  version: 'shared-geo001-l01-p001-v1',
  animationId: 'shared-geo001-l01-p001',
  lane: 'behavior-heavy',
  laneSelectionReason:
    'The source exports a separately clocked 127-frame media sprite, a drag-seek progress component, and legacy FUI scroll classes; automatic behavior generation is not authorized.',
  source: Object.freeze({
    path: 'G6-G8-shared/GEO001/L1/IR/L1IR01.swf',
    catalogPath: 'HELP_COURSES/GEO001/L1/IR/L1IR01.swf',
    bytes: 69_749,
    sha256: '3034f4bb5df7a2033a57aacf8de5ba1cbda5add4c2d30a7987bac0769403b226',
    assetId: 'swf-3034f4bb5df7a2033a57aacf8de5ba1cbda5add4c2d30a7987bac0769403b226',
    sourceKind: 'swf-only',
  }),
  structuralEvidence: Object.freeze({
    report: Object.freeze({
      path: 'work/g678-shared-page-factory/calibration-structure-final-20260901-155359-v2/report.json',
      bytes: 274_459,
      sha256: 'af830040388dd502ca193f482f084a9db49da2176e26ed39ebe7e01f5e706b97',
    }),
    swfmillXml: Object.freeze({
      path: 'placements/shared-geo001-l01-p001/swfmill/source.xml',
      bytes: 768_816,
      sha256: 'b2f26495714ae1691260f439a3517520e7edc917ba6d4f58aa5126bc7aeaf466',
    }),
    ffdecDumpAs2: Object.freeze({
      path: 'placements/shared-geo001-l01-p001/logs/ffdec-dumpAS2.stdout.txt',
      bytes: 1_983,
      sha256: 'b0a0cd7b9bca7e307bd7689eff4e09d4b0eaaa4ca1e7fd4a8041d40606fd17a4',
    }),
    exportedScriptSet: Object.freeze({
      fileCount: 31,
      totalBytes: 28_351,
      canonicalProjection:
        'structural-report exportedScripts.files serialized as sorted-key compact JSON plus LF',
      sha256: '014c909be81aa5e9977bc79070737dc4916afdbb9ee753025c0594eca471deb8',
    }),
  }),
  runtime: Object.freeze({
    stage: Object.freeze({width: 800, height: 600}),
    fps: 12,
    rootFrameCount: 10,
    rootPlacement: Object.freeze({rootFrame: 6, instanceName: 'animation', objectId: 142}),
    mainFrameDomain: Object.freeze({
      id: 'sprite-142',
      objectId: 142,
      frameCount: TOTAL_MEDIA_FRAMES,
      soundStreamHeadCount: 1,
      soundStreamBlockCount: 127,
    }),
  }),
  progress: Object.freeze({
    frameDomain: Object.freeze({id: 'sprite-11-progress-bar', objectId: 11, frameCount: 2}),
    exportedLinkage: 'progress-bar',
    wrapperLinkage: Object.freeze({objectId: 12, name: 'media-controls'}),
    frameLabels: Object.freeze({idle: 'mediaPlaying', dragging: 'moveMedia'}),
    trackWidth: PROGRESS_TRACK_WIDTH,
    progressBarVisibility: 'hidden-by-source-setProgressBar',
    frameFromXExpression: 'int(drag_But._x / 110 * _parent._parent._totalframes) + 1',
    xFromFrameExpression: '110 * _parent._parent._currentframe / _parent._parent._totalframes',
    resumeRule: 'play parent only when currentframe != totalframes',
    scriptEvidence: Object.freeze([
      Object.freeze({
        path: 'scripts/DefineSprite_11_progress-bar/frame_1/DoAction.as',
        bytes: 904,
        sha256: 'ae54c35f36eb23e9da7487d8ac0ca2aab1ee7b28ad11fb03e21500b17cd8c938',
      }),
      Object.freeze({
        path: 'scripts/DefineSprite_11_progress-bar/frame_2/PlaceObject2_5_mover_7/CLIPACTIONRECORD onClipEvent(enterFrame).as',
        bytes: 58,
        sha256: '824286102bc4f691479760ca15931d7797612fdd7a5101133fa180c18cbbc77b',
      }),
      Object.freeze({
        path: 'scripts/DefineButton2_6/BUTTONCONDACTION on(press).as',
        bytes: 35,
        sha256: '6a2e175c15fe298fe443ae1d8a2ffebb526c952f274ab37f1ac79769bf617bbb',
      }),
      Object.freeze({
        path: 'scripts/DefineButton2_6/BUTTONCONDACTION on(release, releaseOutside).as',
        bytes: 52,
        sha256: '8af644f207f34027243ecc38150d68b1d63c09f7da35dbed6943830fcb5855b8',
      }),
      Object.freeze({
        path: 'scripts/DefineButton2_10/BUTTONCONDACTION on(release).as',
        bytes: 84,
        sha256: '8803e69a33fc88f7e80e8f00b6699b6e052468eb1e89fa00d26a3dd4cbbe3d1b',
      }),
    ]),
  }),
  fuiScroll: Object.freeze({
    component: Object.freeze({objectId: 13, exportedLinkage: 'FUIComponentSymbol'}),
    scrollBar: Object.freeze({objectId: 94, exportedLinkage: 'FScrollBarSymbol'}),
    skinLinkages: Object.freeze({up: 'UpArrow', down: 'DownArrow', thumb: 'ScrollThumb'}),
    defaultSmallScroll: 1,
    defaultLargeScroll: 0,
    pageStepRule: 'largeScroll when nonzero; otherwise pageSize',
    thumbPositionRule:
      'round((maxPos - minPos) * (thumbY - scrollTop) / trackHeight) + minPos',
    scriptEvidence: Object.freeze([
      Object.freeze({
        path: 'scripts/FScrollBarSymbol.as',
        bytes: 13_570,
        sha256: '5ac9d9e477e7b50808c1805c33473f0e50b0121d0789cd7d208a085007047b8d',
      }),
      Object.freeze({
        path: 'scripts/FUIComponentSymbol.as',
        bytes: 10_244,
        sha256: '326219b08e2695ccdd29734ea68a6277cda0549e1e98479be25597ffd9496972',
      }),
    ]),
    reachability: 'exported-linkage-only-not-proven-placed-in-sprite-142',
    pageReducerDisposition: 'blocked-until-placement-attachment-evidence',
    productControlEnabled: false,
    modernKeyboardSemantics: 'Enter/Space mirror the named mouse control action',
    legacyKeyboardParity: false,
  }),
  blockers: Object.freeze([
    'The page SWF has no FLA authoring source.',
    'The page exports media-controls and FUI linkage classes but swfmill does not place them in sprite-142; host attachment remains unproven.',
    'FUIComponentClass calls myOnKeyDown/myOnKeyUp, but this SWF export does not define their scrollbar behavior; modern Enter/Space support is an accessibility extension, not legacy parity.',
    'Natural terminal looping/stopping and audio behavior require authorized original-runtime evidence.',
  ]),
  acceptanceEffects: ADVANCED_MANUAL_ACCEPTANCE_EFFECTS,
});

export interface GeoScrollState {
  readonly pageSize: number;
  readonly minPosition: number;
  readonly maxPosition: number;
  readonly position: number;
  readonly smallScroll: number;
  readonly largeScroll: number;
  readonly scrollable: boolean;
}

export interface Geo001State {
  readonly mediaFrame: number;
  readonly mediaPlaying: boolean;
  readonly progressMode: 'mediaPlaying' | 'moveMedia';
  readonly dragging: boolean;
  readonly draggerX: number;
  readonly loadedFrames: number;
  readonly loadedWidth: number;
  readonly scroll: GeoScrollState;
  readonly replay: number;
  readonly blockedReason: string | null;
}

export type Geo001Event =
  | Readonly<{type: 'observe-media-frame'; frame: number; playing: boolean}>
  | Readonly<{type: 'set-loaded-frames'; frames: number}>
  | Readonly<{type: 'begin-seek'; input: ActivationInput}>
  | Readonly<{type: 'drag-seek'; x: number}>
  | Readonly<{type: 'release-seek'; input: ActivationInput}>
  | Readonly<{type: 'click-seek'; input: ActivationInput; x: number}>
  | Readonly<{
      type: 'configure-scroll';
      pageSize: number;
      minPosition: number;
      maxPosition: number;
      position?: number;
      smallScroll?: number;
      largeScroll?: number;
    }>
  | Readonly<{type: 'scroll-small'; input: ActivationInput; direction: -1 | 1}>
  | Readonly<{type: 'scroll-page'; input: ActivationInput; direction: -1 | 1}>
  | Readonly<{type: 'scroll-thumb'; ratio: number}>
  | Readonly<{type: 'replay'; input: ActivationInput}>;

export function geoFrameForDraggerX(x: number): number {
  const boundedX = clamp(x, 0, PROGRESS_TRACK_WIDTH);
  return clamp(
    Math.trunc((boundedX / PROGRESS_TRACK_WIDTH) * TOTAL_MEDIA_FRAMES) + 1,
    1,
    TOTAL_MEDIA_FRAMES,
  );
}

export function geoDraggerXForFrame(frame: number): number {
  return (PROGRESS_TRACK_WIDTH * clamp(Math.trunc(frame), 1, TOTAL_MEDIA_FRAMES)) /
    TOTAL_MEDIA_FRAMES;
}

export function createGeo001State(): Geo001State {
  return {
    mediaFrame: 1,
    mediaPlaying: true,
    progressMode: 'mediaPlaying',
    dragging: false,
    draggerX: geoDraggerXForFrame(1),
    loadedFrames: TOTAL_MEDIA_FRAMES,
    loadedWidth: PROGRESS_TRACK_WIDTH,
    scroll: {
      pageSize: 0,
      minPosition: 0,
      maxPosition: 0,
      position: 0,
      smallScroll: 1,
      largeScroll: 0,
      scrollable: false,
    },
    replay: 0,
    blockedReason: null,
  };
}

function blocked(state: Geo001State, reason: string): Geo001State {
  return {...state, blockedReason: reason};
}

function withScrollPosition(state: Geo001State, position: number): Geo001State {
  if (!state.scroll.scrollable) {
    return blocked(state, 'fui-linkage-placement-unproven');
  }
  return {
    ...state,
    blockedReason: null,
    scroll: {
      ...state.scroll,
      position: clamp(Math.round(position), state.scroll.minPosition, state.scroll.maxPosition),
    },
  };
}

export function reduceGeo001(state: Geo001State, event: Geo001Event): Geo001State {
  switch (event.type) {
    case 'observe-media-frame': {
      const mediaFrame = clamp(Math.trunc(event.frame), 1, TOTAL_MEDIA_FRAMES);
      return {
        ...state,
        mediaFrame,
        mediaPlaying: event.playing,
        draggerX: geoDraggerXForFrame(mediaFrame),
        blockedReason: null,
      };
    }
    case 'set-loaded-frames': {
      const loadedFrames = clamp(Math.trunc(event.frames), 0, TOTAL_MEDIA_FRAMES);
      return {
        ...state,
        loadedFrames,
        loadedWidth: (PROGRESS_TRACK_WIDTH * loadedFrames) / TOTAL_MEDIA_FRAMES,
        blockedReason: null,
      };
    }
    case 'begin-seek':
      if (!isActivationInput(event.input)) return blocked(state, 'activation-input-unsupported');
      return {
        ...state,
        mediaPlaying: false,
        progressMode: 'moveMedia',
        dragging: true,
        blockedReason: null,
      };
    case 'drag-seek': {
      if (!state.dragging) return blocked(state, 'seek-not-active');
      const draggerX = clamp(event.x, 0, PROGRESS_TRACK_WIDTH);
      return {
        ...state,
        draggerX,
        mediaFrame: geoFrameForDraggerX(draggerX),
        mediaPlaying: false,
        blockedReason: null,
      };
    }
    case 'release-seek': {
      if (!isActivationInput(event.input)) return blocked(state, 'activation-input-unsupported');
      if (!state.dragging) return blocked(state, 'seek-not-active');
      const mediaFrame = geoFrameForDraggerX(state.draggerX);
      return {
        ...state,
        mediaFrame,
        mediaPlaying: mediaFrame !== TOTAL_MEDIA_FRAMES,
        progressMode: 'mediaPlaying',
        dragging: false,
        blockedReason: null,
      };
    }
    case 'click-seek': {
      if (!isActivationInput(event.input)) return blocked(state, 'activation-input-unsupported');
      const draggerX = clamp(event.x, 0, PROGRESS_TRACK_WIDTH);
      const mediaFrame = geoFrameForDraggerX(draggerX);
      return {
        ...state,
        draggerX,
        mediaFrame,
        mediaPlaying: mediaFrame !== TOTAL_MEDIA_FRAMES,
        progressMode: 'mediaPlaying',
        dragging: false,
        blockedReason: null,
      };
    }
    case 'configure-scroll': {
      return blocked(state, 'fui-linkage-placement-unproven');
    }
    case 'scroll-small':
      if (!isActivationInput(event.input)) return blocked(state, 'activation-input-unsupported');
      return withScrollPosition(
        state,
        state.scroll.position + event.direction * state.scroll.smallScroll,
      );
    case 'scroll-page': {
      if (!isActivationInput(event.input)) return blocked(state, 'activation-input-unsupported');
      const step = state.scroll.largeScroll || state.scroll.pageSize;
      return withScrollPosition(state, state.scroll.position + event.direction * step);
    }
    case 'scroll-thumb': {
      return blocked(state, 'fui-linkage-placement-unproven');
    }
    case 'replay':
      if (!isActivationInput(event.input)) return blocked(state, 'activation-input-unsupported');
      return {...createGeo001State(), replay: state.replay + 1};
  }
}
