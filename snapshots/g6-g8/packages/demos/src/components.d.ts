import type { ComponentType } from "react";

export type LegacyFormulaLanguageFlag = "on" | "off" | "ON" | "OFF";

export interface DemoBaseProps {
  readonly spanishFormulaFlag?: LegacyFormulaLanguageFlag;
}

export interface Conversion12DemoProps extends DemoBaseProps {
  /** Freezes the one-indexed Flash frame for deterministic evidence capture. */
  readonly captureFrame?: number;
}

export interface Conversion14DemoProps extends DemoBaseProps {
  /** Freezes the one-indexed Flash frame for deterministic evidence capture. */
  readonly captureFrame?: number;
}

export declare const GallonConversionAnimation: ComponentType<Conversion12DemoProps>;
export declare const Conversion12Demo: typeof GallonConversionAnimation;
export declare const Conversion_1_2: typeof GallonConversionAnimation;

export declare const LiterConversionAnimation: ComponentType<Conversion14DemoProps>;
export declare const Conversion14Demo: typeof LiterConversionAnimation;
export declare const Conversion_1_4: typeof LiterConversionAnimation;
