import assert from "node:assert/strict";
import test from "node:test";

import {buildFormulaAudioEntries} from "./sync-formula-audio-assets.mjs";

function association(language, hash) {
  return {
    sourceFile: `source/${language}.mp3`,
    observedSha256: hash,
    hashMatchesCatalog: true,
    associationStatus: "exact-basename-association",
    languageAssessment: {language},
    probe: {durationMs: language === "en" ? 1000 : 2000},
    startFrame: null,
    startFrameAuthority: "Verified legacy host script selects and starts this external track from language/user state; it is not a child root-timeline cue.",
    startSemantics: "host-user-activated",
  };
}

test("buildFormulaAudioEntries preserves exact bilingual host-triggered evidence", () => {
  const pilot = {animationId: "formula-sample", assetName: "sample"};
  const entries = buildFormulaAudioEntries(pilot, {
    animationId: "formula-sample",
    externalAudio: {exactAssociations: [association("en", "a".repeat(64)), association("es", "b".repeat(64))]},
  });
  assert.deepEqual(entries.map(({language, activation, publicUrl, durationMs}) => ({language, activation, publicUrl, durationMs})), [
    {language: "en", activation: "user", publicUrl: "/flash-assets/audio/formulas/sample/en.mp3", durationMs: 1000},
    {language: "es", activation: "user", publicUrl: "/flash-assets/audio/formulas/sample/es.mp3", durationMs: 2000},
  ]);
});

test("buildFormulaAudioEntries rejects guessed or timeline-triggered associations", () => {
  const pilot = {animationId: "formula-sample", assetName: "sample"};
  const english = association("en", "a".repeat(64));
  english.startFrame = 1;
  assert.throws(() => buildFormulaAudioEntries(pilot, {
    animationId: "formula-sample",
    externalAudio: {exactAssociations: [english, association("es", "b".repeat(64))]},
  }), /does not prove user-triggered/);
});

test("buildFormulaAudioEntries rejects missing or incorrect structured host activation semantics", () => {
  const pilot = {animationId: "formula-sample", assetName: "sample"};
  for (const startSemantics of [undefined, "interaction-state", "timeline-frame"]) {
    const english = association("en", "a".repeat(64));
    if (startSemantics === undefined) delete english.startSemantics;
    else english.startSemantics = startSemantics;
    assert.throws(() => buildFormulaAudioEntries(pilot, {
      animationId: "formula-sample",
      externalAudio: {exactAssociations: [english, association("es", "b".repeat(64))]},
    }), /does not prove user-triggered/);
  }
});
