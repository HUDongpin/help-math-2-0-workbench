export interface P064SourceSvg {
  readonly source: string;
  readonly width: number;
  readonly height: number;
  readonly sha256: string;
}
export interface P064PresentationOption {
  readonly letter: string;
  readonly value: string | null;
  readonly sourceInstance: string;
  readonly sourceSpriteId: number;
  readonly pictureAlt?: string;
  readonly picture?: P064SourceSvg;
  readonly correct: boolean;
}
export type P064Illustration =
  | (P064SourceSvg & Readonly<{kind: 'source-illustration'; sourceShapeId: number; alt: string}>)
  | Readonly<{kind: 'number-line'; sourceShapeId: number; minimum: number; maximum: number;
      point: number; intervals: number; pointLabel: string}>;
export interface P064PresentationQuestion {
  readonly id: number;
  readonly questionFrame: number;
  readonly reviewFrame: number;
  readonly prompt: string;
  readonly sourcePromptTextId: number;
  readonly options: readonly P064PresentationOption[];
  readonly correctLetter: string;
  readonly illustration: P064Illustration | null;
}
export interface P064PresentationData {
  readonly schemaVersion: 1;
  readonly animationId: 'shared-nms002-l02-p064';
  readonly sourceSwfSha256: string;
  readonly sourceQuestionIrSha256: string;
  readonly sourceActiveDisplaySha256: string;
  readonly semanticStatus: 'static-visual-candidate-not-original-runtime-or-human-reviewed';
  readonly sessionQuestionCount: 10;
  readonly questions: readonly P064PresentationQuestion[];
}
