import { createElement } from "react";

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

createElement(Conversion_1_2, {
  spanishFormulaFlag: "ON",
  captureFrame: 109,
});
createElement(Conversion_1_4, { spanishFormulaFlag: "off", captureFrame: 67 });

void manifest;
void entry;
void knownEntry;
void unknownEntry;
