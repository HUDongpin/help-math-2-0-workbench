import type { DemoManifest } from "./contracts.js";

export declare const conversion12Manifest: DemoManifest & {
  readonly id: "Conversion_1_2";
  readonly validationStatus: "conditional";
};

export declare const conversion14Manifest: DemoManifest & {
  readonly id: "Conversion_1_4";
  readonly validationStatus: "conditional";
};

export declare const demoManifests: readonly [
  typeof conversion12Manifest,
  typeof conversion14Manifest,
];
