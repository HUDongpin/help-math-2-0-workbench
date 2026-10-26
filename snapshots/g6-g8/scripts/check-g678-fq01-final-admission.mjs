#!/usr/bin/env node

import {execFile} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const execFileAsync = promisify(execFile);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export async function checkFq01FinalAdmission({root = ROOT} = {}) {
  invariant(typeof process.env.HELP_MATH_G678_SOURCE_ROOT === 'string' &&
    process.env.HELP_MATH_G678_SOURCE_ROOT.length > 0,
  'HELP_MATH_G678_SOURCE_ROOT is required for the FQ01 final admission gate');
  const commands = [
    ['scripts/audit-g678-final-quiz-intro-family.mjs', '--check'],
    ['scripts/build-g678-fq01-current-js.mjs', '--phase=calibration', '--check'],
    ['scripts/finalize-g678-fq01-registration.mjs', '--phase=calibration', '--check'],
    ['scripts/check-g678-fq01-browser-calibration-receipt.mjs'],
    ['scripts/build-g678-fq01-family-calibration.mjs', '--check'],
    ['scripts/build-g678-fq01-current-js.mjs', '--phase=scaleout', '--check'],
    ['scripts/finalize-g678-fq01-registration.mjs', '--phase=final', '--check'],
  ];
  const receipts = [];
  for (const args of commands) {
    const result = await execFileAsync(process.execPath, args, {
      cwd: path.resolve(root), env: process.env, maxBuffer: 16 * 1024 * 1024,
    });
    invariant(result.stderr === '',
      `FQ01 admission command emitted stderr: ${args.join(' ')}`);
    const value = JSON.parse(result.stdout);
    invariant(value.check === true,
      `FQ01 admission command did not return check=true: ${args.join(' ')}`);
    receipts.push(Object.freeze({command: args.join(' '), result: value}));
  }
  return Object.freeze({check: true,
    admissionId: 'g678-fq01-final-216-admission-v1',
    commandCount: receipts.length,
    calibrationGeneratedPages: 1,
    scaleoutGeneratedPages: 43,
    finalRegisteredPages: 216,
    wholeLessonEngineeringPreviews: 0,
    receipts: Object.freeze(receipts)});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  checkFq01FinalAdmission()
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
