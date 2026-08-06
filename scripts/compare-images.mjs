#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const scriptPath = fileURLToPath(import.meta.url);

function usage() {
  return `Usage:
  npm run compare:frames -- <baseline.png> <implementation.png> [options]

Options:
  --diff <path>          Write a visual difference PNG
  --json <path>          Write metrics as JSON
  --max-rmse <0..1>      Exit nonzero when normalized RGB RMSE exceeds the limit
  --pixel-threshold <n>  Pixelmatch color threshold (default: 0.1)`;
}

function parseArguments(argv) {
  const positional = [];
  const options = { pixelThreshold: 0.1 };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") options.help = true;
    else if (["--diff", "--json", "--max-rmse", "--pixel-threshold"].includes(value)) {
      const next = argv[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      const key = value.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      options[key] = next;
      index += 1;
    } else if (value.startsWith("--")) throw new Error(`Unknown option: ${value}`);
    else positional.push(value);
  }
  [options.baseline, options.implementation] = positional;
  options.maxRmse = options.maxRmse === undefined ? undefined : Number(options.maxRmse);
  options.pixelThreshold = Number(options.pixelThreshold);
  return options;
}

export async function comparePngFiles(baselinePath, implementationPath, options = {}) {
  const baseline = PNG.sync.read(await readFile(baselinePath));
  const implementation = PNG.sync.read(await readFile(implementationPath));
  if (baseline.width !== implementation.width || baseline.height !== implementation.height) {
    throw new Error(`Image dimensions differ: ${baseline.width}x${baseline.height} versus ${implementation.width}x${implementation.height}`);
  }

  let squaredError = 0;
  for (let index = 0; index < baseline.data.length; index += 4) {
    for (let channel = 0; channel < 3; channel += 1) {
      const delta = baseline.data[index + channel] - implementation.data[index + channel];
      squaredError += delta * delta;
    }
  }
  const channelCount = baseline.width * baseline.height * 3;
  const normalizedRmse = Math.sqrt(squaredError / channelCount) / 255;
  const diff = new PNG({ width: baseline.width, height: baseline.height });
  const mismatchedPixels = pixelmatch(
    baseline.data,
    implementation.data,
    diff.data,
    baseline.width,
    baseline.height,
    { threshold: Number(options.pixelThreshold ?? 0.1), includeAA: true },
  );
  const result = {
    baseline: path.resolve(baselinePath),
    implementation: path.resolve(implementationPath),
    width: baseline.width,
    height: baseline.height,
    normalizedRmse,
    mismatchedPixels,
    mismatchedPixelRatio: mismatchedPixels / (baseline.width * baseline.height),
  };

  if (options.diff) {
    const diffPath = path.resolve(options.diff);
    await mkdir(path.dirname(diffPath), { recursive: true });
    await writeFile(diffPath, PNG.sync.write(diff));
    result.diff = diffPath;
  }
  if (options.json) {
    const jsonPath = path.resolve(options.json);
    await mkdir(path.dirname(jsonPath), { recursive: true });
    await writeFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

async function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (error) {
    console.error(`${error.message}\n\n${usage()}`);
    process.exitCode = 1;
    return;
  }
  if (options.help) {
    console.log(usage());
    return;
  }
  if (!options.baseline || !options.implementation) {
    console.error(usage());
    process.exitCode = 1;
    return;
  }
  if (options.maxRmse !== undefined && !(options.maxRmse >= 0 && options.maxRmse <= 1)) {
    throw new Error("--max-rmse must be between 0 and 1");
  }

  const result = await comparePngFiles(options.baseline, options.implementation, options);
  console.log(JSON.stringify(result, null, 2));
  if (options.maxRmse !== undefined && result.normalizedRmse > options.maxRmse) {
    console.error(`Normalized RMSE ${result.normalizedRmse.toFixed(6)} exceeds ${options.maxRmse}`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) await main();
