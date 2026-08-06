import type { ComponentType } from "react";

import type {
  Conversion12DemoProps,
  Conversion14DemoProps,
  DemoBaseProps,
} from "./components.js";
import type { DemoManifest } from "./contracts.js";
import type {
  conversion12Manifest,
  conversion14Manifest,
} from "./manifests.js";

export interface DemoIntegrationRequirements {
  readonly deterministicFrameCapture: boolean;
  readonly spanishFormula: boolean;
  readonly requiredPublicAssets: readonly string[];
}

export interface DemoRegistryEntry<Props extends DemoBaseProps = DemoBaseProps> {
  readonly manifest: DemoManifest;
  readonly Component: ComponentType<Props>;
  readonly integration: DemoIntegrationRequirements;
}

export declare const demoRegistry: Readonly<{
  Conversion_1_2: DemoRegistryEntry<Conversion12DemoProps> & {
    readonly manifest: typeof conversion12Manifest;
  };
  Conversion_1_4: DemoRegistryEntry<Conversion14DemoProps> & {
    readonly manifest: typeof conversion14Manifest;
  };
}>;

export declare function getDemoRegistryEntry(
  id: "Conversion_1_2",
): (typeof demoRegistry)["Conversion_1_2"];
export declare function getDemoRegistryEntry(
  id: "Conversion_1_4",
): (typeof demoRegistry)["Conversion_1_4"];
export declare function getDemoRegistryEntry(
  id: string,
): (typeof demoRegistry)[keyof typeof demoRegistry] | null;

export declare function listDemoRegistryEntries(options?: {
  readonly productionOnly?: boolean;
}): readonly (typeof demoRegistry)[keyof typeof demoRegistry][];
