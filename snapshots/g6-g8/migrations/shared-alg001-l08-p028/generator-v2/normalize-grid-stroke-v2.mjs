import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const policyPath = 'migrations/shared-alg001-l08-p028/native-v2/grid-display-policy-v2.json';
const strokePattern = /var pathData="([^"]+)";\s*var scaleMode = "([^"]+)";\s*ctx.strokeStyle=([^;]+);\s*ctx.lineWidth=([^;]+);/g;

/** One explicit Current-JS display choice. Source geometry and declared widths remain evidence. */
export function normalizeP028GridDisplay(runtime) {
  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
  assert.equal(policy.animationId, 'shared-alg001-l08-p028');
  assert.equal(policy.sourceSwfSha256, 'f5fa02bb84e2e967c6984fd7e9ea546bcd3b91a63e00c100c381b7a831d2d2d2');
  assert.equal(policy.sourceShapeId, 2);
  assert.equal(policy.gridStrokeOrdinalInShape, 0);
  assert.equal(policy.sourceCanvasGridStrokePixels, 0.05);
  assert.equal(policy.currentJsGridDisplayStrokePixels, 1);
  assert.equal(policy.sourceDeclaredGridStrokeTwips, 1);
  for (const p of [policy.sourceXml, policy.sourceSvg]) {
    const b = fs.readFileSync(p.path);
    assert.equal(b.length, p.bytes); assert.equal(sha(b), p.sha256);
  }
  const xml = fs.readFileSync(policy.sourceXml.path, 'utf8');
  const sourceShape = xml.match(/<DefineShape2 objectID="2">([\s\S]*?)<\/DefineShape2>/u)?.[1];
  assert(sourceShape);
  assert.deepEqual([...sourceShape.matchAll(/<LineStyle width="(\d+)"/g)].map(m => +m[1]), [1, 20, 40, 40, 1, 1]);
  const start = runtime.indexOf('function shape2(ctx,ctrans,frame,ratio,time){');
  const end = runtime.indexOf('\n}', start) + 2;
  assert(start >= 0 && end > start);
  const shape = runtime.slice(start, end);
  const strokes = [...shape.matchAll(strokePattern)];
  assert.deepEqual(strokes.map(m => m[4]), policy.shapeStrokeWidthsBefore);
  const grid = strokes[0];
  assert.equal(sha(grid[1]), policy.gridPathTwipsSha256);
  const svg = fs.readFileSync(policy.sourceSvg.path, 'utf8');
  const thinPaths = [...svg.matchAll(/<path\b([^>]+)>/g)]
    .map(m => Object.fromEntries([...m[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map(a => [a[1], a[2]])))
    .filter(a => a['ffdec:original-stroke-width'] === '0.05');
  assert.equal(thinPaths.length, 3);
  assert.equal(thinPaths[0]['stroke-width'], '1.0');
  const tokens = s => s.match(/[MLZ]|-?\d+(?:\.\d+)?/g);
  const rawTokens = tokens(grid[1]), svgTokens = tokens(thinPaths[0].d);
  assert.equal(rawTokens.length, policy.gridPathTokenCount);
  assert.equal(rawTokens.length, svgTokens.length);
  rawTokens.forEach((t, i) => {
    if (/^[MLZ]$/.test(t)) assert.equal(t, svgTokens[i]);
    else assert(Math.abs(Number(t) - Number(svgTokens[i]) * 20) < 1e-8, 'source SVG/grid coordinate mismatch');
  });
  const replacement = grid[0].replace('ctx.lineWidth=0.05;', 'ctx.lineWidth=1.0;');
  assert.notEqual(replacement, grid[0]);
  const changedShape = shape.slice(0, grid.index) + replacement + shape.slice(grid.index + grid[0].length);
  assert.deepEqual([...changedShape.matchAll(strokePattern)].map(m => m[4]), policy.shapeStrokeWidthsAfter);
  assert.equal(changedShape.slice(0, grid.index) + grid[0] + changedShape.slice(grid.index + replacement.length), shape);
  const normalized = runtime.slice(0, start) + changedShape + runtime.slice(end);
  return {runtime: normalized, record: {
    policy: {path: policyPath, bytes: fs.statSync(policyPath).size, sha256: sha(fs.readFileSync(policyPath))},
    changedGridStrokeCount: 1, sourceShapeId: 2, sourceDeclaredGridStrokeTwips: 1,
    sourceCanvasGridStrokePixels: 0.05, currentJsGridDisplayStrokePixels: 1,
    beforeShapeSha256: sha(shape), afterShapeSha256: sha(changedShape), gridPathTwipsSha256: sha(grid[1]),
    svgCoordinateTokensVerified: rawTokens.length, geometryChanged: false,
    otherShapeStrokesChanged: false, otherFunctionsChanged: false, originalRuntimeFidelityAccepted: false
  }};
}
