export type DemoValidationStatus = "draft" | "conditional" | "approved";

export interface LocalizedDemoText {
  readonly en: string;
  readonly es: string;
}

export interface DemoStage {
  readonly width: number;
  readonly height: number;
}

export interface DemoManifest {
  readonly id: string;
  readonly title: LocalizedDemoText;
  readonly summary: LocalizedDemoText;
  readonly stage: DemoStage;
  readonly fps: number;
  readonly frameCount: number;
  readonly durationMs: number;
  readonly sourceHashes: readonly string[];
  readonly validationStatus: DemoValidationStatus;
}

export interface DemoManifestValidationResult {
  readonly success: boolean;
  readonly issues: readonly string[];
}

export declare const DEMO_VALIDATION_STATUSES: readonly DemoValidationStatus[];

export declare class DemoManifestValidationError extends TypeError {
  readonly issues: readonly string[];
  constructor(issues: readonly string[]);
}

export declare function validateDemoManifest(
  value: unknown,
): DemoManifestValidationResult;
export declare function parseDemoManifest(value: unknown): DemoManifest;
export declare function isDemoManifest(value: unknown): value is DemoManifest;
export declare function isProductionReadyManifest(
  value: unknown,
): value is DemoManifest & { readonly validationStatus: "approved" };
export declare function assertProductionReadyManifest(
  value: unknown,
): DemoManifest & { readonly validationStatus: "approved" };
export declare function hasManifestField(
  value: unknown,
  field: PropertyKey,
): boolean;
