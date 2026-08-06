import { Conversion_1_2, Conversion_1_4 } from "./components.js";
import { isProductionReadyManifest } from "./contracts.js";
import {
  conversion12Manifest,
  conversion14Manifest,
} from "./manifests.js";

const conversion12Integration = Object.freeze({
  deterministicFrameCapture: true,
  spanishFormula: true,
  requiredPublicAssets: Object.freeze([
    "/flash-assets/conversion-1-2/gallon-0.png",
    "/flash-assets/conversion-1-2/gallon-32.png",
    "/flash-assets/conversion-1-2/gallon-64.png",
    "/flash-assets/conversion-1-2/gallon-96.png",
    "/flash-assets/conversion-1-2/gallon-128.png",
    "/flash-assets/conversion-1-2/quart-empty-stage.png",
    "/flash-assets/conversion-1-2/quart-full-stage.png",
    "/flash-assets/conversion-1-2/quart-pouring-empty.png",
    "/flash-assets/conversion-1-2/quart-pouring-full.png",
  ]),
});

const conversion14Integration = Object.freeze({
  deterministicFrameCapture: true,
  spanishFormula: true,
  requiredPublicAssets: Object.freeze([
    "/flash-assets/cylinder-base.png",
    "/flash-assets/pitcher-back.png",
    "/flash-assets/pitcher-front.png",
  ]),
});

export const demoRegistry = Object.freeze({
  Conversion_1_2: Object.freeze({
    manifest: conversion12Manifest,
    Component: Conversion_1_2,
    integration: conversion12Integration,
  }),
  Conversion_1_4: Object.freeze({
    manifest: conversion14Manifest,
    Component: Conversion_1_4,
    integration: conversion14Integration,
  }),
});

export function getDemoRegistryEntry(id) {
  return Object.prototype.hasOwnProperty.call(demoRegistry, id)
    ? demoRegistry[id]
    : null;
}

export function listDemoRegistryEntries({ productionOnly = false } = {}) {
  const entries = Object.values(demoRegistry);
  return Object.freeze(
    productionOnly
      ? entries.filter(({ manifest }) => isProductionReadyManifest(manifest))
      : entries,
  );
}
