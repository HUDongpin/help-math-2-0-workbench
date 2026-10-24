import {P056_DISPLAY_SOURCE} from '../generated/nms-l02-p056-display-list-v1';

/** Source-script facts only. This is not a renderer, glossary definition, or Current-JS admission. */
export const P056_SOURCE_BEHAVIOR = Object.freeze({
  animationId: "shared-nms002-l02-p056",
  swfSha256: "a1872d6c20987340889c1077d6720cbfe046faa3b5228164987e0834f3c639be",
  rootFrameCount: 10,
  teachingFrameDomain: "sprite-24",
  teachingFrameCount: 234,
  firstButtonPlacementFrame: 9,
} as const);

export const P056_SOURCE_BUTTONS = Object.freeze([
  Object.freeze({
    characterId: 16,
    sourceKeyAttribute: "Organize",
    actionScriptSha256: "3c8d24c6004268559632a1b6e61b7413f050930c7c294770af72f03c630d76ff",
  }),
  Object.freeze({
    characterId: 17,
    sourceKeyAttribute: "Information",
    actionScriptSha256: "0b1df7b90fc817c04082cc0aa91b1b7e3992aebefc6bee520774ff1471396a4f",
  }),
] as const);

export const P056_SOURCE_ACTION_ORDER = Object.freeze([
  "set _global.KeyAttribute to the button's sourceKeyAttribute",
  "_root.DoHyperLinks()",
  "_root.animation_mc.animation.stop()",
] as const);

/** DefineShape 15 bounds and DefineButton2 hitTest transforms from the shipped SWF. */
export const P056_SOURCE_BUTTON_HIT_SHAPE = Object.freeze({
  characterId: 15,
  leftTwips: -1085,
  rightTwips: 1084,
  topTwips: -224,
  bottomTwips: 224,
  organizeScaleX: 0.8483123779296875,
  organizeScaleY: 1.133926391601562,
} as const);

export type P056SourceButton = (typeof P056_SOURCE_BUTTONS)[number];

/** Sprite-24 local twips and ColorTransform2 alpha, not stage coordinates or hit testing. */
export const P056_SOURCE_BUTTON_REVEAL = Object.freeze([
  Object.freeze({frame: 9, alpha256: 0, organizeYTwips: -3430, informationYTwips: -3420}),
  Object.freeze({frame: 10, alpha256: 32, organizeYTwips: -3480, informationYTwips: -3470}),
  Object.freeze({frame: 11, alpha256: 64, organizeYTwips: -3530, informationYTwips: -3520}),
  Object.freeze({frame: 12, alpha256: 96, organizeYTwips: -3580, informationYTwips: -3570}),
  Object.freeze({frame: 13, alpha256: 128, organizeYTwips: -3630, informationYTwips: -3620}),
  Object.freeze({frame: 14, alpha256: 160, organizeYTwips: -3680, informationYTwips: -3670}),
  Object.freeze({frame: 15, alpha256: 192, organizeYTwips: -3730, informationYTwips: -3720}),
  Object.freeze({frame: 16, alpha256: 224, organizeYTwips: -3780, informationYTwips: -3770}),
  Object.freeze({frame: 17, alpha256: 256, organizeYTwips: -3830, informationYTwips: -3820}),
] as const);

/**
 * Returns a placed button's exact source key, without executing its AVM1.
 * Placement does not prove visual clickability, glossary content, or resume.
 */
export function p056PlacedSourceButtonAction(
  teachingFrame: number,
  characterId: number,
): P056SourceButton | null {
  if (!Number.isInteger(teachingFrame) || teachingFrame < 1 ||
      teachingFrame > P056_SOURCE_BEHAVIOR.teachingFrameCount) {
    throw new RangeError("P056 teaching frame is outside sprite-24");
  }
  if (teachingFrame < P056_SOURCE_BEHAVIOR.firstButtonPlacementFrame) return null;
  return P056_SOURCE_BUTTONS.find((button) => button.characterId === characterId) ?? null;
}

/** Source-static display state; placement and alpha do not establish click reachability. */
export function p056SourceButtonDisplay(teachingFrame: number, characterId: number): Readonly<{
  characterId: 16 | 17;
  alpha256: number;
  localXTwips: number;
  localYTwips: number;
}> | null {
  const button = p056PlacedSourceButtonAction(teachingFrame, characterId);
  if (!button) return null;
  const reveal = P056_SOURCE_BUTTON_REVEAL[
    Math.min(teachingFrame - P056_SOURCE_BEHAVIOR.firstButtonPlacementFrame,
      P056_SOURCE_BUTTON_REVEAL.length - 1)
  ];
  return Object.freeze({
    characterId: button.characterId,
    alpha256: reveal.alpha256,
    localXTwips: characterId === 16 ? -2677 : 129,
    localYTwips: characterId === 16 ? reveal.organizeYTwips : reveal.informationYTwips,
  });
}

/** Exact stage-space hitTest rectangle; placement does not prove runtime click reachability. */
export function p056SourceButtonHitRect(teachingFrame: number, characterId: number): Readonly<{
  characterId: 16 | 17;
  sourceKeyAttribute: "Organize" | "Information";
  alpha256: number;
  left: number;
  top: number;
  width: number;
  height: number;
}> | null {
  const display = p056SourceButtonDisplay(teachingFrame, characterId);
  if (!display) return null;
  const sourceKeyAttribute = P056_SOURCE_BUTTONS.find(button => button.characterId === characterId)!
    .sourceKeyAttribute;
  const bounds = P056_SOURCE_BUTTON_HIT_SHAPE;
  const scaleX = characterId === 16 ? bounds.organizeScaleX : 1;
  const scaleY = characterId === 16 ? bounds.organizeScaleY : 1;
  const rootXTwips = P056_DISPLAY_SOURCE.rootPlacement.transX;
  const rootYTwips = P056_DISPLAY_SOURCE.rootPlacement.transY;
  return Object.freeze({
    characterId: display.characterId,
    sourceKeyAttribute,
    alpha256: display.alpha256,
    left: (rootXTwips + display.localXTwips + bounds.leftTwips * scaleX) / 20,
    top: (rootYTwips + display.localYTwips + bounds.topTwips * scaleY) / 20,
    width: (bounds.rightTwips - bounds.leftTwips) * scaleX / 20,
    height: (bounds.bottomTwips - bounds.topTwips) * scaleY / 20,
  });
}
