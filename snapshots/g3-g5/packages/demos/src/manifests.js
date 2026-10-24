import { parseDemoManifest } from "./contracts.js";

export const conversion12Manifest = parseDemoManifest({
  id: "Conversion_1_2",
  title: {
    en: "Gallons and Fluid Ounces",
    es: "Galones y onzas líquidas",
  },
  summary: {
    en: "Four quart containers fill one gallon while the total increases from 32 to 128 fluid ounces.",
    es: "Cuatro recipientes de un cuarto llenan un galón mientras el total aumenta de 32 a 128 onzas líquidas.",
  },
  stage: { width: 780, height: 379 },
  fps: 12,
  frameCount: 109,
  durationMs: 9083,
  sourceHashes: [
    "7c59923ebd200f4fb951e1c9a7683861c21af7688d537fa5fca370acf6d9291d",
    "91d63f9f045d2097cd0f46c59ceacd4faefd95851f9039003589d8052c39e758",
  ],
  validationStatus: "conditional",
});

export const conversion14Manifest = parseDemoManifest({
  id: "Conversion_1_4",
  title: {
    en: "Liters and Milliliters",
    es: "Litros y mililitros",
  },
  summary: {
    en: "A pitcher fills a graduated cylinder to show that one liter equals 1,000 milliliters.",
    es: "Una jarra llena una probeta graduada para mostrar que un litro equivale a 1.000 mililitros.",
  },
  stage: { width: 780, height: 379 },
  fps: 12,
  frameCount: 67,
  durationMs: 5583,
  sourceHashes: [
    "d661c776e239fb59c44278c6e4d5fd75812599eb2dc9fa758b1ba37a59251b1c",
    "cbb7f3f529c8c5ca679da864c7c49ab472cac4d0feb2392eed5aa04d21a4e1a9",
  ],
  validationStatus: "conditional",
});

export const demoManifests = Object.freeze([
  conversion12Manifest,
  conversion14Manifest,
]);
