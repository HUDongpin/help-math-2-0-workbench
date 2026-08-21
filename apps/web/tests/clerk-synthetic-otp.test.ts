import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {
  clerkSyntheticOtpKeystrokes,
  isClerkSyntheticVerificationAttempt,
  sendClerkSyntheticSensitiveCdp,
} from '../lib/clerk-synthetic-otp';

const repositoryRoot = path.resolve(import.meta.dirname, '../../..');

test('split OTP input uses six ordered Chromium key-down/key-up pairs', () => {
  const keystrokes = clerkSyntheticOtpKeystrokes('012345');
  assert.equal(keystrokes.length, 6);
  assert.equal(Object.isFrozen(keystrokes), true);

  for (const [index, keystroke] of keystrokes.entries()) {
    const digit = String(index);
    assert.equal(Object.isFrozen(keystroke), true);
    assert.equal(Object.isFrozen(keystroke.keyDown), true);
    assert.equal(Object.isFrozen(keystroke.keyUp), true);
    assert.equal(keystroke.keyDown.type, 'keyDown');
    assert.equal(keystroke.keyUp.type, 'keyUp');
    assert.equal(keystroke.keyDown.key, digit);
    assert.equal(keystroke.keyUp.key, digit);
    assert.equal(keystroke.keyDown.code, `Digit${digit}`);
    assert.equal(keystroke.keyUp.code, `Digit${digit}`);
    assert.equal(keystroke.keyDown.text, digit);
    assert.equal(keystroke.keyDown.unmodifiedText, digit);
    assert.equal(keystroke.keyUp.text, undefined);
    assert.equal(keystroke.keyUp.unmodifiedText, undefined);
    assert.equal(keystroke.keyDown.windowsVirtualKeyCode, 48 + index);
    assert.equal(keystroke.keyUp.windowsVirtualKeyCode, 48 + index);
  }
});

test('OTP key-event construction fails closed without an exact six-digit code', () => {
  for (const candidate of ['', '12345', '1234567', '12345a', '１２３４５６']) {
    assert.throws(
      () => clerkSyntheticOtpKeystrokes(candidate),
      /failed closed/u,
    );
  }
});

test('verification transition matcher accepts only Clerk attempt POST paths', () => {
  for (const suffix of [
    'attempt_verification',
    'attempt_first_factor',
    'attempt_second_factor',
  ]) {
    assert.equal(isClerkSyntheticVerificationAttempt(
      'POST',
      `https://synthetic-app.clerk.accounts.dev/v1/client/object/${suffix}`,
      'synthetic-app.clerk.accounts.dev',
    ), true);
  }
  for (const [method, url, frontendApi] of [
    ['GET', 'https://synthetic-app.clerk.accounts.dev/v1/client/object/attempt_verification', 'synthetic-app.clerk.accounts.dev'],
    ['POST', 'https://synthetic-app.clerk.accounts.dev/v1/client/object/prepare_verification', 'synthetic-app.clerk.accounts.dev'],
    ['POST', 'https://synthetic-app.clerk.accounts.dev/v1/client/object/attempt_verification/extra', 'synthetic-app.clerk.accounts.dev'],
    ['POST', 'https://different-app.clerk.accounts.dev/v1/client/object/attempt_verification', 'synthetic-app.clerk.accounts.dev'],
    ['POST', 'http://synthetic-app.clerk.accounts.dev/v1/client/object/attempt_verification', 'synthetic-app.clerk.accounts.dev'],
    ['POST', 'not a URL', 'synthetic-app.clerk.accounts.dev'],
    ['POST', 'https://synthetic-app.clerk.accounts.dev/v1/client/object/attempt_verification', 'not a frontend API'],
  ]) assert.equal(isClerkSyntheticVerificationAttempt(
    method!,
    url!,
    frontendApi!,
  ), false);
});

test('sensitive CDP commands run only inside the internal Playwright API zone', async () => {
  const calls: string[] = [];
  let internal = false;
  await sendClerkSyntheticSensitiveCdp({
    _wrapApiCall: async (operation: () => Promise<unknown>, options: unknown) => {
      assert.deepEqual(options, {internal: true});
      calls.push('internal-start');
      internal = true;
      try {
        return await operation();
      } finally {
        internal = false;
        calls.push('internal-end');
      }
    },
    send: async () => {
      assert.equal(internal, true);
      calls.push('send');
    },
  }, 'Input.insertText', {text: 'synthetic'});
  assert.deepEqual(calls, ['internal-start', 'send', 'internal-end']);

  await assert.rejects(
    sendClerkSyntheticSensitiveCdp(
      {send: async () => undefined},
      'Input.insertText',
      {text: 'synthetic'},
    ),
    /failed closed/u,
  );
});

test('pinned Playwright internal zones suppress channel instrumentation', async () => {
  const source = await readFile(
    path.join(repositoryRoot, 'node_modules/playwright-core/lib/coreBundle.js'),
    'utf8',
  );
  assert.match(
    source,
    /if \(!apiZone\.internal && !apiZone\.reported\)[\s\S]{0,400}onApiCallBegin/u,
  );
  assert.match(
    source,
    /sendMessageToServer\(this, prop, validatedParams, \{ internal: true \}\)/u,
  );
});
