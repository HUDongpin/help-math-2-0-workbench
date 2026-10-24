// Source-bound playback candidate for L9RW03. This is not a renderer or a
// Current-JS registration; nested drawing and source audio remain separate.
export const NMS_L09_P003_SOURCE = Object.freeze({
  animationId: "shared-nms002-l09-p003",
  swfSha256: "d6841b40ee8da4857ba9075944c2393ee214e056373fe10abd2f0c2b2a375ebd",
  rootFrameCount: 10,
  rootBeginFrame: 6,
  mainFrameDomain: "sprite-246",
  mainFrameCount: 635,
  terminalStopFrame: 635,
  fps: 12,
  rootPlacedCharacterIds: Object.freeze([246, 247, 249, 250]),
  rootSiblingSpriteId: 249,
  nestedSpriteIds: Object.freeze([10, 23, 28, 55, 74, 88, 101, 241]),
  soundStreamBlockCount: 635,
  sourceAudioAccepted: false,
});

export interface NmsL09P003ClockState {
  readonly frameDomain: "sprite-246";
  readonly frame: number;
  readonly rootFrame: 6;
  readonly playing: boolean;
  readonly revision: number;
  readonly modernLessonControl: "none" | "pause" | "resume" | "replay";
  readonly audioEnabled: false;
}

export type NmsL09P003ClockEvent =
  | Readonly<{type: "synchronize-frame"; frame: number}>
  | Readonly<{type: "pause"}>
  | Readonly<{type: "resume"; frame: number}>
  | Readonly<{type: "replay"}>;

export const NMS_L09_P003_AUTHORITY = Object.freeze({
  sourceStructureAndTerminalScriptAudited: true,
  rootAndNestedVisualCompositingEstablished: false,
  sourceAudioAccepted: false,
  currentJavaScriptRegistered: false,
  originalRuntimeAccepted: false,
  fidelityAccepted: false,
  humanAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  published: false,
});

function exactFrame(frame: number): number {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame >
      NMS_L09_P003_SOURCE.mainFrameCount) {
    throw new Error(`invalid NMS L9 P003 source frame: ${frame}`);
  }
  return frame;
}

function state(frame: number, revision: number,
  control: NmsL09P003ClockState["modernLessonControl"],
  playing = frame < NMS_L09_P003_SOURCE.terminalStopFrame):
NmsL09P003ClockState {
  return Object.freeze({frameDomain: "sprite-246", frame,
    rootFrame: 6, playing, revision, modernLessonControl: control,
    audioEnabled: false});
}

export function createNmsL09P003Clock(initialFrame = 1):
NmsL09P003ClockState {
  return state(exactFrame(initialFrame), 0, "none");
}

export function reduceNmsL09P003Clock(
  current: NmsL09P003ClockState,
  event: NmsL09P003ClockEvent,
): NmsL09P003ClockState {
  if (!Object.isFrozen(current) || current.frameDomain !== "sprite-246" ||
      current.rootFrame !== 6 || current.audioEnabled !== false ||
      !Number.isSafeInteger(current.revision) || current.revision < 0) {
    throw new Error("invalid NMS L9 P003 clock state");
  }
  exactFrame(current.frame);
  if (current.frame === NMS_L09_P003_SOURCE.terminalStopFrame &&
      current.playing) {
    throw new Error("invalid NMS L9 P003 terminal clock state");
  }
  switch (event.type) {
    case "synchronize-frame": {
      const frame = exactFrame(event.frame);
      if (!current.playing || frame === current.frame) return current;
      return state(frame, current.revision, "none");
    }
    case "pause":
      if (!current.playing) return current;
      return state(current.frame, current.revision + 1, "pause", false);
    case "resume": {
      const frame = exactFrame(event.frame);
      return state(frame, current.revision + 1, "resume");
    }
    case "replay":
      return state(1, current.revision + 1, "replay");
    default:
      return event satisfies never;
  }
}
