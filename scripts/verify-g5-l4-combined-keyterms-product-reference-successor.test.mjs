import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  validateReceiptDocument,
  verifyG5L4CombinedKeytermsProductReferenceSuccessor,
} from './verify-g5-l4-combined-keyterms-product-reference-successor.mjs';

const RECEIPT_URL = new URL(
  '../catalog/owner-authorizations/g5-l4-combined-keyterms-product-reference-successor-2026-07-30.json',
  import.meta.url,
);

async function receiptClone() {
  return JSON.parse(await readFile(RECEIPT_URL, 'utf8'));
}

test('dated authorization remains bounded after later G5 L4 product revisions', async () => {
  const receipt = await receiptClone();
  validateReceiptDocument(receipt);
  assert.equal(receipt.releaseId, 'lesson-g05-l04-number-lines');
  assert.equal(receipt.authorization.referenceUseAuthorized, true);
  assert.deepEqual(receipt.productBindings.selectedMasterSources, {
    en: {
      path: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml',
      bytes: 378783,
      sha256: 'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
      clientTermCount: 761,
    },
    es: {
      path: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml',
      bytes: 374466,
      sha256: '7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00',
      clientTermCount: 753,
    },
  });
  assert.equal(
    receipt.missingLessonSpecificSourceBoundary
      .combinedReferenceSubstitutesForDeclaredLessonSources,
    false,
  );
  assert.ok(
    Object.entries(receipt.authorityBoundary)
      .filter(([key]) => ![
        'contentManagerReferenceDirectionOwnerRelayed',
        'strictAcceptanceEffect',
      ].includes(key))
      .every(([, value]) => value === false),
  );
  await assert.rejects(
    verifyG5L4CombinedKeytermsProductReferenceSuccessor(),
    (error) => {
      assert.match(error.message, /^bound project files identities changed:/);
      const descriptor =
        'apps/web/lib/g5-l4-whole-lesson-player-descriptor.ts identity changed';
      const browser =
        'apps/web/components/legacy-key-terms-browser.tsx identity changed';
      assert.match(error.message, new RegExp(descriptor.replaceAll('.', '\\.')));
      assert.match(error.message, new RegExp(browser.replaceAll('.', '\\.')));
      assert.ok(error.message.indexOf(descriptor) < error.message.indexOf(browser));
      return true;
    },
  );
});

test('successor receipt rejects a changed owner-relayed message', async () => {
  const receipt = await receiptClone();
  receipt.relay.contentManagerMessage.exactUtf8 += '.';
  assert.throws(
    () => validateReceiptDocument(receipt),
    /owner-relayed Venky message binding drifted/,
  );
});

test('successor receipt rejects promotion of the 2015 intake variant', async () => {
  const receipt = await receiptClone();
  receipt.authorization.ownerIntake2015VariantSelectedForClient = true;
  assert.throws(
    () => validateReceiptDocument(receipt),
    /combined glossary authorization boundary drifted/,
  );
});

test('successor receipt rejects missing-XML substitution or strict promotion', async () => {
  const substitution = await receiptClone();
  substitution.missingLessonSpecificSourceBoundary
    .combinedReferenceSubstitutesForDeclaredLessonSources = true;
  assert.throws(
    () => validateReceiptDocument(substitution),
    /missing lesson-specific XML boundary drifted/,
  );

  const promoted = await receiptClone();
  promoted.authorityBoundary.strictCompletionEstablished = true;
  assert.throws(
    () => validateReceiptDocument(promoted),
    /strict evidence authority boundary drifted/,
  );
});
