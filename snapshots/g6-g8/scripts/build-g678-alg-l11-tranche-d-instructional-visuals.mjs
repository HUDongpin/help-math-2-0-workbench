#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PREFIX = 'g678-alg-l11-tranche-d-instructional-visuals-v1';
const RAW = 'work/g678-shared-page-factory/g678-alg-l11-tranche-d-instructional-visuals-v3';
const DIAGNOSTIC = 'work/g678-shared-page-factory/g678-alg-l11-residual-routing-audit-v1';
const GENERATED = `packages/demos/src/generated/${PREFIX}.ts`;
const RUN = `work/g678-shared-page-factory/${PREFIX}-generated`;
const AUDIT = 'catalog/g678-alg-l11-advanced3-tranche-d-audit-v1.json';
const PARSER = 'scripts/g678-alg-l11-tranche-d-instructional-source.py';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const run = promisify(execFile);
async function file(relative) {
  const absolute = path.resolve(ROOT, relative);
  assert.ok(absolute.startsWith(ROOT + path.sep));
  const stat = await lstat(absolute);
  assert.ok(stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1);
  const bytes = await readFile(absolute);
  return {path: relative, bytes: bytes.length, sha256: hash(bytes), buffer: bytes};
}
const descriptor = ({buffer: _buffer, ...rest}) => rest;
const attribute = (element, name) => element.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1];

export function directElements(xml) {
  const result = []; let depth = 0; let start = 0;
  for (const match of xml.matchAll(/<\/?[A-Za-z][^>]*>/g)) {
    const tag = match[0];
    if (tag.startsWith('</')) {
      depth -= 1; assert.ok(depth >= 0);
      if (depth === 0) result.push(xml.slice(start, match.index + tag.length));
    } else if (tag.endsWith('/>')) {
      if (depth === 0) result.push(tag);
    } else { if (depth === 0) start = match.index; depth += 1; }
  }
  assert.equal(depth, 0); return result;
}

function pruneDefinitions(svg) {
  const defs = svg.match(/<defs>([\s\S]*)<\/defs>/);
  assert.ok(defs);
  const nodes = directElements(defs[1]);
  const byId = new Map(nodes.map(node => [attribute(node, 'id'), node]));
  assert.equal(byId.size, nodes.length); assert.ok(!byId.has(undefined));
  const needed = new Set();
  function visit(markup) {
    for (const match of markup.matchAll(/(?:xlink:href|href)="#([^"]+)"|url\(#([^)]*)\)/g)) {
      const id = match[1] ?? match[2];
      if (!needed.has(id)) { assert.ok(byId.has(id), `missing SVG definition ${id}`);
        needed.add(id); visit(byId.get(id)); }
    }
  }
  visit(svg.replace(defs[0], ''));
  return svg.replace(defs[0], '<defs>' + nodes.filter(node => needed.has(attribute(node,'id'))).join('\n') + '</defs>');
}

export function sanitizeSvg(svg, namespace) {
  assert.match(namespace, /^[a-z0-9-]+$/);
  // Source buttons contribute their up-state artwork. React owns interaction;
  // FFDec's global hover CSS must not leak between independently rendered SVGs.
  svg = svg.replace(/<style>([\s\S]*?)<\/style>/g, (_, css) => {
    assert.equal(hash(css), '4356dcc5c41c0bdef3e4450bf1e9daf8ff013cd07078c69cee8e495ccc2cb7b1');
    return '';
  }).replace(/(<g class="button-frame button-frame-(?:over|down|hittest)"[^>]*)(>)/g, '$1 style="display:none"$2');
  assert.ok(!/<(?:script|foreignObject|image|style|animate|set)\b|\bon\w+=|javascript:|<!DOCTYPE|<!ENTITY/i.test(svg), 'unsupported SVG construct');
  for (const reference of svg.matchAll(/(?:xlink:href|href)="([^"]+)"/g)) assert.ok(reference[1].startsWith('#'));
  let result = pruneDefinitions(svg).replace(/<\?xml[^>]*>\s*/g, '');
  const ids = [...result.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'duplicate SVG ID');
  result = result.replace(/\bid="([^"]+)"/g, (_, id) => `id="${namespace}-${id}"`)
    .replace(/(xlink:href|href)="#([^"]+)"/g, (_, attr, id) => `${attr}="#${namespace}-${id}"`)
    .replace(/url\(#([^)]*)\)/g, (_, id) => `url(#${namespace}-${id})`);
  return result.replace(/<svg\b/, '<svg aria-hidden="true" focusable="false" style="display:block;width:100%;height:auto"');
}

async function normalize(svg, namespace, trim = false) {
  const opening = svg.match(/<svg\b[^>]*>/)[0];
  const width = Number.parseFloat(attribute(opening, 'width'));
  const height = Number.parseFloat(attribute(opening, 'height'));
  assert.ok(width > 0 && height > 0);
  let box = [0, 0, width, height];
  if (trim) {
    // Measure the static vector ink, then add 8 native pixels of padding. The
    // output remains the original editable vector/glyph layers, never a bitmap.
    const {info} = await sharp(Buffer.from(svg)).trim({background: '#00000000', threshold: 0})
      .png().toBuffer({resolveWithObject: true});
    assert.ok(info.width > 0 && info.height > 0);
    box = [-info.trimOffsetLeft - 8, -info.trimOffsetTop - 8, info.width + 16, info.height + 16];
  }
  const result = sanitizeSvg(svg.replace(opening, opening.replace(/\bwidth="[^"]*"/, `width="${box[2]}"`)
    .replace(/\bheight="[^"]*"/, `height="${box[3]}"`).replace(/>$/, ` viewBox="${box.join(' ')}">`)), namespace);
  return {svg: result, width: box[2], height: box[3], viewBox: box, sha256: hash(result)};
}

export function separateQuestionSvg(svg, questionNumber) {
  const group = svg.match(/(<g transform="[^"]+">)([\s\S]*?)<\/g>\s*<defs>/);
  assert.ok(group);
  const uses = directElements(group[2]); assert.ok(uses.every(use => use.startsWith('<use ')));
  const options = uses.filter(use => new RegExp(`^A${questionNumber}Opt[1-4]$`).test(attribute(use, 'id') ?? ''));
  assert.equal(options.length, 4, `Q${questionNumber} exact four options absent`);
  const excludedNames = new Set(['dtfTIMETAKEN', 'TQ', 'QuestNo', 'CQ', 'Mc_Finish',
    'Mc_Quiz_Audio', 'Mc_Quiz_Audio_1', 'Mc_Quiz_Audio_2', 'Mc_Quiz_Audio_3', 'Mc_Quiz_Audio_4']);
  const prompt = uses.filter(use => !options.includes(use) &&
    !excludedNames.has(attribute(use, 'id')) && attribute(use, 'ffdec:characterId') !== '17');
  assert.ok(prompt.length > 0);
  return {svg: svg.replace(group[0], group[1] + prompt.join('\n') + '</g><defs>'),
    promptCharacterIds: prompt.map(use => Number(attribute(use,'ffdec:characterId'))),
    sourceUses: uses.map(use => ({characterId: Number(attribute(use,'ffdec:characterId')), name: attribute(use,'id') ?? null})),
    excludedUses: uses.filter(use => !prompt.includes(use) && !options.includes(use))
      .map(use => ({characterId: Number(attribute(use,'ffdec:characterId')), name: attribute(use,'id') ?? null})),
    options: options.map(use => ({name: attribute(use,'id'), characterId: Number(attribute(use,'ffdec:characterId'))}))};
}

export async function build({check = false} = {}) {
  const extraction = await file(`${RAW}/extraction.json`);
  const auditFile = await file(AUDIT); assert.equal(auditFile.sha256, '03e9ba9bb7af3baa2df8bc1792834bd74ca502a56bc041f3a8860dc51dffec42');
  const audit = JSON.parse(auditFile.buffer);
  const raw = JSON.parse(extraction.buffer);
  assert.equal(raw.builder.sha256, (await file(raw.builder.path)).sha256);
  const sources = [];
  for (const page of raw.pages) {
    assert.equal(page.source.sha256, audit.pages.find(p => p.animationId.endsWith(page.page)).source.sha256);
    for (const entry of page.files) {
      const actual = await file(`${RAW}/${page.page}/${entry.path}`);
      assert.equal(actual.sha256, entry.sha256); assert.equal(actual.bytes, entry.bytes);
    }
    const xml = await file(`${DIAGNOSTIC}/shared-alg001-l11-${page.page}/source.xml`);
    assert.equal(xml.sha256, audit.pages.find(p => p.animationId.endsWith(page.page)).ffdec.sourceXml.sha256);
    sources.push(descriptor(xml));
  }
  const parsed = JSON.parse((await run('python3', [PARSER, sources.find(s => s.path.includes('p044')).path, 'p044'], {cwd: ROOT, maxBuffer: 8 * 1024 * 1024})).stdout);
  const textBindings = new Map();
  async function texts(page, ids) {
    const records = [];
    for (const id of [...new Set(ids)]) {
      const input = await file(`${DIAGNOSTIC}/shared-alg001-l11-${page}/ffdec-export/texts/${id}.txt`);
      textBindings.set(input.path, descriptor(input));
      records.push({characterId: id, text: input.buffer.toString().replace(/\s*--- RECORDSEPARATOR ---\s*/g,'\n').trim(), source: descriptor(input)});
    }
    return records;
  }
  const questions = [];
  for (const question of parsed.questions) {
    assert.equal(question.frame, question.number + 1); assert.equal(question.reviewFrame, question.number + 44);
    const rawSvg = await file(`${RAW}/p044/DefineSprite_1083/${question.frame}.svg`);
    const separated = separateQuestionSvg(rawSvg.buffer.toString(), question.number);
    assert.deepEqual(separated.sourceUses, question.placements.map(p => ({characterId: Number(p.objectID), name: p.name ?? null})), 'FFDec and swfmill display-list identity disagreement');
    const promptTextIds = separated.promptCharacterIds.flatMap(id => parsed.symbolTextIds[id]);
    const choices = [];
    for (let option = 1; option <= 4; option += 1) {
      const source = question.options.find(p => p.name === `A${question.number}Opt${option}`);
      assert.deepEqual(separated.options.find(p => p.name === source.name), {name: source.name, characterId: Number(source.objectID)});
      const optionSvg = await file(`${RAW}/p044/DefineSprite_${source.objectID}/1.svg`);
      choices.push({option, sourceInstanceName: source.name, sourceCharacterId: Number(source.objectID),
        sourceSvg: descriptor(optionSvg), sourceText: await texts('p044', source.textIds),
        visual: await normalize(optionSvg.buffer.toString(), `d-p044-q${question.number}-opt${option}`)});
    }
    const answer = audit.behaviorContracts.p044RandomFinalAssessment.answerKey[question.number - 1];
    assert.match(answer, new RegExp(`^A${question.number}Opt[1-4]$`));
    questions.push({number: question.number, label: question.label, sourceFrame: question.frame,
      sourceReviewFrame: question.reviewFrame, sourceFrameSvg: descriptor(rawSvg),
      sourceReviewFrameSvg: descriptor(await file(`${RAW}/p044/DefineSprite_1083/${question.reviewFrame}.svg`)),
      correctOption: Number(answer.slice(-1)), correctSourceInstanceName: answer,
      promptCharacterIds: separated.promptCharacterIds, excludedHostUi: separated.excludedUses,
      sourceText: await texts('p044', promptTextIds),
      prompt: await normalize(separated.svg, `d-p044-q${question.number}-prompt`, true), choices});
  }
  const cards = [];
  for (const card of audit.behaviorContracts.p034MatchingGame.cards) {
    const svg = await file(`${RAW}/p034/DefineSprite_${card.sourceCharacterId}/1.svg`);
    cards.push({id: `level-${card.level}-${card.sourceInstanceName}`, level: card.level,
      pairId: card.pairId, side: card.side, sourceCharacterId: card.sourceCharacterId,
      sourceInstanceName: card.sourceInstanceName, sourceSvg: descriptor(svg),
      sourceText: await texts('p034', card.sourceTexts.map(t => t.textId)),
      visual: await normalize(svg.buffer.toString(), `d-p034-l${card.level}-${card.sourceInstanceName.toLowerCase().replaceAll('_','-')}`)});
  }
  assert.equal(cards.length, 24);
  const data = {schemaVersion: 1, sourceAuditSha256: auditFile.sha256,
    extractionSha256: extraction.sha256, sourceFrameDomain: 'sprite-1083',
    questions, cards, coverage: {questionPromptCount: 24, choiceCount: 96, matchingCardCount: 24,
      registeredPlacementCount: 0, p033ControllerFullVisualTimelineImplemented: false},
    gates: raw.gates};
  const generated = '// Generated by build-g678-alg-l11-tranche-d-instructional-visuals.mjs. Do not hand edit.\n' +
    'export const G678_ALG_L11_D_INSTRUCTIONAL_VISUALS = ' + JSON.stringify(data) + ' as const;\n';
  const manifest = {schemaVersion: 1, runId: PREFIX, builder: descriptor(await file(path.relative(ROOT, fileURLToPath(import.meta.url)))),
    parser: descriptor(await file(PARSER)), extraction: descriptor(extraction), sourceAudit: descriptor(auditFile), sources,
    textInputs: [...textBindings.values()].sort((a,b) => a.path.localeCompare(b.path)),
    measurementTool: {role: 'transparent ink bounding box only, source SVG remains vector', versions: sharp.versions, paddingNativePixels: 8},
    generated: {path: GENERATED, bytes: Buffer.byteLength(generated), sha256: hash(generated)},
    coverage: data.coverage, gates: raw.gates,
    limitations: ['Original-runtime visual comparison and audio remain unverified.',
      'p033 only has extracted controller reference states; its 606-frame instructional visual sequence is not implemented by this successor.',
      'Review reuses exact source question and choice art with maintained selected/correct indicators; original review timeline fidelity is not asserted.',
      'Raster measurement crops source vectors; it is not an instructional bitmap or original-runtime evidence.',
      'Complex equation and graph accessibility semantics still require product review.']};
  if (check) {
    assert.equal((await readFile(path.join(ROOT, GENERATED),'utf8')), generated);
    assert.equal((await readFile(path.join(ROOT, RUN, 'run.json'),'utf8')), json(manifest));
  } else {
    await mkdir(path.join(ROOT, RUN));
    await mkdir(path.dirname(path.join(ROOT, GENERATED)), {recursive: true});
    await writeFile(path.join(ROOT, GENERATED), generated, {flag:'wx'});
    await writeFile(path.join(ROOT, RUN, 'run.json'), json(manifest), {flag:'wx'});
  }
  console.log(JSON.stringify({check, ...manifest.coverage, generated: manifest.generated}));
  return {data, manifest};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build({check: process.argv.includes('--check')});
