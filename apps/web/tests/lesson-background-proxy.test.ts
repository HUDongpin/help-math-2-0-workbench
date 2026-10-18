import assert from 'node:assert/strict';
import test from 'node:test';

import {NextRequest} from 'next/server';

import {proxyForRequest} from '../proxy';

const hashed = 'https://www.helpmath.ai/lesson-backgrounds/lesson-shell-mc-back-text.102f0ddeec5ede88.svg';
const key = 'CURRENT_JS_SHOWCASE_G4_L3_ENABLED';

const env = process.env as Record<string, string | undefined>;

async function status(url: string, enabled: boolean) {
  const previous = {flag: env[key], nodeEnv: env.NODE_ENV};
  // Production semantics: development allows every /flash-assets path for local audits.
  env.NODE_ENV = 'production';
  if (enabled) env[key] = 'true';
  else delete env[key];
  try {
    return (await proxyForRequest(new NextRequest(url))).status;
  } finally {
    if (previous.flag === undefined) delete env[key];
    else env[key] = previous.flag;
    env.NODE_ENV = previous.nodeEnv;
  }
}

test('hashed lesson background follows the G4 L3 publication gate of its original path', async () => {
  assert.equal(await status(hashed, true), 200);
  assert.equal(await status(hashed, false), 404);
});

test('unknown hashed lesson background names are not served', async () => {
  assert.equal(await status('https://www.helpmath.ai/lesson-backgrounds/lesson-shell-mc-back-text.0000000000000000.svg', true), 404);
  assert.equal(await status('https://www.helpmath.ai/lesson-backgrounds/other.svg', true), 404);
});
