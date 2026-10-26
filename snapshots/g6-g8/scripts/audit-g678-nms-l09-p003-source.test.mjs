import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

import {parseSwfSourceFacts} from './build-g4-l3-machine-source-audits.mjs';
import {SOURCE, validateP003SourceStructure, validateP003TextSource} from
  './audit-g678-nms-l09-p003-source.mjs';

const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;
test('P003 binds the real source and rejects a wrong frame domain',
  {skip: !sourceRoot}, async () => {
    const bytes = await readFile(path.join(sourceRoot, SOURCE.path));
    const facts = parseSwfSourceFacts(bytes);
    const result = validateP003SourceStructure(bytes, facts);
    assert.equal(result.mainFrameDomain, 'sprite-246');
    assert.equal(result.mainFrameCount, 635);
    assert.equal(result.soundStreamBlockCount, 635);
    assert.throws(() => validateP003SourceStructure(bytes,
      {...facts, frameDomains: {...facts.frameDomains, domains:
        facts.frameDomains.domains.map(item => item.domainId === 'root' ?
          {...item, placedSpriteIds: [249, 246]} : item)}}),
    /deep-equal/u);
    assert.throws(() => validateP003SourceStructure(
      Buffer.from(bytes.subarray(0, bytes.length - 1)), facts),
    /size drift/u);
  });

test('every declared migration frame domain matches the actual source graph',
  {skip: !sourceRoot}, async () => {
    const bytes = await readFile(path.join(sourceRoot, SOURCE.path));
    const facts = parseSwfSourceFacts(bytes);
    const disposition = JSON.parse(await readFile(
      'migrations/shared-nms002-l09-p003/audit/frame-domain-disposition.json'));
    const migration = JSON.parse(await readFile(
      'migrations/shared-nms002-l09-p003/migration.json'));
    assert.equal(disposition.sourceSha256, SOURCE.sha256);
    assert.equal(disposition.domainCount, facts.frameDomains.domains.filter(
      item => item.staticallyRootReachable).length);
    const byId = new Map(facts.frameDomains.domains.map(
      item => [item.domainId, item]));
    assert.deepEqual(new Set(disposition.domains.map(item => item.frameDomainId)),
      new Set([...byId.keys()]));
    assert.deepEqual(new Set(migration.implementation.frameDomains.map(
      item => item.id)), new Set([...byId.keys()]));
    for (const declared of disposition.domains) {
      const source = byId.get(declared.frameDomainId);
      assert.equal(declared.sourceFrames, source.declaredFrameCount);
      assert.deepEqual(declared.parents, source.parentDomainIds);
      assert.deepEqual(declared.sourcePlacementFrames,
        declared.frameDomainId === 'root' ? [] :
          [...new Set(facts.frameDomains.domains.flatMap(parent =>
            parent.placementEdges.filter(edge =>
              edge.childSpriteId === source.spriteId).flatMap(edge =>
              edge.distinctFrames)))].sort((a, b) => a - b));
      assert.equal(migration.implementation.frameDomains.find(item =>
        item.id === declared.frameDomainId).frameCount,
      source.declaredFrameCount);
      assert.equal(declared.originalNaturalTraceAccepted, false);
    }
  });

test('P003 source text instances and five formula mask beats stay bound to the SWF',
  {skip: !sourceRoot}, async () => {
    const bytes = await readFile(path.join(sourceRoot, SOURCE.path));
    const result = validateP003TextSource(bytes);
    assert.deepEqual(result.revealFrames, [591, 599, 605, 612, 616]);
    assert.equal(result.formulaInstanceId,
      'sprite-246/depth-283/generation-2');
    assert.throws(() => validateP003TextSource(
      Buffer.from(bytes.subarray(0, bytes.length - 1))), /hash drift/u);
  });
