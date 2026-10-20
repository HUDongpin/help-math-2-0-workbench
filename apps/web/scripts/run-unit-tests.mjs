#!/usr/bin/env node

import {spawnSync} from 'node:child_process';
import {readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const webRoot = path.resolve(path.dirname(scriptPath), '..');
const testsRoot = path.join(webRoot, 'tests');
const serverDescriptorPattern =
  /(?:^|\/)g[345]-l\d+-page-only-course-descriptor\.test\.ts$/u;

async function testFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await testFiles(candidate));
    else if (entry.isFile() && /\.test\.tsx?$/u.test(entry.name)) {
      files.push(path.relative(webRoot, candidate).split(path.sep).join('/'));
    }
  }
  return files.sort();
}

function run(files, {reactServer = false} = {}) {
  if (!files.length) return;
  const arguments_ = [
    ...(reactServer ? ['--conditions=react-server'] : []),
    '--import',
    'tsx',
    '--test',
    ...files,
  ];
  const result = spawnSync(process.execPath, arguments_, {
    cwd: webRoot,
    env: process.env,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const files = await testFiles(testsRoot);
const serverDescriptors = files.filter((file) =>
  serverDescriptorPattern.test(file));
const privateServerTests = files.filter((file) =>
  /(?:^|\/)g4-l12-(?:private-audio-calibration-(?:access|asset-route)|vb035-private-pcm|vb036-private-(?:behavior|pcm))\.test\.ts$/u.test(file));
const novaFrameNormalizationTests = files.filter((file) =>
  /(?:^|\/)nova-frame-normalization\.test\.ts$/u.test(file));
const serverTests = [
  ...serverDescriptors,
  ...privateServerTests,
  ...novaFrameNormalizationTests,
];
const defaultTests = files.filter((file) => !serverTests.includes(file));
if (serverDescriptors.length !== 21) {
  throw new Error(
    `Expected 21 page-only Server Component descriptor tests, found ${serverDescriptors.length}`,
  );
}
run(defaultTests);
run(serverTests, {reactServer: true});
