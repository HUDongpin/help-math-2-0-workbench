import { createElement } from "react";
import type {
  AnimationRuntimeMetadata,
  FrameDomainMetadata,
  ResolvedRuntimeContext,
} from "@helpmath/demos";

import {
  Conversion_1_2,
  Conversion_1_4,
  conversion12Manifest,
  demoRegistry,
  getDemoRegistryEntry,
  type DemoManifest,
  type DemoRegistryEntry,
} from "../src/index.js";

const manifest: DemoManifest = conversion12Manifest;
const entry: DemoRegistryEntry = demoRegistry.Conversion_1_2;
const knownEntry = getDemoRegistryEntry("Conversion_1_4");
const unknownEntry = getDemoRegistryEntry("Conversion_9_9");
const frameDomain: FrameDomainMetadata = { id: "sprite-58", frameCount: 142, rootFrame: 6 };
const runtime: AnimationRuntimeMetadata = {
  stage: { width: 800, height: 600 },
  fps: 12,
  frameCount: 10,
  durationMs: (10 * 1000) / 12,
  frameDomains: [frameDomain],
  defaultFrameDomain: frameDomain.id,
};
const runtimeContext: ResolvedRuntimeContext = {
  frame: 1,
  frameDomain: frameDomain.id,
  rootFrame: 6,
  scenario: "default",
  lang: "en",
  seed: 0,
  requirementId: "req-default-sprite-58-en",
  traceId: "default-sprite-58-en",
  entryStateSha256: "a".repeat(64),
  replay: 0,
};

createElement(Conversion_1_2, {
  spanishFormulaFlag: "ON",
  captureFrame: 109,
});
createElement(Conversion_1_4, { spanishFormulaFlag: "off", captureFrame: 67 });

void manifest;
void entry;
void knownEntry;
void unknownEntry;
void runtime;
void runtimeContext;
