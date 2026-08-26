import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  RE001_ANIMATION_ID,
  RE001_OUTPUT,
  RE001_RENDERER_AUDIT,
  RE001_SOURCE_SWF_SHA256,
  RE001_STALE_BROWSER_QA_ARCHIVE,
  RE001_STALE_BROWSER_QA_RECEIPT,
  buildRe001PriorBrowserQaStaleReceipt,
  buildRe001RendererAuditReport,
  buildRe001RootBilingualVisualDisposition,
  extractRe001FfdecScriptBlocks,
  parseArguments,
  serializeRe001RendererAudit,
  serializeRe001PriorBrowserQaStaleReceipt,
  serializeRe001RootBilingualVisualDisposition
} from './build-re001-root-bilingual-visual-disposition.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('extracts the complete FFDec script set without inventing missing code', () => {
  const blocks = extractRe001FfdecScriptBlocks(
    '===== A.as =====\nstop();\n\n===== B.as =====\nplay();\n'
  );
  assert.deepEqual([...blocks], [
    ['A.as', 'stop();'],
    ['B.as', 'play();']
  ]);
  assert.throws(
    () => extractRe001FfdecScriptBlocks('===== A.as =====\nstop();\n===== A.as =====\nplay();'),
    /repeats A\.as/
  );
});

test('rebuilds the scoped generic renderer audit with only root en/es ready', async () => {
  const report = await buildRe001RendererAuditReport();
  assert.equal(report.animationId, RE001_ANIMATION_ID);
  assert.equal(report.status, 'renderer-frame-domain-support-incomplete');
  assert.equal(report.summary.probeCount, 16);
  assert.equal(report.summary.exactIdentityCount, 16);
  assert.equal(report.summary.renderableCount, 4);
  assert.equal(report.summary.blockedCount, 12);
  assert.deepEqual(
    report.domainSupport.map(
      ({blockedCount, frameDomain, fullyRenderable, renderableCount}) => ({
        blockedCount,
        frameDomain,
        fullyRenderable,
        renderableCount
      })
    ),
    [
      {
        blockedCount: 0,
        frameDomain: 'root',
        fullyRenderable: true,
        renderableCount: 4
      },
      {
        blockedCount: 12,
        frameDomain: 'sprite-621',
        fullyRenderable: false,
        renderableCount: 0
      }
    ]
  );
});

test('builds a deterministic root source-shared untranslated disposition with all acceptance effects false', async () => {
  const report = await buildRe001RootBilingualVisualDisposition();
  assert.equal(report.animationId, RE001_ANIMATION_ID);
  assert.equal(report.generatedFrom.sourceSwf.sha256, RE001_SOURCE_SWF_SHA256);
  assert.equal(report.status, 'verified-root-source-shared-untranslated-visual');
  assert.equal(
    report.implementationDisposition.root.visualClassification,
    'source-shared-untranslated-visual'
  );
  assert.deepEqual(report.implementationDisposition.root.languages, ['en', 'es']);
  assert.equal(report.implementationDisposition.root.status, 'ready');
  assert.equal(report.implementationDisposition.root.spanishTranslationSupplied, false);
  assert.equal(report.implementationDisposition.nested.endpointCount, 6);
  assert.equal(report.implementationDisposition.nested.status, 'blocked');
  assert.equal(report.implementationDisposition.audioRendered, false);
  assert.equal(report.implementationDisposition.currentJavascriptImplementationCapture, false);
  assert.equal(report.implementationDisposition.coverageAdopted, false);
  assert.equal(report.implementationDisposition.replacementBrowserQaGenerated, false);
  assert.deepEqual(report.sourceFindings.languageSensitiveActionScriptMatches, []);
  assert.equal(report.sourceFindings.sourceScripts.length, 6);
  assert.equal(report.sourceFindings.standaloneRootFrames.frameCount, 55);
  assert.equal(report.sourceFindings.standaloneRootFrames.distinctPngSha256Count, 1);
  assert.equal(
    Object.values(report.acceptanceEffects).every((value) => value === false),
    true
  );
});

test('formally archives the exact prior browser QA report as stale without promoting it', async () => {
  const report = await buildRe001PriorBrowserQaStaleReceipt();
  assert.equal(report.animationId, RE001_ANIMATION_ID);
  assert.equal(report.status, 'verified-historical-stale');
  assert.equal(
    report.staleArtifact.sha256,
    '41e66586f4b0b20cfb8f97f5a01fabe8f52f0823e6b2ac0931ce377c34f6c025'
  );
  assert.equal(report.staleArtifact.path, RE001_STALE_BROWSER_QA_ARCHIVE);
  assert.equal(report.staleArtifact.disposition, 'retained-unmodified-historical-stale');
  assert.equal(report.staleChecks.replacementBrowserQaGenerated, false);
  assert.equal(report.staleChecks.implementationCaptureRun, false);
  assert.equal(report.staleChecks.coverageAdopted, false);
  assert.equal(
    Object.values(report.acceptanceEffects).every((value) => value === false),
    true
  );
});

test('checked-in RE001 renderer audit, stale receipt, and bilingual disposition are byte-for-byte reproducible', async () => {
  const currentRendererAudit = await readFile(
    path.join(projectRoot, RE001_RENDERER_AUDIT),
    'utf8'
  );
  assert.equal(
    currentRendererAudit,
    serializeRe001RendererAudit(await buildRe001RendererAuditReport())
  );

  const currentStaleReceipt = await readFile(
    path.join(projectRoot, RE001_STALE_BROWSER_QA_RECEIPT),
    'utf8'
  );
  assert.equal(
    currentStaleReceipt,
    serializeRe001PriorBrowserQaStaleReceipt(
      await buildRe001PriorBrowserQaStaleReceipt()
    )
  );

  const currentDisposition = await readFile(path.join(projectRoot, RE001_OUTPUT), 'utf8');
  assert.equal(
    currentDisposition,
    serializeRe001RootBilingualVisualDisposition(
      await buildRe001RootBilingualVisualDisposition()
    )
  );
});

test('CLI accepts only the non-mutating check flag', () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(['--check']), {check: true});
  assert.throws(() => parseArguments(['--write-anywhere']), /Unknown option/);
});
