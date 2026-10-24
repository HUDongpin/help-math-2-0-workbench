"use client";

import {createPrivateSourceStaticRepeatedVocabularyGlossaryCandidate} from "../private-source-static-repeated-vocabulary-glossary-candidate";
import {SHARED_ALG001_L10_P008_CONFIG, SHARED_ALG001_L10_P008_SOURCE} from "../timelines/shared-alg001-l10-p008";

export const SHARED_ALG001_L10_P008_GLOSSARY_TERMS = Object.freeze([
  {
    "id": "raised",
    "sourceKeyAttribute": "Raised",
    "sourceCharacterId": 15,
    "firstFrame": 160,
    "labels": {
      "en": "Raised",
      "es": "Elevado"
    }
  },
  {
    "id": "power",
    "sourceKeyAttribute": "Power",
    "sourceCharacterId": 16,
    "firstFrame": 160,
    "labels": {
      "en": "Power",
      "es": "Potencia"
    }
  },
  {
    "id": "cubed-cubed-number",
    "sourceKeyAttribute": "Cubed / Cubed Number",
    "sourceCharacterId": 17,
    "firstFrame": 160,
    "labels": {
      "en": "Cubed / Cubed Number",
      "es": "Elevar al cubo / cúbico"
    }
  },
  {
    "id": "product",
    "sourceKeyAttribute": "Product",
    "sourceCharacterId": 22,
    "firstFrame": 230,
    "labels": {
      "en": "Product",
      "es": "Producto"
    }
  },
  {
    "id": "base",
    "sourceKeyAttribute": "Base",
    "sourceCharacterId": 23,
    "firstFrame": 230,
    "labels": {
      "en": "Base",
      "es": "Base"
    }
  }
] as const);

const candidate = createPrivateSourceStaticRepeatedVocabularyGlossaryCandidate(SHARED_ALG001_L10_P008_CONFIG, Object.freeze({
  calibrationId: "g678-vb03-l1-product-calibration-v1",
  companionSurfaceId: "shared-alg001-l10-p008-glossary",
  glossaryTerms: SHARED_ALG001_L10_P008_GLOSSARY_TERMS,
}));
const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});

export {SHARED_ALG001_L10_P008_SOURCE};
export const SHARED_ALG001_L10_P008_MOVIE = candidate.movie;
export const SHARED_ALG001_L10_P008_RUNTIME = candidate.runtime;
export const SHARED_ALG001_L10_P008_SOURCE_CONTRACT = candidate.sourceContract;
export const SHARED_ALG001_L10_P008_SCENARIOS = candidate.scenarios;
export const SHARED_ALG001_L10_P008_RENDERER = candidate.Renderer;
export default animationModule;
