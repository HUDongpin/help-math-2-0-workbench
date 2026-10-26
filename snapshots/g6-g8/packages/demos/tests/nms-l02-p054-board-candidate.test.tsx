import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync, lstatSync, readFileSync} from 'node:fs';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {P054_HELP_SOURCE, P054MatchingBoardCandidate} from '../src/nms-l02-p054-board-candidate';
import {P054_CARDS, P054_CARD_SOURCE} from '../src/generated/nms-l02-p054-cards-v1';
import {P054_FEEDBACK_AUDIO, p054FeedbackAudioUrl} from '../src/nms-l02-p054-feedback-audio-v1';
import {p054RevealShapeId, p054RevealTileUrl} from '../src/nms-l02-p054-reveal-v1';

const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

test('generated 24 cards retain exact source contract values and board positions', () => {
  const contractBytes = readFileSync(new URL(
    '../../../catalog/product-bridge-calibrations/g678-nms-l02-p053-p054-game-contract-v1.json', import.meta.url));
  const layoutBytes = readFileSync(new URL(
    '../../../migrations/shared-nms002-l02-p054/audit/card-layout-v1.json', import.meta.url));
  assert.equal(hash(contractBytes), P054_CARD_SOURCE.contractSha256);
  assert.equal(hash(layoutBytes), P054_CARD_SOURCE.layoutSha256);
  const contract = JSON.parse(contractBytes.toString('utf8'));
  const layout = JSON.parse(layoutBytes.toString('utf8'));
  assert.equal(P054_CARDS.length, 24);
  for (const card of P054_CARDS) {
    const source = contract.matching.cards.find((item: {level: number; sourceInstanceName: string}) =>
      item.level === card.level && item.sourceInstanceName === card.sourceInstanceName);
    const position = layout.cards.find((item: {level: number; sourceInstanceName: string}) =>
      item.level === card.level && item.sourceInstanceName === card.sourceInstanceName);
    assert.ok(source && position);
    assert.equal(card.sourceCharacterId, source.sourceCharacterId);
    assert.equal(card.placementOrder, source.placementOrder);
    assert.equal(card.pairId, source.pairId);
    assert.equal(card.side, source.side);
    assert.deepEqual(card.values, source.sourceTexts.map((item: {value: string}) => item.value));
    assert.deepEqual(card.sourceTextIds, source.sourceTexts.map((item: {id: number}) => item.id));
    assert.deepEqual(card.stagePx, position.stagePx);
  }
  assert.deepEqual(P054_CARDS.filter(card => card.level === 1).map(card => card.placementOrder),
    Array.from({length: 12}, (_, index) => index + 1));
  assert.deepEqual(P054_CARDS.filter(card => card.level === 2).map(card => card.placementOrder),
    Array.from({length: 12}, (_, index) => index + 1));
});

test('both candidate boards render twelve native math choices and retain independent gates', () => {
  for (const level of [1, 2] as const) {
    const html = renderToStaticMarkup(<P054MatchingBoardCandidate level={level} uiLanguage="es"/>);
    assert.match(html, /data-source-alignment="candidate-not-accepted"/);
    assert.match(html, /data-p054-phase="selecting"/);
    assert.equal((html.match(/class="p054-board__card"/g) ?? []).length, 12);
    assert.equal((html.match(/<math aria-label=/g) ?? []).length, 6);
    assert.match(html, /El resultado, la sincronización de audio y la navegación originales siguen sin verificarse/);
    assert.match(html, /data-p054-audio-status="loading"/);
    assert.match(html, /Cargando audio de respuesta del origen/);
    assert.match(html, /data-source-instance="Mc1_1"/);
    assert.match(html, /data-p054-matched="false"/);
    assert.match(html, /El botón Continuar es una ayuda temporal/);
    assert.match(html, /Ayuda del botón Repeat original/);
    assert.match(html, /Reiniciar vista local/);
    assert.equal((html.match(/data-source-text-id="/g) ?? []).length, 4);
    assert.match(html, /Instrucciones originales \(en inglés\)/);
    assert.match(html, /lang="en" data-source-text-id="97"/);
    assert.doesNotMatch(html, /<canvas|<object|\.swf/);
  }
  const english = renderToStaticMarkup(<P054MatchingBoardCandidate level={1}/>);
  assert.match(english, /aria-label="6\/8"/);
  assert.match(english, /0\.75/);
});

test('help copy and Repeat action stay bound to the exact P054 source extraction', t => {
  const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
  const extraction = '/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/p054-source-audit-gkoof5';
  if (process.env.HELP_MATH_G678_SOURCE_ROOT !== sourceRoot || !existsSync(extraction)) {
    t.skip('exact local G6–G8 source and FFDec extraction are required');
    return;
  }
  const rootStat = lstatSync(sourceRoot);
  assert.ok(rootStat.isDirectory() && !rootStat.isSymbolicLink());
  const swf = readFileSync(`${sourceRoot}/G6-G8-shared/NMS002/L2/GS/L2GS03.swf`);
  assert.equal(hash(swf), P054_CARD_SOURCE.sourceSwfSha256);
  assert.deepEqual(P054_HELP_SOURCE.map(item => item.id), [97, 98, 99, 100]);
  for (const item of P054_HELP_SOURCE) {
    const bytes = readFileSync(`${extraction}/texts/${item.id}.txt`);
    assert.equal(hash(bytes), item.sha256);
    assert.equal(bytes.toString('utf8').replaceAll('--- RECORDSEPARATOR ---', ' ')
      .replace(/\s+/gu, ' ').trim(), item.text);
  }
  for (const id of [233, 649, 730]) {
    const bytes = readFileSync(`${extraction}/scripts/DefineButton2_${id}/BUTTONCONDACTION on(release).as`);
    assert.equal(hash(bytes), 'a3007f42192b05bd5725697a919b0ef5b8125ce7f2ca3ef998e77c947d41c2b5');
    assert.match(bytes.toString('utf8'), /Mc_Popup\._visible = true/);
  }
  const close = readFileSync(`${extraction}/scripts/DefineButton2_96/BUTTONCONDACTION on(release).as`);
  assert.equal(hash(close), '7ce2739c35ad2613db4f35d07ec77a0a8b3644e23c112bb907229bcd14c86311');
  assert.match(close.toString('utf8'), /this\._visible = false/);
});

test('both source pictures map all 24 image sprites to card positions and bound SVG tiles', t => {
  const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
  const extraction = '/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/p054-source-audit-gkoof5';
  const artRoot = '/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/p054-art-assets-oM5UHV';
  if (process.env.HELP_MATH_G678_SOURCE_ROOT !== sourceRoot || !existsSync(extraction) || !existsSync(artRoot)) {
    t.skip('exact local source and FFDec extraction are required');
    return;
  }
  assert.ok(lstatSync(sourceRoot).isDirectory() && !lstatSync(sourceRoot).isSymbolicLink());
  assert.equal(hash(readFileSync(`${sourceRoot}/G6-G8-shared/NMS002/L2/GS/L2GS03.swf`)),
    P054_CARD_SOURCE.sourceSwfSha256);
  const auditRoot = new URL('../../../migrations/shared-nms002-l02-p054/audit/', import.meta.url);
  const displayBytes = readFileSync(new URL('game-display-list-v1.json', auditRoot));
  const artBytes = readFileSync(new URL('art-export-v1.json', auditRoot));
  const xmlBytes = readFileSync(`${extraction}/movie.xml`);
  assert.equal(hash(displayBytes), '8887c62a93824e851b2b6bba3779742ba43143b5c8e38b47c49b81c04fa6c40c');
  assert.equal(hash(artBytes), 'b715b175badc1edfcdf5df81ef7c388ea7e0b2eaac99656c28c74d1762e91974');
  assert.equal(hash(xmlBytes), '2fd8146fe801e80f13c497b4bcefcf4aa050fc6d75decb448424767c56034e46');
  const display = JSON.parse(displayBytes.toString()) as {frames: Array<{frame: number;
    layers: Array<{sourceCharacterId: number; sourceInstanceName: string}>}>};
  const art = JSON.parse(artBytes.toString()) as {export: {items: Array<{file: string; bytes: number; sha256: string}>}};
  const xml = xmlBytes.toString();
  for (const level of [1, 2] as const) {
    const images = display.frames.find(frame => frame.frame === level * 2)?.layers.filter(layer =>
      /^Mc[1-6]_Img[12]$/u.test(layer.sourceInstanceName));
    const cards = P054_CARDS.filter(card => card.level === level);
    assert.equal(images?.length, 12);
    for (const card of cards) {
      const shape = p054RevealShapeId(level, card.placementOrder);
      const sprite: {sourceCharacterId: number; sourceInstanceName: string} =
        images![card.placementOrder - 1];
      assert.equal(sprite?.sourceInstanceName, `Mc${card.pairId}_Img${card.side}`);
      assert.equal(sprite.sourceCharacterId, shape + 1);
      assert.ok(xml.includes(`<DefineSprite objectID="${shape + 1}" frames="1">\n        <tags>\n          <PlaceObject2 replace="0" depth="1" objectID="${shape}">`));
      const item = art.export.items.find(entry => entry.file === `shapes/${shape}.svg`);
      assert.ok(item);
      const bytes = readFileSync(`${artRoot}/${item.file}`);
      assert.equal(bytes.length, item.bytes);
      assert.equal(hash(bytes), item.sha256);
      const svg = bytes.toString();
      assert.match(svg, /<svg\b/u);
      assert.equal((svg.match(/xlink:href="data:image\/PNG;base64,/gu) ?? []).length, 1);
      assert.doesNotMatch(svg, /<script\b|<foreignObject\b|\son\w+=/iu);
      assert.equal(p054RevealTileUrl(level, card.placementOrder),
        `/flash-assets/g678-local/shared-nms002-l02-p054/reveal/${level}/${card.placementOrder}`);
    }
  }
  assert.throws(() => p054RevealShapeId(1, 0));
  assert.throws(() => p054RevealShapeId(2, 13));
});

test('both level frames bind correct and wrong source feedback to exact MP3 bytes', t => {
  const sourceRoot = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
  const extraction = '/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/p054-source-audit-gkoof5';
  const audioRoot = '/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/p054-audio-streams-v1';
  if (process.env.HELP_MATH_G678_SOURCE_ROOT !== sourceRoot ||
      !existsSync(extraction) || !existsSync(audioRoot)) {
    t.skip('exact local source, FFDec extraction, and MP3 evidence are required');
    return;
  }
  assert.ok(lstatSync(sourceRoot).isDirectory() && !lstatSync(sourceRoot).isSymbolicLink());
  assert.equal(hash(readFileSync(`${sourceRoot}/G6-G8-shared/NMS002/L2/GS/L2GS03.swf`)),
    P054_CARD_SOURCE.sourceSwfSha256);
  const display = JSON.parse(readFileSync(new URL(
    '../../../migrations/shared-nms002-l02-p054/audit/game-display-list-v1.json', import.meta.url), 'utf8')) as {
      frames: Array<{frame: number; layers: Array<{sourceInstanceName: string; sourceCharacterId: number}>}>;
    };
  for (const frame of [2, 4]) {
    const layers = display.frames.find(item => item.frame === frame)?.layers;
    assert.equal(layers?.find(item => item.sourceInstanceName === 'Mc_Feed2')?.sourceCharacterId,
      P054_FEEDBACK_AUDIO.correct.spriteId);
    assert.equal(layers?.find(item => item.sourceInstanceName === 'Mc_Feed1')?.sourceCharacterId,
      P054_FEEDBACK_AUDIO.wrong.spriteId);
    const scriptPath = frame === 2 ? 'PlaceObject2_138_30' : 'PlaceObject2_699_36';
    const script = readFileSync(`${extraction}/scripts/DefineSprite_731/frame_${frame}/${scriptPath}/CLIPACTIONRECORD on(release).as`, 'utf8');
    assert.match(script, /_global\.score \+= 10;[\s\S]*?_parent\.Mc_Feed2\.gotoAndPlay\(2\)/u);
    assert.match(script, /_global\.score -= 2;[\s\S]*?_parent\.Mc_Feed1\.gotoAndPlay\(2\)/u);
  }
  const manifestBytes = readFileSync(`${audioRoot}/stream-manifest-v1.json`);
  assert.equal(hash(manifestBytes), 'fd31b5e1208eaf54ef3c14fd28d55d61b2fdb3fc47d7b1f41a097d7e40d2dca0');
  const manifest = JSON.parse(manifestBytes.toString('utf8')) as {audioAccepted: boolean;
    streams: Array<{sourceCharacterId: number; encoded: {path: string; bytes: number; sha256: string}}>};
  assert.equal(manifest.audioAccepted, false);
  for (const kind of ['correct', 'wrong'] as const) {
    const source = P054_FEEDBACK_AUDIO[kind];
    const entry = manifest.streams.find(item => item.sourceCharacterId === source.spriteId);
    assert.ok(entry);
    assert.equal(entry.encoded.path, `${audioRoot}/sprite-${source.spriteId}-source-stream-v1.mp3`);
    const bytes = readFileSync(entry.encoded.path);
    assert.equal(bytes.length, source.bytes);
    assert.equal(hash(bytes), source.sha256);
    assert.equal(p054FeedbackAudioUrl(kind),
      `/flash-assets/g678-local/shared-nms002-l02-p054/feedback-audio/${kind}?sha256=${source.sha256}`);
  }
});
