'use client';

import {createPrivateSourceStaticRepeatedVocabularyGlossaryCandidate} from '../private-source-static-repeated-vocabulary-glossary-candidate';
import {SHARED_ALG001_L12_P011_CONFIG} from '../timelines/shared-alg001-l12-p011';

export const SHARED_ALG001_L12_P011_GLOSSARY_TERMS = Object.freeze([
  {id: 'origin', sourceKeyAttribute: 'Origin', sourceCharacterId: 20, firstFrame: 8,
    labels: {en: 'Origin', es: 'Origen'}},
  {id: 'point', sourceKeyAttribute: 'Point', sourceCharacterId: 21, firstFrame: 8,
    labels: {en: 'Point', es: 'Punto'}},
  {id: 'coordinate-plane-cartesian-plane', sourceKeyAttribute: 'Coordinate plane/Cartesian Plane', sourceCharacterId: 22, firstFrame: 8,
    labels: {en: 'Coordinate plane', es: 'Plano de coordenadas'}},
  {id: 'x-axis', sourceKeyAttribute: 'X-axis', sourceCharacterId: 27, firstFrame: 78,
    labels: {en: 'X-axis', es: 'Eje x'}},
  {id: 'y-axis', sourceKeyAttribute: 'Y-axis', sourceCharacterId: 28, firstFrame: 78,
    labels: {en: 'Y-axis', es: 'Eje y'}},
  {id: 'intersect', sourceKeyAttribute: 'Intersect', sourceCharacterId: 29, firstFrame: 78,
    labels: {en: 'Intersect', es: 'Intersecar'}},
] as const);

const candidate = createPrivateSourceStaticRepeatedVocabularyGlossaryCandidate(
  SHARED_ALG001_L12_P011_CONFIG, {
    calibrationId: 'g678-vb06-l1-product-calibration-v1',
    companionSurfaceId: 'shared-alg001-l12-p011-glossary',
    glossaryTerms: SHARED_ALG001_L12_P011_GLOSSARY_TERMS,
  });

// This module is deliberately absent from the official registry pending host QA.
export const SHARED_ALG001_L12_P011_CANDIDATE = candidate;
export default candidate.module;
