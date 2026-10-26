#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, readFile, realpath, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {auditG678AlgL09ResidualRouting} from
  './audit-g678-alg-l09-residual-routing.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const SOURCE_ENV = 'HELP_MATH_G678_SOURCE_ROOT';
const RESIDUAL = 'catalog/g678-alg-l09-residual-routing-audit-v1.json';
const PREDECESSOR =
  'catalog/product-bridge-calibrations/g678-current-js-339-page-product-calibrated-registration-v1.json';
const OUTPUT = 'catalog/g678-alg-l09-game-assessment-family-audit-v1.json';
const IDS = Object.freeze([
  'shared-alg001-l09-p030',
  'shared-alg001-l09-p031',
  'shared-alg001-l09-p041',
]);
const ANSWER_KEY = Object.freeze([
  1, 2, 3, 4, 3, 3, 4, 4, 3, 2, 4, 1,
  2, 2, 1, 1, 1, 1, 2, 2, 4, 3, 4, 3,
]);
const GS03_CARD_CONTENT = Object.freeze({
  62: {label: '5 to 1', equivalenceKey: '5:1', sourceTexts: [[60, '5 to 1']]},
  89: {label: '5/1', equivalenceKey: '5:1', sourceTexts: [[87, '5'], [88, '1']]},
  74: {label: '4:7', equivalenceKey: '4:7', sourceTexts: [[73, '4'], [69, ':'], [72, '7']]},
  85: {label: '4 to 7', equivalenceKey: '4:7', sourceTexts: [[84, '4 to 7']]},
  83: {label: '3/2', equivalenceKey: '3:2', sourceTexts: [[81, '3'], [82, '2']]},
  94: {label: '3:2', equivalenceKey: '3:2', sourceTexts: [[75, '3'], [69, ':'], [76, '2']]},
  91: {label: '2 to 3', equivalenceKey: '2:3', sourceTexts: [[90, '2 to 3']]},
  77: {label: '2:3', equivalenceKey: '2:3', sourceTexts: [[76, '2'], [69, ':'], [75, '3']]},
  66: {label: '7/4', equivalenceKey: '7:4', sourceTexts: [[64, '7'], [65, '4']]},
  79: {label: '7 to 4', equivalenceKey: '7:4', sourceTexts: [[78, '7 to 4']]},
  93: {label: '1/5', equivalenceKey: '1:5', sourceTexts: [[88, '1'], [87, '5']]},
  71: {label: '1:5', equivalenceKey: '1:5', sourceTexts: [[70, '1'], [69, ':'], [68, '5']]},
  193: {label: '3/2', equivalenceKey: '3:2', sourceTexts: [[81, '3'], [82, '2']]},
  207: {label: '6/4', equivalenceKey: '3:2', sourceTexts: [[206, '6'], [65, '4']]},
  202: {label: '3/9', equivalenceKey: '1:3', sourceTexts: [[81, '3'], [201, '9']]},
  212: {label: '4/12', equivalenceKey: '1:3', sourceTexts: [[65, '4'], [209, '12']]},
  210: {label: '6/12', equivalenceKey: '1:2', sourceTexts: [[206, '6'], [209, '12']]},
  219: {label: '7/14', equivalenceKey: '1:2', sourceTexts: [[64, '7'], [218, '14']]},
  216: {label: '2/3', equivalenceKey: '2:3', sourceTexts: [[82, '2'], [81, '3']]},
  214: {label: '10/15', equivalenceKey: '2:3', sourceTexts: [[195, '10'], [198, '15']]},
  196: {label: '2/10', equivalenceKey: '1:5', sourceTexts: [[82, '2'], [195, '10']]},
  222: {label: '10/50', equivalenceKey: '1:5', sourceTexts: [[195, '10'], [221, '50']]},
  204: {label: '10/2', equivalenceKey: '5:1', sourceTexts: [[195, '10'], [82, '2']]},
  199: {label: '15/3', equivalenceKey: '5:1', sourceTexts: [[198, '15'], [81, '3']]},
});

function question(number, prompt, supportingData, choices, sourceTexts) {
  return Object.freeze({questionNumber: number, prompt,
    supportingData: Object.freeze(supportingData),
    choices: Object.freeze(choices), correctOption: ANSWER_KEY[number - 1],
    sourceTexts: Object.freeze(sourceTexts.map(([textId, value]) =>
      Object.freeze({textId, value})))});
}

const FQ02_QUESTIONS = Object.freeze([
  question(1,
    'The table shows how much sports equipment Carter owns. What is the ratio of footballs to basketballs in Carter’s collection?',
    ['Baseballs: 1', 'Basketballs: 6', 'Footballs: 4'],
    ['2 to 3', '3 to 2', '4 to 1', '6 to 4'],
    [[19, 'The table shows how much sports equipment Carter owns. What is the ratio of footballs to basketballs in Carter’s collection?'], [23, 'Baseballs'], [22, '1'], [24, 'Basketballs'], [25, '6'], [26, 'Footballs'], [27, '4'], [28, '2 to 3'], [34, '3 to 2'], [38, '4 to 1'], [42, '6 to 4']]),
  question(2,
    'The table shows how many of Umi’s friends have each eye color. What is the ratio of friends with green eyes to friends with brown eyes?',
    ['Blue: 4', 'Brown: 6', 'Green: 2'],
    ['1 to 2', '1 to 3', '2 to 4', '6 to 2'],
    [[71, 'The table shows how many of Umi’s friends have each eye color. What is the ratio of friends with green eyes to friends with brown eyes?'], [74, 'Blue'], [27, '4'], [75, 'Brown'], [25, '6'], [76, 'Green'], [77, '2'], [78, '1 to 2'], [81, '1 to 3'], [84, '2 to 4'], [87, '6 to 2']]),
  question(3,
    'The students in Mr. Boone’s class chose their favorite subject. The table below shows the totals for each subject. What is the ratio of students who chose math to students who chose history?',
    ['History: 8', 'Math: 12', 'Science: 6'],
    ['1 to 2', '2 to 3', '3 to 2', '8 to 12'],
    [[90, 'The students in Mr. Boone’s class chose their favorite subject. The table below shows the totals for each subject. What is the ratio of students who chose math to students who chose history?'], [94, 'History'], [93, '8'], [95, 'Math'], [96, '12'], [97, 'Science'], [25, '6'], [78, '1 to 2'], [101, '2 to 3'], [104, '3 to 2'], [106, '8 to 12']]),
  question(4,
    'The table shows how many DVDs Jill owns. What is the ratio of drama DVDs to cartoon DVDs in Jill’s collection?',
    ['Cartoons: 2', 'Comedies: 5', 'Dramas: 10'],
    ['1 to 5', '2 to 1', '2 to 10', '5 to 1'],
    [[109, 'The table shows how many DVDs Jill owns. What is the ratio of drama DVDs to cartoon DVDs in Jill’s collection?'], [112, 'Cartoons'], [77, '2'], [113, 'Comedies'], [114, '5'], [115, 'Dramas'], [116, '10'], [118, '1 to 5'], [120, '2 to 1'], [124, '2 to 10'], [126, '5 to 1']]),
  question(5, 'Which ratio is equivalent to 9/64?', [],
    ['1 to 7', '3 to 8', '9:64', '64:9'],
    [[130, 'Which ratio is equivalent to ?'], [133, '9'], [134, '64'], [135, '1 to 7'], [139, '3 to 8'], [142, '9:64'], [144, '64:9']]),
  question(6, 'Which ratio is equivalent to 16/25?', [],
    ['1:2', '5:4', '16 to 25', '25 to 16'],
    [[148, 'Which ratio is equivalent to ?'], [151, '16'], [152, '25'], [153, '1:2'], [157, '5:4'], [160, '16 to 25'], [163, '25 to 16']]),
  question(7, 'Which ratio is equivalent to 49/36?', [],
    ['6 to 7', '7 to 6', '36:49', '49:36'],
    [[166, 'Which ratio is equivalent to ?'], [169, '49'], [170, '36'], [171, '6 to 7'], [175, '7 to 6'], [177, '36:49'], [180, '49:36']]),
  question(8, 'Which ratio is equivalent to 43/34?', [],
    ['3:4', '21:12', '34 to 43', '43 to 34'],
    [[166, 'Which ratio is equivalent to ?'], [186, '43'], [187, '34'], [188, '3:4'], [191, '21:12'], [194, '34 to 43'], [197, '43 to 34']]),
  question(9, 'What is the unknown value in the proportion 5/H = 6/12?', [],
    ['H = 8', 'H = 9', 'H = 10', 'H = 11'],
    [[201, 'What is the unknown value in the proportion ?'], [114, '5'], [204, 'H'], [25, '6'], [96, '12'], [207, 'H = 8'], [209, 'H = 9'], [213, 'H = 10'], [216, 'H = 11']]),
  question(10, 'What is the unknown value in the proportion 6/10 = G/25?', [],
    ['G = 12', 'G = 15', 'G = 18', 'G = 36'],
    [[201, 'What is the unknown value in the proportion ?'], [25, '6'], [116, '10'], [221, 'G'], [152, '25'], [222, 'G = 12'], [226, 'G = 15'], [229, 'G = 18'], [232, 'G = 36']]),
  question(11, 'What is the unknown value in the proportion 2/10 = 10/J?', [],
    ['J = 2', 'J = 10', 'J = 25', 'J = 50'],
    [[201, 'What is the unknown value in the proportion ?'], [77, '2'], [116, '10'], [237, 'J'], [239, 'J = 2'], [241, 'J = 10'], [245, 'J = 25'], [248, 'J = 50']]),
  question(12, 'What is the unknown value in the proportion 4/16 = K/4?', [],
    ['K = 1', 'K = 2', 'K = 4', 'K = 16'],
    [[201, 'What is the unknown value in the proportion ?'], [27, '4'], [151, '16'], [253, 'K'], [255, 'K = 1'], [257, 'K = 2'], [261, 'K = 4'], [264, 'K = 16']]),
  question(13,
    'The table below shows the perimeter of an equilateral triangle based on the length of the sides of the triangle. Describe this relationship between the quantities.',
    ['Side length 2 → perimeter 6', 'Side length 4 → perimeter 12', 'Side length 6 → perimeter 18', 'Side length 8 → perimeter 24'],
    ['non-proportional relationship', 'proportional relationship'],
    [[266, 'The table below shows the perimeter of an equilateral triangle based on the length of the sides of the triangle. Describe this relationship between the quantities.'], [270, 'Side Length'], [271, 'Perimeter'], [77, '2'], [25, '6'], [27, '4'], [96, '12'], [272, '18'], [93, '8'], [273, '24'], [275, 'non-proportional relationship'], [277, 'proportional relationship']]),
  question(14,
    'The table below shows the perimeter of a shape based on the lengths of its sides. Describe this relationship between the quantities.',
    ['Side length 2 → perimeter 10', 'Side length 4 → perimeter 20', 'Side length 6 → perimeter 30', 'Side length 8 → perimeter 40'],
    ['non-proportional relationship', 'proportional relationship'],
    [[280, 'The table below shows the perimeter of a shape based on the lengths of its sides. Describe this relationship between the quantities.'], [270, 'Side Length'], [271, 'Perimeter'], [77, '2'], [116, '10'], [27, '4'], [283, '20'], [25, '6'], [284, '30'], [93, '8'], [285, '40'], [275, 'non-proportional relationship'], [288, 'proportional relationship']]),
  question(15,
    'The table below shows the area of a triangle when its base and height are the same value. Describe this relationship between the quantities.',
    ['Base and height 2 → area 2', 'Base and height 4 → area 8', 'Base and height 6 → area 18', 'Base and height 8 → area 32'],
    ['non-proportional relationship', 'proportional relationship'],
    [[291, 'The table below shows the area of a triangle when its base and height are the same value. Describe this relationship between the quantities.'], [296, 'Base and'], [297, 'Height'], [294, 'Area'], [77, '2'], [27, '4'], [25, '6'], [93, '8'], [272, '18'], [295, '32'], [275, 'non-proportional relationship'], [277, 'proportional relationship']]),
  question(16,
    'The table below shows the area of a square based on the length of its sides. Describe this relationship between the quantities.',
    ['Side 2 → area 4', 'Side 4 → area 16', 'Side 6 → area 36', 'Side 8 → area 64'],
    ['non-proportional relationship', 'proportional relationship'],
    [[304, 'The table below shows the area of a square based on the length of its sides. Describe this relationship between the quantities.'], [306, 'Side'], [305, 'Area'], [77, '2'], [27, '4'], [25, '6'], [93, '8'], [151, '16'], [170, '36'], [134, '64'], [308, 'non-proportional relationship'], [277, 'proportional relationship']]),
  question(17,
    'Lisa uses the equation Q = M + 2 to plan how many quarts (Q) of water to take on a hike based on the length of the hike in miles (M). What kind of relationship does this equation describe?',
    [], ['non-proportional relationship', 'proportional relationship'],
    [[312, 'Lisa uses the equation Q = M + 2 to plan how many quarts (Q) of water to take on a hike based on the length of the hike in miles (M). What kind of relationship does this equation describe?'], [275, 'non-proportional relationship'], [277, 'proportional relationship']]),
  question(18,
    'Nate uses the equation M = 2P + 5 to plan how many minutes (M) he will need to complete his homework based on how many problems (P) he has to solve. What kind of relationship does this equation describe?',
    [], ['non-proportional relationship', 'proportional relationship'],
    [[319, 'Nate uses the equation M = 2P + 5 to plan how many minutes (M) he will need to complete his homework based on how many problems (P) he has to solve. What kind of relationship does this equation describe?'], [308, 'non-proportional relationship'], [277, 'proportional relationship']]),
  question(19,
    'Eric’s mom uses the equation D = 5A to decide how many dollars (D) to give Eric for each “A” he has on his report card. What kind of relationship does this equation describe?',
    [], ['non-proportional relationship', 'proportional relationship'],
    [[326, 'Eric’s mom uses the equation D = 5A to decide how many dollars (D) to give Eric for each “A” he has on his report card. What kind of relationship does this equation describe?'], [275, 'non-proportional relationship'], [277, 'proportional relationship']]),
  question(20,
    'Cori uses the equation M = 3P to plan how many minutes (M) are needed to do the reading assignment based on the number pages (P) she must read. What kind of relationship does this equation describe?',
    [], ['non-proportional relationship', 'proportional relationship'],
    [[333, 'Cori uses the equation M = 3P to plan how many minutes (M) are needed to do the reading assignment based on the number pages (P) she must read. What kind of relationship does this equation describe?'], [275, 'non-proportional relationship'], [277, 'proportional relationship']]),
  question(21,
    'The scale on a map is 1 inch : 50 miles. Jones is 5 inches from Hume on the map. What is the actual distance between Jones and Hume?',
    [], ['10 miles', '25 miles', '200 miles', '250 miles'],
    [[340, 'The scale on a map is 1 inch : 50 miles. Jones is 5 inches from Hume on the map. What is the actual distance between Jones and Hume?'], [343, '10 miles'], [346, '25 miles'], [349, '200 miles'], [352, '250 miles']]),
  question(22,
    'The scale on a map is 1 inch : 40 miles. Wayne is 4 inches from Harper on the map. What is the actual distance between Wayne and Harper?',
    [], ['10 miles', '44 miles', '160 miles', '440 miles'],
    [[355, 'The scale on a map is 1 inch : 40 miles. Wayne is 4 inches from Harper on the map. What is the actual distance between Wayne and Harper?'], [343, '10 miles'], [360, '44 miles'], [363, '160 miles'], [367, '440 miles']]),
  question(23,
    'The scale on a map is 1 inch : 60 miles. Jenks is 3 inches from Cape on the map. What is the actual distance between Jenks and Cape?',
    [], ['20 miles', '30 miles', '120 miles', '180 miles'],
    [[369, 'The scale on a map is 1 inch : 60 miles. Jenks is 3 inches from Cape on the map. What is the actual distance between Jenks and Cape?'], [373, '20 miles'], [376, '30 miles'], [379, '120 miles'], [382, '180 miles']]),
  question(24,
    'The scale on a map is 1 inch : 30 miles. Colby is 2 inches from Trenton on the map. What is the actual distance between Colby and Trenton?',
    [], ['10 miles', '15 miles', '60 miles', '90 miles'],
    [[384, 'The scale on a map is 1 inch : 30 miles. Colby is 2 inches from Trenton on the map. What is the actual distance between Colby and Trenton?'], [343, '10 miles'], [390, '15 miles'], [393, '60 miles'], [396, '90 miles']]),
]);
const FALSE_EFFECTS = Object.freeze({currentJavaScriptRegistered: false,
  behaviorAccepted: false, visualFidelityAccepted: false,
  audioAccepted: false, humanVisualAccepted: false, ownerAccepted: false,
  strictComplete: false, released: false, published: false});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function projectPath(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}

async function binding(target, {absolute = false, json = false,
  readOnly = false} = {}) {
  const resolved = absolute ? path.resolve(target) : projectPath(target);
  const [canonical, before] = await Promise.all([
    realpath(resolved), lstat(resolved, {bigint: true}),
  ]);
  invariant(canonical === resolved && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n &&
    (!readOnly || (before.mode & 0o222n) === 0n),
  `${target} must be one canonical ordinary file`);
  const buffer = await readFile(resolved);
  const after = await lstat(resolved, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${target} changed during read`);
  return Object.freeze({path: absolute ? resolved : target,
    bytes: buffer.length, sha256: sha256(buffer), buffer,
    ...(json ? {value: JSON.parse(buffer.toString('utf8'))} : {})});
}

function descriptor(item) {
  return Object.freeze({path: item.path, bytes: item.bytes,
    sha256: item.sha256});
}

function normalized(buffer) {
  return buffer.toString('utf8').replace(/\r\n?/gu, '\n');
}

function canonicalSourceText(buffer) {
  return normalized(buffer)
    .replace(/\s*--- RECORDSEPARATOR ---\s*/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

async function exactSourceTexts(diagnosticRoot, specifications) {
  const expected = new Map();
  for (const specification of specifications) {
    const [textId, value] = Array.isArray(specification)
      ? specification
      : [specification.textId, specification.value];
    invariant(Number.isSafeInteger(textId) && textId > 0 &&
      typeof value === 'string' && value.length > 0,
    'source text specification is invalid');
    invariant(!expected.has(textId) || expected.get(textId) === value,
      `source text ${textId} has conflicting expectations`);
    expected.set(textId, value);
  }
  const results = [];
  for (const [textId, value] of [...expected].sort((a, b) => a[0] - b[0])) {
    const source = await binding(path.join(diagnosticRoot, 'export/texts',
      `${textId}.txt`), {absolute: true, readOnly: true});
    invariant(canonicalSourceText(source.buffer) === value,
      `source text ${textId} drifted`);
    results.push(Object.freeze({textId, value, ...descriptor(source)}));
  }
  return Object.freeze(results);
}

async function sourceRoot() {
  const requested = process.env[SOURCE_ENV];
  invariant(typeof requested === 'string' && requested.length > 0,
    `${SOURCE_ENV} is required`);
  const root = path.resolve(requested, 'G6-G8-shared');
  const [canonical, metadata] = await Promise.all([
    realpath(root), lstat(root, {bigint: true}),
  ]);
  invariant(canonical === root && metadata.isDirectory() &&
    !metadata.isSymbolicLink() && (metadata.mode & 0o222n) === 0n,
  'G6-G8-shared source root must be canonical and read-only');
  return root;
}

async function exactScript(root, relativePath) {
  return binding(path.join(root, relativePath), {absolute: true,
    readOnly: true});
}

function spriteFrameBody(xml, objectId, frame) {
  const sprite = xml.match(new RegExp(
    `<DefineSprite\\s+objectID="${objectId}"\\s+frames="[0-9]+">` +
    '([\\s\\S]*?)<\\/DefineSprite>', 'u'));
  invariant(sprite, `sprite ${objectId} missing`);
  const chunks = sprite[1].split('<ShowFrame/>');
  invariant(chunks.length > frame, `sprite ${objectId} frame ${frame} missing`);
  return chunks[frame - 1];
}

function matchingCards(xml, objectId, frame) {
  const body = spriteFrameBody(xml, objectId, frame);
  const cards = [...body.matchAll(
    /<PlaceObject2[^>]*objectID="(\d+)"[^>]*name="(Mc([1-6])_([12]))"/gu,
  )].map((match) => {
    const sourceCharacterId = Number(match[1]);
    const content = GS03_CARD_CONTENT[sourceCharacterId];
    invariant(content, `matching card ${sourceCharacterId} content missing`);
    return Object.freeze({id: `level-${frame === 2 ? 1 : 2}-` +
        `pair-${match[3]}-${match[4]}`,
      pairId: Number(match[3]), side: Number(match[4]), sourceCharacterId,
      sourceInstanceName: match[2], label: content.label,
      equivalenceKey: content.equivalenceKey,
      sourceTextIds: Object.freeze(content.sourceTexts.map(([textId]) =>
        textId))});
  });
  invariant(cards.length === 12 && new Set(cards.map((card) => card.id)).size ===
    12 && [1, 2, 3, 4, 5, 6].every((pairId) =>
      cards.filter((card) => card.pairId === pairId).length === 2 &&
      new Set(cards.filter((card) => card.pairId === pairId)
        .map((card) => card.equivalenceKey)).size === 1),
  `matching frame ${frame} card identity drifted`);
  return Object.freeze(cards.sort((left, right) =>
    left.pairId - right.pairId || left.side - right.side));
}

async function expectedArtifact() {
  const residualCheck = await auditG678AlgL09ResidualRouting({check: true});
  invariant(residualCheck.check === true,
    'residual routing audit check failed');
  const [residual, predecessor, builder, sharedRoot] = await Promise.all([
    binding(RESIDUAL, {json: true}), binding(PREDECESSOR, {json: true}),
    binding(path.relative(ROOT, SCRIPT_PATH)), sourceRoot(),
  ]);
  const members = IDS.map((id) => residual.value.members.find((member) =>
    member.animationId === id));
  invariant(members.every(Boolean) &&
    predecessor.value.registrationCandidatePlacementCount === 339 &&
    predecessor.value.selectedPages.length === 339 &&
    IDS.every((id) => !predecessor.value.selectedPages.some((page) =>
      page.animationId === id)),
  'exact-3 residual/predecessor membership drifted');

  const records = [];
  for (const member of members) {
    const diagnosticName = member.animationId.endsWith('p030')
      ? 'gs02' : member.animationId.endsWith('p031') ? 'gs03' : 'fq02';
    const diagnosticRoot = projectPath(
      `work/g678-shared-page-factory/g678-alg-l09-` +
      `${diagnosticName}-diagnostic-20260904`);
    const source = await binding(path.join(sharedRoot,
      member.source.path.replace(/^G6-G8-shared\//u, '')),
    {absolute: true, readOnly: true});
    invariant(source.bytes === member.source.bytes &&
      source.sha256 === member.source.sha256,
    `${member.animationId}: source drifted`);
    const xml = await binding(path.join(diagnosticRoot, 'source.xml'),
      {absolute: true, readOnly: true});
    invariant(xml.bytes === member.diagnosticEvidence.sourceXml.bytes &&
      xml.sha256 === member.diagnosticEvidence.sourceXml.sha256,
    `${member.animationId}: diagnostic XML drifted`);
    const xmlText = normalized(xml.buffer);
    if (member.animationId.endsWith('p030')) {
      const root = path.join(diagnosticRoot, 'export/scripts');
      const [level1, level2, start] = await Promise.all([
        exactScript(root,
          'DefineSprite_140/frame_748/PlaceObject2_132_55/CLIPACTIONRECORD on(release).as'),
        exactScript(root,
          'DefineSprite_140/frame_748/PlaceObject2_135_58/CLIPACTIONRECORD on(release).as'),
        exactScript(root,
          'DefineSprite_140/frame_748/PlaceObject2_139_62/CLIPACTIONRECORD on(release).as'),
      ]);
      invariant(normalized(level1.buffer).includes('_global.gameLevel1 = true;') &&
        normalized(level2.buffer).includes('_global.gameLevel2 = true;') &&
        normalized(start.buffer).includes(
          '_root.doNeedMoreHelp("L9GS03",1,6);'),
      'GS02 exact level/handoff scripts drifted');
      const directionSpecifications = Object.freeze([
        Object.freeze([19,
          'In the Level 1 game, match ratios that are written in different forms. In the Level 2 game, match ratios that are in proportion to each other.']),
        Object.freeze([20,
          'Click one box then find the next box that matches and click it.']),
        Object.freeze([25,
          'For each correct match you get 10 points added to your score. For each incorrect match 2 points are subtracted from your score. Correct answers will reveal a picture and music.']),
        Object.freeze([21,
          'When you are ready to play, choose a level and then click Start to begin the Ratio Match Game.']),
      ]);
      const contentTextEvidence = await exactSourceTexts(diagnosticRoot,
        directionSpecifications);
      records.push(Object.freeze({...member,
        exactBehavior: Object.freeze({levelCount: 2,
          targetAnimationId: 'shared-alg001-l09-p031',
          legacyTarget: 'L9GS03', sourceStopFrame: 748,
          sourceResumeFrame: 749,
          directions: Object.freeze(directionSpecifications.map(
            ([textId, text]) => Object.freeze({textId, text}))),
          contentTextEvidence,
          sourceVisibility: Object.freeze({
            maintainedSurfaceRequiredBecauseActionScriptIsNotExecuted: true,
          }),
          scripts: Object.freeze({level1: descriptor(level1),
            level2: descriptor(level2), start: descriptor(start)})})}));
      continue;
    }
    if (member.animationId.endsWith('p031')) {
      const root = path.join(diagnosticRoot, 'export/scripts');
      const releasePaths = [];
      for (const frame of [2, 4]) {
        const frameBody = spriteFrameBody(xmlText, 227, frame);
        for (const match of frameBody.matchAll(
          /<PlaceObject2[^>]*name="Mc[1-6]_[12]"[^>]*>/gu)) {
          const objectId = match[0].match(/objectID="(\d+)"/u)?.[1];
          const depth = match[0].match(/depth="(\d+)"/u)?.[1];
          invariant(objectId && depth,
            `GS03 frame ${frame} answer placement identity drifted`);
          releasePaths.push(`DefineSprite_227/frame_${frame}/` +
            `PlaceObject2_${objectId}_${depth}/` +
            'CLIPACTIONRECORD on(release).as');
        }
      }
      const releases = await Promise.all(releasePaths.map((relativePath) =>
        exactScript(root, relativePath)));
      const [frame1, frame2, frame4] = await Promise.all([1, 2, 4].map(
        (frame) => exactScript(root,
          `DefineSprite_227/frame_${frame}/DoAction.as`)));
      invariant(releases.length === 24 && releases.every((script) => {
        const text = normalized(script.buffer);
        return text.includes('_global.ansClickCount++;') &&
          text.includes('_global.score += 10;') &&
          text.includes('_global.score -= 2;');
      }) && [frame1, frame2, frame4].every((script) =>
        normalized(script.buffer).includes('Mc_Popup._visible = false;')),
      'GS03 exact answer/scoring/visibility scripts drifted');
      const level1Cards = matchingCards(xmlText, 227, 2);
      const level2Cards = matchingCards(xmlText, 227, 4);
      const contentTextEvidence = await exactSourceTexts(diagnosticRoot,
        Object.values(GS03_CARD_CONTENT).flatMap((item) =>
          item.sourceTexts));
      records.push(Object.freeze({...member,
        exactBehavior: Object.freeze({levelCount: 2, pairCountPerLevel: 6,
          answerReleaseCount: 24, correctScoreDelta: 10,
          wrongScoreDelta: -2,
          level1Cards, level2Cards, contentTextEvidence,
          sourceVisibility: Object.freeze({
            popupCharacterId: 26, hiddenByDefault: true,
            frameScripts: Object.freeze([frame1, frame2, frame4]
              .map(descriptor)),
            maintainedSurfaceRequiredBecauseActionScriptIsNotExecuted: true,
          }),
          releaseScripts: Object.freeze(releases.map(descriptor))})}));
      continue;
    }
    const main = await exactScript(path.join(diagnosticRoot, 'export/scripts'),
      'DefineSprite_855/frame_1/DoAction.as');
    const mainText = normalized(main.buffer);
    const answerMatch = mainText.match(/_global\.arrayAnswer = \[(.*?)\];/u);
    invariant(answerMatch &&
      mainText.includes('random(_global.quizLabelArray.length)') &&
      mainText.includes('_global.totalQuestionsCount = 10;') &&
      mainText.includes('function doGetReview()') &&
      mainText.includes('_root.setBookMark();') &&
      mainText.includes('getURL(strURL,"");') &&
      mainText.includes('Mc_Finish._visible = false;'),
    'FQ02 selection/review/legacy-host script drifted');
    const sourceAnswers = [...answerMatch[1].matchAll(
      /"A(\d+)Opt([1-4])"/gu)].map((match) => Object.freeze({
        questionNumber: Number(match[1]), correctOption: Number(match[2])}));
    invariant(sourceAnswers.length === 24 &&
      sourceAnswers.every((answer, index) =>
        answer.questionNumber === index + 1 &&
        answer.correctOption === ANSWER_KEY[index]),
    'FQ02 exact 24-item answer key drifted');
    const contentTextEvidence = await exactSourceTexts(diagnosticRoot,
      FQ02_QUESTIONS.flatMap((item) => item.sourceTexts));
    const questionBank = Object.freeze(FQ02_QUESTIONS.map((item) =>
      Object.freeze({questionNumber: item.questionNumber,
        prompt: item.prompt, supportingData: item.supportingData,
        choices: item.choices, correctOption: item.correctOption,
        sourceTextIds: Object.freeze(item.sourceTexts.map((entry) =>
          entry.textId))})));
    invariant(questionBank.length === 24 && questionBank.every((item, index) =>
      item.questionNumber === index + 1 &&
      item.correctOption === ANSWER_KEY[index] &&
      item.choices.length === (index >= 12 && index <= 19 ? 2 : 4) &&
      item.correctOption <= item.choices.length),
    'FQ02 question content/cardinality drifted');
    records.push(Object.freeze({...member,
      exactBehavior: Object.freeze({questionPoolSize: 24,
        presentedQuestionCount: 10, randomizedWithoutReplacement: true,
        answerKey: ANSWER_KEY, questionBank, contentTextEvidence,
        sourceVisibility: Object.freeze({finishCharacterId: 15,
          hiddenUntilTenResponses: true,
          maintainedSurfaceRequiredBecauseActionScriptIsNotExecuted: true}),
        responseReviewImplementedInSource: true,
        legacyBookmarkAndReportCallsBlocked: true,
        mainScript: descriptor(main)})}));
  }
  return Object.freeze({schemaVersion: 1,
    artifactType: 'g678-alg-l09-game-assessment-family-audit-v1',
    generatedAt: new Date().toISOString(),
    status: 'exact-3-game-assessment-behavior-routed-no-registration',
    inputs: Object.freeze({residualAudit: descriptor(residual),
      predecessor: descriptor(predecessor), builder: descriptor(builder)}),
    auditedPlacementCount: 3, authorizedPlacementIds: IDS,
    records: Object.freeze(records), registrationCandidatePlacementCount: 0,
    productCalibrationPassed: false,
    wholeLessonEngineeringPreviewReady: false,
    scaleOutAuthorized: false,
    blockers: Object.freeze([
      'game-assessment-current-js-generation-pending',
      'browser-product-calibration-pending',
      'game-feedback-and-narration-audio-acceptance-pending',
      'authoritative-original-runtime-not-established',
      'visual-fidelity-not-accepted',
    ]), acceptanceEffects: FALSE_EFFECTS});
}

export async function auditG678AlgL09GameAssessmentFamily({check = false} = {}) {
  const artifact = await expectedArtifact();
  const bytes = stableBytes(artifact);
  const target = projectPath(OUTPUT);
  let receipt = bytes;
  if (check) {
    const current = await binding(OUTPUT, {json: true});
    const expected = stableBytes({...artifact,
      generatedAt: current.value.generatedAt});
    invariant(current.buffer.equals(expected),
      'ALG L9 game/assessment family audit drifted');
    receipt = current.buffer;
  } else {
    const staging = `${target}.staging-${process.pid}`;
    await writeFile(staging, bytes, {flag: 'wx'});
    await rename(staging, target);
  }
  return Object.freeze({check, output: OUTPUT, bytes: receipt.length,
    sha256: sha256(receipt), auditedPlacementCount: 3,
    registrationCandidatePlacementCount: 0,
    productCalibrationPassed: false, acceptanceEffects: FALSE_EFFECTS});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: audit-g678-alg-l09-game-assessment-family.mjs [--check]');
  auditG678AlgL09GameAssessmentFamily({check: args[0] === '--check'})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
