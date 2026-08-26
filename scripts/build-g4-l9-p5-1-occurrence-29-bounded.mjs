#!/usr/bin/env node

import {execFile as execFileCallback} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

const execFile = promisify(execFileCallback);
const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), '..');

export const TASK_ID =
  'HELP-MATH-G4-L9-P5-1-OCCURRENCE-29-BOUNDED-IMPLEMENTATION-20260824';
export const CALIBRATION_ID = 'g4-l9-p5-1-occurrence-29-bounded-v1';
export const RELEASE_ID = 'private-g4-l9-p5-1-occurrence-29-bounded-v1';
export const DESCRIPTOR_ID = 'g4-l9-p5-1-private-page-only-product-bridge-v1';
export const FREEZE_PATH =
  'catalog/g4-l9-p5-1-occurrence-29-bounded-freeze-v1.json';
export const GENERATED_WEB_PATH =
  'apps/web/lib/g4-l9-p5-1-occurrence-29-bounded.generated.ts';
export const ANIMATION_ID = 'course-g04-l09-ti-004';
export const PLACEMENT_ID = 'g04-l09-placement-029';
export const SOURCE_OCCURRENCE = 29;
export const EXPECTED_CORE_ACTION_MULTISET_SHA256 =
  '7c00b70187fffbb82726f74f2514ececbd530034120d6095efdba4729c544996';
export const EXPECTED_SOURCE_CLOSURE_SHA256 =
  '094037293057a37c6b479131096e8008636545f471e97c3be169193a6505ece9';
export const EXPECTED_RANDOM_ACTION_SHA256 =
  '35d1483d2e70fdaf3a4f73ab44fa89ccf9a867f02b23d9fee13950bd38756662';
export const EXPECTED_TERMINAL_ACTION_SHA256 =
  '8a2021341dfb52c1a619176e3c2a415f27e1e32d26816da29e250bca292ab9be';

const PREFLIGHT_PATH = 'catalog/g4-l9-page-only-migration-preflight-v1.json';
const EXPECTED_PREFLIGHT_SHA256 =
  '7a6e018b65e9df4dd523d775a9bf7e079644eed083e1e1781e4a41763a3ae2f4';
const P4_FREEZE_PATH = 'catalog/g4-l9-p4-representative-slice-freeze-v1.json';
const EXPECTED_P4_FREEZE_SHA256 =
  '72f9d7af89d689378772a8d259085e10800a88b0f8c5914c8398d61902074ace';
const P5_FREEZE_PATH = 'catalog/g4-l9-p5-f08-occurrence-32-stress-freeze-v1.json';
const EXPECTED_P5_FREEZE_SHA256 =
  '6b2bfffae4aedf30cea8fa5ec8bcd2e376a057a61b7cfd4af7ef7b0bf5e7d377';
const P5_GENERATOR_PATH = 'scripts/build-g4-l9-p5-f08-occurrence-32-stress.mjs';
const EXPECTED_P5_GENERATOR_SHA256 =
  '0753300f7fd9e46052ff6202c407efe14f7f60b5de8b359c1aa07311a5907978';
const CANDIDATE_ROOT =
  'apps/web/candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1';
const AUDIO_COPY_PATH =
  `${CANDIDATE_ROOT}/courses/${ANIMATION_ID}/audio/source-narration-undetermined.mp3`;
const CANVAS_PATH = `${CANDIDATE_ROOT}/courses/${ANIMATION_ID}/canvas-renderer.js`;
const TIMELINE_PATH = `packages/demos/src/timelines/${ANIMATION_ID}.ts`;
const MIGRATION_ROOT = `migrations/${ANIMATION_ID}`;
const BROWSER_RECEIPT_PATH =
  'reports/g4-l9-p5-1-occurrence-29-browser-qa-receipt-v1.json';
const CURRENTNESS_RECEIPT_PATH =
  'reports/current-js-candidate-assets-currentness-successor-2026-08-24-v4.json';
export const SUCCESSOR_LEDGER_PATH =
  'reports/g4-l9-p5-1-remaining-28-ledger-successor-receipt-v1.json';
export const IMPLEMENTATION_RECEIPT_JSON_PATH =
  'reports/g4-l9-p5-1-occurrence-29-implementation-receipt-v1.json';
export const IMPLEMENTATION_RECEIPT_MD_PATH =
  'reports/g4-l9-p5-1-occurrence-29-implementation-receipt-v1.md';

const SOURCE_CLOSURE = Object.freeze([
  Object.freeze({
    path: 'HELP_COURSES/ELMGR4/L9/index.xml',
    bytes: 9736,
    sha256: 'd1d3bdba357f66e252d6201b00cffeed409ea4505233595cedf1f5bfd10722b4',
  }),
  Object.freeze({
    path: 'HELP_COURSES/ELMGR4/L9/SA/L9TI04.mp3',
    bytes: 135744,
    sha256: '52fe9807f186b5c50ae485bc1d818551290c59204df7d0dda3783b61321d4810',
  }),
  Object.freeze({
    path: 'HELP_COURSES/ELMGR4/L9/TI/L9TI04.swf',
    bytes: 85562,
    sha256: 'aab74a30241e71013cee75fa7e6224fd3e09acc7ca097f713c681b2dd6bec8eb',
  }),
  Object.freeze({
    path: 'HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml',
    bytes: 378783,
    sha256: 'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
  }),
  Object.freeze({
    path: 'HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml',
    bytes: 374466,
    sha256: '7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00',
  }),
]);

export const EXPECTED_GLOSSARY_HANDLER_INTENTS = Object.freeze([
  'Equation',
  'Mathematical aentence',
  'Show',
  'Expression',
  'Equal',
  'Expression',
  'Equation',
  'Equal',
  'Expression',
  'Sentence',
  'Equation',
  'Show',
]);

export const EXPECTED_DRAG_BINDINGS = Object.freeze([
  Object.freeze({sourceInstance: 'Scr1', outcome: 'incorrect'}),
  Object.freeze({sourceInstance: 'Scr2', outcome: 'correct'}),
  Object.freeze({sourceInstance: 'Scr3', outcome: 'correct'}),
  Object.freeze({sourceInstance: 'Scr4', outcome: 'correct'}),
  Object.freeze({sourceInstance: 'Scr5', outcome: 'correct'}),
  Object.freeze({sourceInstance: 'Scr6', outcome: 'incorrect'}),
]);

export const EXPECTED_HOST_SYMBOLS = Object.freeze([
  '_global.KeyAttribute',
  '_global.quizDragCount',
  '_global.quizSection',
  '_global.rndAudio',
  '_global.WrongFeed',
  '_level0.InternalPreloader',
  '_parent.ButtonAns',
  '_parent.ButtonDown',
  '_parent.ButtonNew',
  '_parent.ButtonUp',
  '_parent.Coach_audio_2',
  '_parent.disableButton',
  '_parent.enableButton',
  '_parent.NMH_HT',
  '_parent.NMHBtn',
  '_parent.play',
  '_parent.RightFeed',
  '_parent.WrongFeed',
  '_root.animation_mc',
  '_root.DoHyperLinks',
]);

const ACTION_PROJECTION_PYTHON = String.raw`
import hashlib, json, subprocess, sys, xml.etree.ElementTree as ET

def canon(element):
    attributes = ''.join(f' {key}={value!r}' for key, value in sorted(element.attrib.items()))
    text = (element.text or '').strip()
    children = ''.join(canon(child) for child in list(element))
    return '<' + element.tag + attributes + '>' + text + children + '</' + element.tag + '>'

def inspect(source):
    xml = subprocess.check_output(['swfmill', '-n', 'swf2xml', source])
    root = ET.fromstring(xml)
    rows = []
    def walk(element, stack):
        next_stack = stack + [(element.tag, dict(element.attrib))]
        if element.tag == 'actions':
            values = [node.attrib['value'] for node in element.iter() if 'value' in node.attrib]
            tags = [node.tag for node in element.iter()]
            context = []
            for tag, attributes in stack[-8:]:
                selected = []
                for key in ('objectID', 'depth', 'name', 'pointerReleaseInside', 'pointerPush', 'pointerReleaseOutside'):
                    if key in attributes and attributes[key] not in ('0', ''):
                        selected.append(key + '=' + attributes[key])
                context.append(tag + (('[' + ','.join(selected) + ']') if selected else ''))
            rows.append({
                'sha256': hashlib.sha256(canon(element).encode('utf-8')).hexdigest(),
                'values': values,
                'tags': tags,
                'context': '/'.join(context),
            })
            return
        for child in list(element):
            walk(child, next_stack)
    walk(root, [])
    core = sorted(row['sha256'] for row in rows if 'DoHyperLinks' not in row['values'])
    projection = ''.join(value + '\0' for value in core).encode('ascii')
    return {
        'actionCount': len(rows),
        'glossaryActionCount': sum(1 for row in rows if 'DoHyperLinks' in row['values']),
        'coreActionCount': len(core),
        'coreActionHashes': core,
        'coreActionProjectionBytes': len(projection),
        'coreActionMultisetSha256': hashlib.sha256(projection).hexdigest(),
        'rows': rows,
    }

print(json.dumps(inspect(sys.argv[1]), ensure_ascii=False, separators=(',', ':')))
`;

let sourceAnalysisCache;

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function csv(value) {
  const text = String(value ?? '');
  return /[",\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function slug(value) {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '');
}

function decodeXmlText(value) {
  return value
    .replaceAll(/<br\s*\/?>/giu, ' ')
    .replaceAll(/<[^>]+>/gu, ' ')
    .replaceAll('&nbsp;', '\u00a0')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
    .replaceAll(/&#(\d+);/gu, (_, number) => String.fromCodePoint(Number(number)))
    .replaceAll(/&#x([0-9a-f]+);/giu, (_, number) => String.fromCodePoint(Number.parseInt(number, 16)))
    .replaceAll(/\s+/gu, ' ')
    .trim();
}

function keyTermEntry(xmlText, sourceKeyAttribute) {
  const marker = `ScreenkeyTerm="${sourceKeyAttribute}"`;
  const matches = xmlText.replace(/^\uFEFF/u, '').split(/\r?\n/gu)
    .filter((line) => line.includes(marker));
  invariant(matches.length === 1,
    `${sourceKeyAttribute}: expected one exact ScreenkeyTerm row, observed ${matches.length}`);
  const line = matches[0];
  const tagMatch = line.match(/^\s*<([^\s>]+)/u);
  invariant(tagMatch, `${sourceKeyAttribute}: source glossary tag is missing`);
  const openEnd = line.indexOf('>');
  const closeStart = line.lastIndexOf('</');
  invariant(openEnd > 0 && closeStart > openEnd,
    `${sourceKeyAttribute}: source glossary body is malformed`);
  const definitions = line.slice(openEnd + 1, closeStart).split('~LNG~');
  invariant(definitions.length === 2,
    `${sourceKeyAttribute}: expected exact EN/ES glossary definitions`);
  const labelParts = tagMatch[1].split('~LNG~');
  invariant(labelParts.length === 2,
    `${sourceKeyAttribute}: expected exact EN/ES source labels`);
  return Object.freeze({
    sourceKeyAttribute,
    labels: Object.freeze({
      en: decodeXmlText(labelParts[0].replaceAll('~', ' ')),
      es: decodeXmlText(labelParts[1].replaceAll('~', ' ')),
    }),
    definitions: Object.freeze({
      en: decodeXmlText(definitions[0]),
      es: decodeXmlText(definitions[1]),
    }),
  });
}

async function inspectActions(sourceAbsolute) {
  const {stdout} = await execFile(
    'python3',
    ['-c', ACTION_PROJECTION_PYTHON, sourceAbsolute],
    {cwd: repositoryRoot, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024},
  );
  return JSON.parse(stdout);
}

function sourceProjection(rows) {
  return Buffer.concat(rows
    .toSorted((left, right) => compareText(left.path, right.path))
    .flatMap((row) => [
      Buffer.from(row.path),
      Buffer.from([0]),
      Buffer.from(String(row.bytes)),
      Buffer.from([0]),
      Buffer.from(row.sha256),
      Buffer.from([0]),
    ]));
}

async function verifySourceClosure(sourceRoot) {
  const rows = [];
  for (const expected of SOURCE_CLOSURE) {
    const absolute = path.join(sourceRoot, expected.path);
    const [bytes, information] = await Promise.all([readFile(absolute), stat(absolute)]);
    invariant(bytes.length === expected.bytes,
      `${expected.path}: expected ${expected.bytes} bytes, observed ${bytes.length}`);
    invariant(sha256(bytes) === expected.sha256,
      `${expected.path}: exact source SHA-256 drifted`);
    invariant((information.mode & 0o222) === 0,
      `${expected.path}: canonical source became writable`);
    rows.push(Object.freeze({
      ...expected,
      mode: (information.mode & 0o777).toString(8).padStart(4, '0'),
      writable: false,
    }));
  }
  const projection = sourceProjection(rows);
  invariant(rows.reduce((total, row) => total + row.bytes, 0) === 984_291,
    'exact five-file source closure byte count drifted');
  invariant(projection.length === 552,
    `exact source closure projection expected 552 bytes, observed ${projection.length}`);
  invariant(sha256(projection) === EXPECTED_SOURCE_CLOSURE_SHA256,
    'exact source closure projection SHA-256 drifted');
  const pairedFla = path.join(sourceRoot, 'HELP_COURSES/ELMGR4/L9/TI/L9TI04.fla');
  invariant(await lstat(pairedFla).catch((error) => {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }) === null, 'TI004 unexpectedly acquired a same-path FLA');
  return Object.freeze({
    files: Object.freeze(rows),
    fileCount: rows.length,
    totalBytes: rows.reduce((total, row) => total + row.bytes, 0),
    projection: Object.freeze({
      serialization:
        'C-locale relative-path NUL decimal-bytes NUL lowercase-sha256 NUL v1',
      bytes: projection.length,
      sha256: sha256(projection),
    }),
  });
}

function deriveGlossary(actions, sourceDocuments) {
  const sourceIntents = actions.rows
    .filter((row) => row.values.includes('DoHyperLinks'))
    .map((row) => row.values[2]);
  invariant(JSON.stringify(sourceIntents) === JSON.stringify(EXPECTED_GLOSSARY_HANDLER_INTENTS),
    'TI004 exact glossary handler intent sequence drifted');
  const handlers = sourceIntents.map((sourceIntent, handlerIndex) => {
    const resolvedKeyAttribute = sourceIntent === 'Mathematical aentence'
      ? 'Sentence'
      : sourceIntent;
    return Object.freeze({
      handlerIndex: handlerIndex + 1,
      sourceIntent,
      resolvedKeyAttribute,
      entryId: slug(resolvedKeyAttribute),
      resolution: sourceIntent === resolvedKeyAttribute
        ? 'exact-screen-key-term'
        : 'explicit-source-bound-alias',
    });
  });
  const uniqueResolved = [...new Set(handlers.map((handler) => handler.resolvedKeyAttribute))];
  invariant(uniqueResolved.length === 5,
    `TI004 expected five resolved glossary entries, observed ${uniqueResolved.length}`);
  const entries = uniqueResolved.map((sourceKeyAttribute) => {
    const english = keyTermEntry(sourceDocuments.en, sourceKeyAttribute);
    const spanish = keyTermEntry(sourceDocuments.es, sourceKeyAttribute);
    invariant(JSON.stringify(english) === JSON.stringify(spanish),
      `${sourceKeyAttribute}: EN/ES key-term source files disagree after exact normalization`);
    return Object.freeze({
      id: slug(sourceKeyAttribute),
      ...english,
      source: Object.freeze({
        en: Object.freeze({
          assetId: 'ELKTEG4.xml',
          path: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml',
          sha256: SOURCE_CLOSURE[3].sha256,
        }),
        es: Object.freeze({
          assetId: 'ELKTSG4.xml',
          path: 'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml',
          sha256: SOURCE_CLOSURE[4].sha256,
        }),
      }),
    });
  });
  return Object.freeze({handlers: Object.freeze(handlers), entries: Object.freeze(entries)});
}

function deriveDragBindings(actions) {
  const bindings = actions.rows
    .filter((row) => row.tags.includes('StopDrag') && /name=Scr_\d+/u.test(row.context))
    .map((row) => {
      const sourceName = row.context.match(/name=(Scr_\d+)/u)?.[1];
      invariant(sourceName, 'TI004 drag handler lost its exact source instance');
      return Object.freeze({
        sourceInstance: sourceName.replace('_', ''),
        outcome: row.values.includes('_droptarget') ? 'correct' : 'incorrect',
        actionSha256: row.sha256,
      });
    })
    .toSorted((left, right) => compareText(left.sourceInstance, right.sourceInstance));
  invariant(bindings.length === 6, `TI004 expected six drag handlers, observed ${bindings.length}`);
  invariant(
    JSON.stringify(bindings.map(({sourceInstance, outcome}) => ({sourceInstance, outcome}))) ===
      JSON.stringify(EXPECTED_DRAG_BINDINGS),
    'TI004 exact drag outcome binding drifted',
  );
  return Object.freeze(bindings);
}

async function inspectAudio(sourceAbsolute) {
  const [{stdout}, decode] = await Promise.all([
    execFile('ffprobe', [
      '-v', 'error',
      '-show_entries', 'stream=sample_rate,channels:format=duration',
      '-of', 'json',
      sourceAbsolute,
    ], {cwd: repositoryRoot, encoding: 'utf8'}),
    execFile('ffmpeg', ['-v', 'error', '-i', sourceAbsolute, '-f', 'null', '-'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
    }),
  ]);
  invariant(decode.stderr === '', 'TI004 exact source MP3 full decode emitted an error');
  const probe = JSON.parse(stdout);
  const stream = probe.streams?.[0];
  const durationMs = Math.round(Number(probe.format?.duration) * 1000);
  invariant(durationMs === 9_696,
    `TI004 exact source audio expected 9696 ms, observed ${durationMs} ms`);
  invariant(Number(stream?.sample_rate) === 48_000 && stream?.channels === 1,
    'TI004 exact source audio stream identity drifted');
  return Object.freeze({
    durationMs,
    sampleRateHz: 48_000,
    channels: 1,
    fullDecode: 'pass',
    listeningAcceptance: 'not-established',
  });
}

async function analyzeSource(sourceRoot) {
  const resolvedRoot = path.resolve(sourceRoot);
  if (sourceAnalysisCache?.sourceRoot === resolvedRoot) return sourceAnalysisCache.promise;
  const promise = (async () => {
    const [
      preflightBytes,
      p4FreezeBytes,
      p5FreezeBytes,
      p5GeneratorBytes,
      closure,
      pythonVersion,
      swfmillVersion,
    ] =
      await Promise.all([
        readFile(path.join(repositoryRoot, PREFLIGHT_PATH)),
        readFile(path.join(repositoryRoot, P4_FREEZE_PATH)),
        readFile(path.join(repositoryRoot, P5_FREEZE_PATH)),
        readFile(path.join(repositoryRoot, P5_GENERATOR_PATH)),
        verifySourceClosure(resolvedRoot),
        execFile('python3', ['--version'], {encoding: 'utf8'}),
        execFile('swfmill', ['--version'], {encoding: 'utf8'}),
      ]);
    invariant(sha256(preflightBytes) === EXPECTED_PREFLIGHT_SHA256,
      'P3 preflight anchor drifted');
    invariant(sha256(p4FreezeBytes) === EXPECTED_P4_FREEZE_SHA256,
      'P4 freeze anchor drifted');
    invariant(sha256(p5FreezeBytes) === EXPECTED_P5_FREEZE_SHA256,
      'immutable P5 freeze anchor drifted');
    invariant(sha256(p5GeneratorBytes) === EXPECTED_P5_GENERATOR_SHA256,
      'immutable P5 generator anchor drifted');
    const preflight = JSON.parse(preflightBytes.toString('utf8'));
    const page29 = preflight.occurrences.find((page) => page.sourceOccurrence === 29);
    invariant(
      preflight.occurrences.length === 43 &&
      preflight.identityHashes.canonicalRowProjectionSha256 ===
        '313e6e9b9fb30facd55ecddf74eb039ab8cdb4595f7bd7b145dda67a4f1aa0db' &&
      preflight.implementationLanes.counts.factory === 27 &&
      preflight.implementationLanes.counts['advanced-manual'] === 16,
      'P3 43-row projection or lane counts drifted',
    );
    invariant(
      page29?.animationId === ANIMATION_ID &&
      page29.placementId === PLACEMENT_ID &&
      page29.assetId === `swf-${SOURCE_CLOSURE[2].sha256}` &&
      page29.source.swfPath === SOURCE_CLOSURE[2].path &&
      page29.source.swfBytes === SOURCE_CLOSURE[2].bytes &&
      page29.source.pairedFla === null &&
      page29.planning.familyId === 'F08' &&
      page29.planning.complexity === 'behavior-heavy' &&
      page29.planning.implementationLane === 'advanced-manual',
      'TI004 frozen occurrence identity or lane drifted',
    );
    const audit = page29.staticAudit;
    invariant(
      audit.header.stage.width === 800 && audit.header.stage.height === 600 &&
      audit.header.fps === 12 && audit.header.rootFrameCount === 10 &&
      audit.timelines.nestedDefinitions === 23 &&
      audit.timelines.staticallyRootReachableDefinitions === 18 &&
      audit.timelines.staticallyUnreachableDefinitions === 5 &&
      audit.timelines.longestStaticallyRootReachableDomain.domainId === 'sprite-134' &&
      audit.timelines.longestStaticallyRootReachableDomain.declaredFrameCount === 119 &&
      audit.tags.buttons === 18 && audit.presentationFeatures.maskPlacements === 4 &&
      audit.scripts.exportedScriptFileCount === 54 &&
      audit.scripts.normalizedBytes === 6973 &&
      audit.pcode.bytes === 20017 &&
      audit.pcode.manifestSha256 ===
        '6ac1db7ead042cca33321dedb8e259362adab6ab18d2110cbbce0149ee525a63',
      'TI004 static source contract drifted',
    );
    invariant(
      JSON.stringify(audit.scripts.hostMemberCandidates) ===
        JSON.stringify(EXPECTED_HOST_SYMBOLS) &&
      audit.scripts.externalApiCandidates.length === 0,
      'TI004 exact 20-symbol or zero-external-API contract drifted',
    );

    const [actions29, sourceAudio, enGlossaryBytes, esGlossaryBytes, indexBytes] =
      await Promise.all([
        inspectActions(path.join(resolvedRoot, page29.source.swfPath)),
        inspectAudio(path.join(resolvedRoot, SOURCE_CLOSURE[1].path)),
        readFile(path.join(resolvedRoot, SOURCE_CLOSURE[3].path)),
        readFile(path.join(resolvedRoot, SOURCE_CLOSURE[4].path)),
        readFile(path.join(resolvedRoot, SOURCE_CLOSURE[0].path)),
      ]);
    invariant(
      actions29.actionCount === 54 && actions29.glossaryActionCount === 12 &&
      actions29.coreActionCount === 42 &&
      actions29.coreActionProjectionBytes === 2730 &&
      actions29.coreActionMultisetSha256 === EXPECTED_CORE_ACTION_MULTISET_SHA256,
      'TI004 exact action/core projection drifted',
    );
    const randomActions = actions29.rows.filter((row) =>
      row.tags.includes('Random') && row.values.includes('rndAudio')
    );
    const terminalActions = actions29.rows.filter((row) =>
      row.values.includes('quizDragCount') &&
      row.values.includes('RightFeed') &&
      row.values.includes('4')
    );
    invariant(
      randomActions.length === 1 &&
      randomActions[0].sha256 === EXPECTED_RANDOM_ACTION_SHA256 &&
      ['S1', 'S2', 'S3', 'S4'].every((choice) =>
        randomActions[0].values.includes(choice)
      ) &&
      terminalActions.length === 1 &&
      terminalActions[0].sha256 === EXPECTED_TERMINAL_ACTION_SHA256,
      'TI004 random-cycle or four-correct terminal action drifted',
    );
    const activeIndexXml = indexBytes.toString('utf8').replace(
      /<!--[\s\S]*?-->/gu,
      '',
    );
    const sourceSwfs = [...activeIndexXml.matchAll(
      /<Page\b[^>]*>([^<]+)<\/Page>/gu,
    )].map((match) => match[1].trim());
    invariant(
      sourceSwfs.length === 43 && sourceSwfs[28] === 'TI/L9TI04.swf',
      'course XML occurrence-29 placement drifted',
    );
    const glossary = deriveGlossary(actions29, {
      en: enGlossaryBytes.toString('utf8'),
      es: esGlossaryBytes.toString('utf8'),
    });
    const dragBindings = deriveDragBindings(actions29);
    return Object.freeze({
      sourceRoot: resolvedRoot,
      preflight: Object.freeze({bytes: preflightBytes, document: preflight, page29}),
      p4Freeze: Object.freeze({bytes: p4FreezeBytes, document: JSON.parse(p4FreezeBytes)}),
      p5Freeze: Object.freeze({bytes: p5FreezeBytes, document: JSON.parse(p5FreezeBytes)}),
      p5Generator: Object.freeze({bytes: p5GeneratorBytes}),
      closure,
      actions29,
      sourceAudio,
      glossary,
      dragBindings,
      randomActionSha256: randomActions[0].sha256,
      terminalActionSha256: terminalActions[0].sha256,
      coreComparisons: Object.freeze({
        occurrence20: Object.freeze({count: 37, bytes: 2405,
          sha256: 'abeddee3400740d5a99edee706d59790730ba90f7104babb0313d72cb5e3e8f5'}),
        occurrence30: Object.freeze({count: 44, bytes: 2860,
          sha256: 'c3188e59250e977dee0638de3ce00e8dc50850649e036e3d7018d0cc0b448e57'}),
        occurrence32: Object.freeze({count: 44, bytes: 2860,
          sha256: 'c3188e59250e977dee0638de3ce00e8dc50850649e036e3d7018d0cc0b448e57'}),
      }),
      toolchain: Object.freeze({
        python: (pythonVersion.stdout || pythonVersion.stderr).trim(),
        swfmill: (swfmillVersion.stdout || swfmillVersion.stderr).trim(),
        canonicalActionSerialization:
          "recursive ElementTree subtree: '<tag' + sorted(' key='+repr(value)) + '>' + stripped text + canonical children + '</tag>'",
        actionDigest: 'lowercase SHA-256 of UTF-8 canonical action subtree',
        coreSelection: "exclude an action when any descendant value attribute equals 'DoHyperLinks'",
        multisetProjection:
          'sort 64-character lowercase action hashes by byte order, append one NUL after every hash, SHA-256 the complete projection',
      }),
    });
  })();
  sourceAnalysisCache = {sourceRoot: resolvedRoot, promise};
  return promise;
}

function pageConfig(analysis) {
  const page = analysis.preflight.page29;
  const timeline = page.staticAudit.timelines.longestStaticallyRootReachableDomain;
  return Object.freeze({
    animationId: ANIMATION_ID,
    placementId: PLACEMENT_ID,
    sourceOccurrence: SOURCE_OCCURRENCE,
    sectionCode: 'TI',
    pageTitle: 'Question 3',
    sourceSwfPath: SOURCE_CLOSURE[2].path,
    sourceSwfSha256: SOURCE_CLOSURE[2].sha256,
    sourceSwfBytes: SOURCE_CLOSURE[2].bytes,
    lane: 'advanced-manual',
    complexityLane: 'behavior-heavy',
    behavior: 'drag-model',
    frameDomain: timeline.domainId,
    frameCount: timeline.declaredFrameCount,
    rootFrameCount: page.staticAudit.header.rootFrameCount,
    fps: page.staticAudit.header.fps,
    questionCount: 4,
    expectedOptionOffset: SOURCE_OCCURRENCE,
    audio: Object.freeze({
      sourcePath: SOURCE_CLOSURE[1].path,
      sourceSha256: SOURCE_CLOSURE[1].sha256,
      candidatePath: `/flash-assets/courses/${ANIMATION_ID}/audio/source-narration-undetermined.mp3`,
      spokenLanguage: 'undetermined',
      durationMs: analysis.sourceAudio.durationMs,
    }),
    dragBindings: analysis.dragBindings.map(({sourceInstance, outcome}) =>
      Object.freeze({sourceInstance, outcome})),
    glossaryHandlers: analysis.glossary.handlers,
    hostContractSymbols: EXPECTED_HOST_SYMBOLS,
    randomCycle: Object.freeze({
      adapter: 'rndAudio-source-array-seeded-cycle-v1',
      sourceChoices: Object.freeze(['S1', 'S2', 'S3', 'S4']),
      actionSha256: analysis.randomActionSha256,
      terminalActionSha256: analysis.terminalActionSha256,
      terminalCorrectCount: 4,
    }),
    scenarioId: 'p5-1-occurrence-29-bounded',
    scenarioLabel: 'P5.1 bounded occurrence-29 source random-cycle behavior',
    legacyNetworkPolicy: 'deny-by-default',
    f08ScaleOut: false,
  });
}

function timelineSource(config) {
  return [
    '/* Generated by scripts/build-g4-l9-p5-1-occurrence-29-bounded.mjs. Do not edit. */',
    "import type {G4L9P4PageConfig} from '../g4-l9-p4-state-machines';",
    '',
    `export const COURSE_G04_L09_TI_004_CONFIG: G4L9P4PageConfig = Object.freeze(${JSON.stringify(config, null, 2)} as const);`,
    '',
  ].join('\n');
}

function canvasSource(config) {
  return `/* Generated by scripts/build-g4-l9-p5-1-occurrence-29-bounded.mjs. Do not edit. */
(() => {
  'use strict';
  const animationId = ${JSON.stringify(config.animationId)};
  const asset = Object.freeze({
    ready: () => Promise.resolve(),
    render(canvas, request) {
      const context = canvas.getContext('2d');
      if (!context) throw new Error('2D Canvas is required');
      const frame = Math.max(1, Math.min(${config.frameCount}, Number(request.frame) || 1));
      const seed = Number.isSafeInteger(request.seed) ? request.seed : 0;
      context.clearRect(0, 0, 800, 600);
      context.fillStyle = ['#e6f7ff', '#e6f8ef', '#fff3d6'][Math.abs(seed + 29) % 3];
      context.fillRect(0, 0, 800, 600);
      context.strokeStyle = '#164d77';
      context.lineWidth = 6;
      context.beginPath();
      context.moveTo(92, 350);
      context.lineTo(708, 350);
      context.stroke();
      const outcomes = ${JSON.stringify(config.dragBindings.map((item) => item.outcome))};
      for (let index = 0; index < outcomes.length; index += 1) {
        const height = 48 + (Math.abs(seed + index * 29 + frame) % 92);
        context.fillStyle = outcomes[index] === 'correct' ? '#087ea4' : '#ef8f17';
        context.fillRect(112 + index * 96, 350 - height, 62, height);
        context.fillStyle = '#17324d';
        context.font = '700 16px system-ui, sans-serif';
        context.fillText('Scr' + (index + 1), 122 + index * 96, 378);
      }
      context.fillStyle = '#17324d';
      context.font = '700 28px system-ui, sans-serif';
      context.fillText('TI · Question 3', 52, 66);
      context.font = '600 18px system-ui, sans-serif';
      context.fillText('Occurrence 29 · source choices S1 / S2 / S3 / S4', 52, 102);
      context.fillText('Four unique correct placements reach the terminal state', 52, 130);
      context.fillText('Frame ' + frame + ' / ${config.frameCount}', 52, 540);
      canvas.dataset.flashFrame = String(frame);
      canvas.dataset.flashFrameDomain = ${JSON.stringify(config.frameDomain)};
      canvas.dataset.networkCalls = '0';
      canvas.dataset.originalRuntimeValidated = 'false';
      canvas.dataset.p51BoundedOccurrence = '29';
      return Object.freeze({animationId, frame, networkCalls: 0});
    },
  });
  window.HELP_MATH_CANVAS_ASSETS = window.HELP_MATH_CANVAS_ASSETS || {};
  window.HELP_MATH_CANVAS_ASSETS[animationId] = asset;
})();
`;
}

function freezeDocument(analysis) {
  const page = analysis.preflight.page29;
  return {
    schemaVersion: 1,
    artifactKind: 'private-page-only-occurrence-29-bounded-freeze',
    taskId: TASK_ID,
    calibrationId: CALIBRATION_ID,
    base: {
      ref: 'codex/help-math-g4-l9-p5-f08-occurrence-32-stress-gate-20260823',
      commit: 'af33bcecff686dc49e143a698f56fd5e938ff498',
      parent: 'fb7dc21e4ecb9d625cd96eb7822a1bce89c9e076',
      tree: '5f9931d699c5cfe1cfa58fce8c280d79021bd2f1',
    },
    sourceArtifact: {path: PREFLIGHT_PATH, sha256: EXPECTED_PREFLIGHT_SHA256},
    p4Calibration: {
      calibrationId: analysis.p4Freeze.document.calibrationId,
      freeze: {path: P4_FREEZE_PATH, sha256: EXPECTED_P4_FREEZE_SHA256},
      registeredPageCount: 14,
      immutable: true,
    },
    p5Calibration: {
      calibrationId: analysis.p5Freeze.document.calibrationId,
      freeze: {path: P5_FREEZE_PATH, sha256: EXPECTED_P5_FREEZE_SHA256},
      generator: {path: P5_GENERATOR_PATH, sha256: EXPECTED_P5_GENERATOR_SHA256},
      registeredPageCount: 15,
      immutable: true,
    },
    selectedPages: [{
      sourceOccurrence: SOURCE_OCCURRENCE,
      placementId: PLACEMENT_ID,
      animationId: ANIMATION_ID,
      assetId: page.assetId,
      sourceSwfPath: page.source.swfPath,
      sourceSwfSha256: page.source.swfSha256,
      sourceSwfBytes: page.source.swfBytes,
      pairedFla: null,
      canonicalIdentity: 'unique-not-an-alias',
      complexityLane: 'behavior-heavy',
      implementationLane: 'advanced-manual',
    }],
    exactSourceClosure: analysis.closure,
    boundedImplementationContract: {
      frameDomain: 'sprite-134',
      frameCount: 119,
      randomActionSha256: analysis.randomActionSha256,
      terminalActionSha256: analysis.terminalActionSha256,
      sourceChoices: ['S1', 'S2', 'S3', 'S4'],
      terminalCorrectCount: 4,
      coreActionMultisetSha256: EXPECTED_CORE_ACTION_MULTISET_SHA256,
      dragBindings: EXPECTED_DRAG_BINDINGS,
      glossaryHandlerCount: 12,
      resolvedGlossaryEntryCount: 5,
      explicitAliases: {'Mathematical aentence': 'Sentence'},
      sourceAudioDurationMs: 9696,
      hostSymbolCount: 20,
      practiceFeedbackBranchIndex: 'one-based',
      replayHostReset: ['random-cycle', 'try-choice-state', 'drag-state',
        'active-audio', 'practice-feedback'],
      legacyNetworkPolicy: 'deny-by-default',
    },
    productBoundary: {
      descriptorKind: 'private-page-only-product-bridge',
      baselineRegisteredCurrentJs: 15,
      registeredCurrentJs: 16,
      descriptorPageCount: 43,
      unavailablePageCount: 27,
      courseShellCount: 0,
      factoryAdmitted: 5,
      advancedManualAdmitted: 11,
      remainingFactory: 22,
      remainingAdvancedManual: 5,
      formalRegistryMutation: false,
      formalCounts: {denominator: 1751, occurrences: 426, uniqueRenderers: 425, lessons: 8},
    },
    scaleOut: {
      exactEquivalenceAdmission: false,
      wholeLesson43Pages: false,
      familyF08: false,
      remainingF08Occurrences: [20],
      decision: 'NO_GO_F08_FAMILY_OR_43_PAGE_SCALE_OUT',
    },
    acceptanceEffects: {
      privateCurrentJsEngineering: true,
      authoritativeOriginalRuntime: false,
      technicalFidelity: false,
      audioAccepted: false,
      humanReview: false,
      ownerAcceptance: false,
      strictComplete: false,
      released: false,
      published: false,
      productionVerified: false,
    },
  };
}

function equivalenceAudit(analysis) {
  const actionSummary = (id, actions) => ({
    animationId: id,
    actionCount: actions.actionCount,
    glossaryActionCount: actions.glossaryActionCount,
    nonGlossaryCoreActionCount: actions.coreActionCount,
    projectionBytes: actions.coreActionProjectionBytes,
    multisetSha256: actions.coreActionMultisetSha256,
  });
  return {
    schemaVersion: 1,
    artifactKind: 'g4-l9-p5-1-occurrence-29-source-comparison',
    taskId: TASK_ID,
    conclusion:
      'occurrence-29-core-differs-from-occurrences-20-30-and-32',
    admission: 'not-exact-equivalence-admission',
    sourceClosure: analysis.closure,
    projectionDefinition: analysis.toolchain,
    coreActionProjection: {
      occurrence20: analysis.coreComparisons.occurrence20,
      occurrence29: actionSummary(ANIMATION_ID, analysis.actions29),
      occurrence30: analysis.coreComparisons.occurrence30,
      occurrence32: analysis.coreComparisons.occurrence32,
      exactSortedHashMultiset: analysis.actions29.coreActionHashes,
      differsFromAllComparators: true,
      occurrence29Sha256: EXPECTED_CORE_ACTION_MULTISET_SHA256,
    },
    randomCycle: {
      actionSha256: analysis.randomActionSha256,
      terminalActionSha256: analysis.terminalActionSha256,
      sourceChoices: ['S1', 'S2', 'S3', 'S4'],
      adapter: 'rndAudio-source-array-seeded-cycle-v1',
      actionScriptExecuted: false,
    },
    occurrenceSpecificDelta: {
      dragBindings: analysis.dragBindings,
      glossaryHandlers: analysis.glossary.handlers,
      sourceAudio: {
        path: SOURCE_CLOSURE[1].path,
        bytes: SOURCE_CLOSURE[1].bytes,
        sha256: SOURCE_CLOSURE[1].sha256,
        ...analysis.sourceAudio,
      },
      hostContractSymbols: EXPECTED_HOST_SYMBOLS,
      networkPermission: 'none',
    },
    modernHostIntegration: {
      practiceFeedbackBranchIndex: 'one-based-source-choice-index',
      terminalCorrectCount: 4,
      replayResetsRandomTryChoiceAndDragState: true,
      rendererReplayResetsActiveAudio: true,
      rendererReplayResetsPracticeFeedback: true,
      modernMyLessonReplayUsesRendererUnmountCleanup: true,
      finalQuizReplayRetainsResetFqScore: true,
    },
    evidenceBoundary: {
      actionScriptExecuted: false,
      originalRuntime: 'not-established',
      fidelity: 'not-established',
      audioListeningAcceptance: 'not-established',
      humanOwnerAcceptance: 'not-established',
      strictReleasePublicationProduction: 'not-established',
    },
  };
}

function generatedWebSource(config, analysis, freezeSha256) {
  const data = {
    schemaVersion: 1,
    taskId: TASK_ID,
    descriptorId: DESCRIPTOR_ID,
    calibrationId: CALIBRATION_ID,
    releaseId: RELEASE_ID,
    freeze: {path: FREEZE_PATH, sha256: freezeSha256},
    p4Calibration: {
      calibrationId: analysis.p4Freeze.document.calibrationId,
      freezePath: P4_FREEZE_PATH,
      freezeSha256: EXPECTED_P4_FREEZE_SHA256,
      registeredPageCount: 14,
    },
    p5Calibration: {
      calibrationId: analysis.p5Freeze.document.calibrationId,
      freezePath: P5_FREEZE_PATH,
      freezeSha256: EXPECTED_P5_FREEZE_SHA256,
      registeredPageCount: 15,
    },
    page: {
      sourceOccurrence: config.sourceOccurrence,
      placementId: config.placementId,
      animationId: config.animationId,
      assetId: analysis.preflight.page29.assetId,
      sourceSwfPath: config.sourceSwfPath,
      sourceSwfSha256: config.sourceSwfSha256,
      sourceSwfBytes: config.sourceSwfBytes,
      frameDomain: config.frameDomain,
      frameCount: config.frameCount,
      complexityLane: config.complexityLane,
      implementationLane: config.lane,
      behavior: config.behavior,
      scenario: config.scenarioId,
      registered: true,
    },
    glossary: analysis.glossary,
    productBoundary: {
      activePageCount: 43,
      registeredPageCount: 16,
      unavailablePageCount: 27,
      courseShellCount: 0,
      formalCounts: {denominator: 1751, occurrences: 426, uniqueRenderers: 425, lessons: 8},
    },
    scaleOut: {familyF08: false, wholeLesson43Pages: false},
    modernHostIntegration: {
      randomCycleAdapter: config.randomCycle.adapter,
      terminalCorrectCount: config.randomCycle.terminalCorrectCount,
      practiceFeedbackBranchIndex: 'one-based-source-choice',
      replayResetsRandomTryChoiceAndDragState: true,
      replayResetsActiveAudio: true,
      replayResetsPracticeFeedbackOrFqScore: true,
    },
  };
  return [
    '/* Generated by scripts/build-g4-l9-p5-1-occurrence-29-bounded.mjs. Do not edit. */',
    `export const G4_L9_P5_1_OCCURRENCE_29_BOUNDED = Object.freeze(${JSON.stringify(data, null, 2)} as const);`,
    '',
  ].join('\n');
}

function successorLedger(analysis) {
  const p4Occurrences = new Set(
    analysis.p4Freeze.document.selectedPages.map(({sourceOccurrence}) =>
      sourceOccurrence
    ),
  );
  const rows = analysis.preflight.document.occurrences.map((page) => {
    const admittedBy = p4Occurrences.has(page.sourceOccurrence)
      ? analysis.p4Freeze.document.calibrationId
      : page.sourceOccurrence === 32
        ? analysis.p5Freeze.document.calibrationId
        : page.sourceOccurrence === SOURCE_OCCURRENCE
          ? CALIBRATION_ID
          : null;
    return Object.freeze({
      sourceOccurrence: page.sourceOccurrence,
      placementId: page.placementId,
      animationId: page.animationId,
      implementationLane: page.planning.implementationLane,
      admitted: admittedBy !== null,
      admittedBy,
    });
  });
  invariant(rows.length === 43, 'successor ledger must preserve all 43 rows');
  const remaining = rows.filter(({admitted}) => !admitted);
  invariant(
    rows.filter(({admitted}) => admitted).length === 16 &&
    remaining.length === 27 &&
    remaining.filter(({implementationLane}) => implementationLane === 'factory').length === 22 &&
    remaining.filter(({implementationLane}) => implementationLane === 'advanced-manual').length === 5,
    'corrected private or remaining lane counts drifted',
  );
  return {
    schemaVersion: 1,
    artifactKind: 'g4-l9-p5-1-remaining-ledger-successor-correction',
    taskId: TASK_ID,
    immutableHistoryRewritten: false,
    anchors: {
      p3: {path: PREFLIGHT_PATH, sha256: EXPECTED_PREFLIGHT_SHA256},
      p4: {path: P4_FREEZE_PATH, sha256: EXPECTED_P4_FREEZE_SHA256},
      p5: {path: P5_FREEZE_PATH, sha256: EXPECTED_P5_FREEZE_SHA256},
      p5Generator: {path: P5_GENERATOR_PATH, sha256: EXPECTED_P5_GENERATOR_SHA256},
    },
    sourceOrdered43RowProjection: {
      definition: 'P3 canonical row projection',
      count: 43,
      sha256:
        analysis.preflight.document.identityHashes.canonicalRowProjectionSha256,
    },
    correction: {
      staleP5Field: 'productBoundary.remainingAdvancedManual',
      staleP5Value: 7,
      reason:
        'The immutable P5 artifact carried the P4 remaining advanced-manual count and did not subtract admitted occurrence 32.',
      correctedAfterP5: 6,
      successfulP51Semantics: {
        factoryAdmitted: 5,
        factoryRemaining: 22,
        advancedManualAdmitted: 11,
        advancedManualRemaining: 5,
        privateRegistered: 16,
        privateUnavailable: 27,
        formal: {denominator: 1751, occurrences: 426, uniqueRenderers: 425, lessons: 8},
      },
    },
    rows,
    scaleOut: {
      p3DecisionPreserved: 'NO_GO_SCALE_OUT',
      p5DecisionPreserved: 'NO_GO_F08_FAMILY_OR_43_PAGE_SCALE_OUT',
      familyF08: false,
      wholeLesson43Pages: false,
      nextP6Authorized: false,
    },
  };
}

function workspaceArtifacts(config, analysis, canvasBytes) {
  const audit = equivalenceAudit(analysis);
  const assets = [
    ['source-swf', config.sourceSwfPath, config.sourceSwfBytes, config.sourceSwfSha256, 'canonical-read-only-swf-only'],
    ['candidate-canvas', CANVAS_PATH, canvasBytes.length, sha256(canvasBytes), 'generated-bounded-engineering-candidate'],
  ];
  return new Map([
    [`${MIGRATION_ROOT}/ACCEPTANCE_CHECKLIST.md`, `# ${ANIMATION_ID} P5.1 bounded implementation checklist

- [x] Exact occurrence 29 identity and five-file source closure bound
- [x] 42-action non-glossary core projected and shown distinct from occurrences 20, 30, and 32
- [x] Six exact drag outcomes and 12-to-5 glossary mapping frozen
- [x] Exact 9,696 ms source-audio machine metadata and deny-by-default network boundary
- [x] Deterministic S1-S4 rndAudio cycle, try/choice state, four-correct terminal state, and Replay reset
- [x] One-based source-choice practice branches and complete practice/audio host reset on renderer and My Lesson Replay
- [ ] Original Flash runtime behavior validated
- [ ] Technical and visual fidelity accepted
- [ ] Audio listening and synchronization accepted
- [ ] Human and Owner acceptance
- [ ] Strict completion, formal release, publication, and production verification
- [ ] F08-family or 43-page scale-out
`],
    [`${MIGRATION_ROOT}/MIGRATION_BRIEF.md`, `# ${ANIMATION_ID}

P5.1 admits only G4 L9 source occurrence 29 through a bounded advanced-manual implementation. TI004 keeps its own 42-action core, S1-S4 source random cycle, six source-instance drag outcomes, four-unique-correct terminal condition, 12 source glossary handlers, exact audio identity, calibration, registry module, and Replay reset. It does not clone TI007/doGetRndQuest behavior. This is private Current-JS engineering integration only; it is not exact-equivalence admission, original-runtime parity, fidelity or audio acceptance, human or Owner acceptance, strict completion, formal release, publication, production verification, F08-family scale-out, or 43-page scale-out.
`],
    [`${MIGRATION_ROOT}/asset-inventory.csv`, `${['kind','path','bytes','sha256','status'].join(',')}\n${assets.map((row) => row.map(csv).join(',')).join('\n')}\n`],
    [`${MIGRATION_ROOT}/audio-inventory.csv`, `${['id','source_path','candidate_path','bytes','sha256','duration_ms','sample_rate_hz','channels','spoken_language','decode','listening_status'].join(',')}\n${[
      'source-narration-undetermined', config.audio.sourcePath, AUDIO_COPY_PATH,
      SOURCE_CLOSURE[1].bytes, config.audio.sourceSha256, config.audio.durationMs,
      48000, 1, 'undetermined', 'full-decode-pass', 'not-listened-not-accepted',
    ].map(csv).join(',')}\n`],
    [`${MIGRATION_ROOT}/audit/p5-1-occurrence-29-source-comparison.json`, stableJson(audit)],
    [`${MIGRATION_ROOT}/evidence/full-frame-coverage.json`, stableJson({
      schemaVersion: 1,
      animationId: ANIMATION_ID,
      structuralFrameDomain: config.frameDomain,
      declaredFrameCount: config.frameCount,
      generatedAddressableFrames: [1, config.frameCount],
      sourceBoundStructuralDomainOnly: true,
      naturalOriginalRuntimeTraceCoverage: 'not-established',
      authoritativeOriginalRuntime: false,
      strictAcceptanceEffect: 'none',
    })],
    [`${MIGRATION_ROOT}/evidence/implementation/p5-1-private-product-integration.json`, stableJson({
      schemaVersion: 1,
      taskId: TASK_ID,
      animationId: ANIMATION_ID,
      placementId: PLACEMENT_ID,
      sourceOccurrence: SOURCE_OCCURRENCE,
      calibrationId: CALIBRATION_ID,
      integration: 'private-page-only-product-bridge',
      modernHost: 'modern-my-lesson-page-only-v1',
      implementationLane: 'advanced-manual',
      randomCycleAdapter: config.randomCycle.adapter,
      sourceChoices: config.randomCycle.sourceChoices,
      terminalCorrectCount: config.randomCycle.terminalCorrectCount,
      replay: 'deterministic-full-maintained-state-reset',
      practiceFeedbackBranchIndex: 'one-based-source-choice',
      replayHostReset: 'random-try-choice-drag-audio-and-practice-feedback',
      exactSourceAudioDurationMs: config.audio.durationMs,
      networkCalls: 0,
      legacyNetworkPolicy: 'deny-by-default',
      currentJsEngineering: true,
      exactEquivalenceAdmission: false,
      originalRuntime: false,
      fidelityAccepted: false,
      audioAccepted: false,
      humanOwnerAccepted: false,
      strictComplete: false,
      formalRelease: false,
      published: false,
      productionVerified: false,
      f08FamilyScaleOut: false,
      wholeLessonScaleOut: false,
    })],
    [`${MIGRATION_ROOT}/keyframes.csv`, `frame_domain,frame,role,evidence_status\n${config.frameDomain},1,entry,generated-structural-current-js\n${config.frameDomain},${config.frameCount},source-terminal-domain-end,generated-structural-current-js\n`],
    [`${MIGRATION_ROOT}/migration.json`, stableJson({
      schemaVersion: 2,
      animationId: ANIMATION_ID,
      status: 'implemented-unverified',
      implementationLane: 'advanced-manual',
      source: {
        path: config.sourceSwfPath,
        sha256: config.sourceSwfSha256,
        bytes: config.sourceSwfBytes,
        pairedFla: null,
        canonicalIdentity: 'unique-not-an-alias',
      },
      productIntegration: {
        kind: 'private-page-only-product-bridge',
        descriptorId: DESCRIPTOR_ID,
        calibrationId: CALIBRATION_ID,
        placementId: PLACEMENT_ID,
        sourceOccurrence: SOURCE_OCCURRENCE,
        registeredCurrentJsAfterAcceptance: 16,
        unavailableAfterAcceptance: 27,
        courseShellCount: 0,
      },
      boundaries: {
        exactEquivalenceAdmission: false,
        originalRuntime: 'not-established',
        fidelity: 'not-established',
        audio: 'not-established-not-listened',
        humanReview: 'not-established',
        ownerAcceptance: 'not-established',
        strictComplete: false,
        formalRelease: false,
        publication: false,
        productionVerification: false,
        f08FamilyScaleOut: false,
        wholeLessonScaleOut: false,
      },
    })],
    [SUCCESSOR_LEDGER_PATH, stableJson(successorLedger(analysis))],
  ]);
}

export async function buildGeneratedArtifacts({sourceRoot} = {}) {
  invariant(typeof sourceRoot === 'string' && sourceRoot.length > 0,
    'sourceRoot is required for the exact P5.1 source-bound generator');
  const analysis = await analyzeSource(sourceRoot);
  const config = pageConfig(analysis);
  const freeze = stableJson(freezeDocument(analysis));
  const canvas = canvasSource(config);
  const artifacts = new Map([
    [FREEZE_PATH, freeze],
    [GENERATED_WEB_PATH, generatedWebSource(config, analysis, sha256(freeze))],
    [TIMELINE_PATH, timelineSource(config)],
    [CANVAS_PATH, canvas],
    ...workspaceArtifacts(config, analysis, Buffer.from(canvas)),
  ]);
  invariant(artifacts.size === 14,
    `P5.1 generator must own exactly 14 core text artifacts, observed ${artifacts.size}`);
  return Object.freeze({
    analysis,
    artifacts,
    audioCopy: Object.freeze({
      path: AUDIO_COPY_PATH,
      sourcePath: path.join(path.resolve(sourceRoot), config.audio.sourcePath),
      bytes: SOURCE_CLOSURE[1].bytes,
      sha256: SOURCE_CLOSURE[1].sha256,
    }),
    config,
  });
}

async function materialize(built, mode) {
  const mismatches = [];
  for (const [relative, content] of built.artifacts) {
    const target = path.join(repositoryRoot, relative);
    const expected = Buffer.from(content);
    if (mode === 'write') {
      await mkdir(path.dirname(target), {recursive: true});
      await writeFile(target, expected);
    } else {
      const observed = await readFile(target).catch(() => null);
      if (!observed?.equals(expected)) mismatches.push(relative);
    }
  }
  const sourceAudio = await readFile(built.audioCopy.sourcePath);
  invariant(sourceAudio.length === built.audioCopy.bytes &&
    sha256(sourceAudio) === built.audioCopy.sha256,
  'TI004 source audio changed after source analysis');
  const audioTarget = path.join(repositoryRoot, built.audioCopy.path);
  if (mode === 'write') {
    await mkdir(path.dirname(audioTarget), {recursive: true});
    await writeFile(audioTarget, sourceAudio);
  } else {
    const observed = await readFile(audioTarget).catch(() => null);
    if (!observed?.equals(sourceAudio)) mismatches.push(built.audioCopy.path);
  }
  if (mismatches.length > 0) {
    throw new Error(`Generated P5 artifacts are stale:\n${mismatches.sort(compareText).join('\n')}`);
  }
}

async function fileBinding(relative) {
  const bytes = await readFile(path.join(repositoryRoot, relative));
  return Object.freeze({path: relative, bytes: bytes.length, sha256: sha256(bytes)});
}

async function buildFinalReceipts(built) {
  const [
    browserReceipt,
    currentnessReceipt,
    privateRegistry,
    generatedRegistry,
    generator,
    freeze,
    successor,
  ] = await Promise.all([
    fileBinding(BROWSER_RECEIPT_PATH),
    fileBinding(CURRENTNESS_RECEIPT_PATH),
    fileBinding('packages/demos/private-current-js-registry.json'),
    fileBinding('packages/demos/src/registry.generated.ts'),
    fileBinding('scripts/build-g4-l9-p5-1-occurrence-29-bounded.mjs'),
    fileBinding(FREEZE_PATH),
    fileBinding(SUCCESSOR_LEDGER_PATH),
  ]);
  const browser = JSON.parse(await readFile(
    path.join(repositoryRoot, BROWSER_RECEIPT_PATH),
    'utf8',
  ));
  invariant(
    browser?.taskId === TASK_ID && browser?.result === 'PASS' &&
    browser?.captures?.length === 2 &&
    browser.captures.every((capture) =>
      capture.consoleErrors === 0 && capture.pageErrors === 0 &&
      capture.failedRequests === 0 && capture.forbiddenRequests === 0
    ),
    'browser QA receipt is not a two-capture zero-error PASS',
  );
  const currentness = JSON.parse(await readFile(
    path.join(repositoryRoot, CURRENTNESS_RECEIPT_PATH),
    'utf8',
  ));
  invariant(
    currentness?.artifactType ===
      'current-js-candidate-assets-currentness-successor-receipt-v4' &&
    currentness?.p51Occurrence29?.animationId === ANIMATION_ID &&
    currentness?.p51Occurrence29?.registeredPageCountAfterP51 === 16 &&
    currentness?.result?.productionReleaseExpanded === false,
    'candidate currentness successor receipt drifted',
  );
  const generatedBindings = [];
  for (const relative of built.artifacts.keys()) {
    generatedBindings.push(await fileBinding(relative));
  }
  generatedBindings.push(await fileBinding(built.audioCopy.path));
  generatedBindings.sort((left, right) => compareText(left.path, right.path));
  const receipt = {
    schemaVersion: 1,
    artifactKind: 'g4-l9-p5-1-occurrence-29-bounded-implementation-receipt',
    taskId: TASK_ID,
    taskTitle: 'HELP Math G4 L9 P5.1 - Occurrence 29 Bounded Implementation',
    result: 'READY_FOR_INDEPENDENT_PHASE_B_CONTROLLER_REVIEW',
    workerSelfAcceptance: false,
    base: {
      ref: 'codex/help-math-g4-l9-p5-f08-occurrence-32-stress-gate-20260823',
      commit: 'af33bcecff686dc49e143a698f56fd5e938ff498',
      parent: 'fb7dc21e4ecb9d625cd96eb7822a1bce89c9e076',
      tree: '5f9931d699c5cfe1cfa58fce8c280d79021bd2f1',
    },
    identity: {
      sourceOccurrence: 29,
      catalogOccurrenceOrdinal: 1011,
      placementId: PLACEMENT_ID,
      animationId: ANIMATION_ID,
      assetId: `swf-${SOURCE_CLOSURE[2].sha256}`,
      sourceSwfSha256: SOURCE_CLOSURE[2].sha256,
      pairedFla: null,
    },
    sourceClosure: built.analysis.closure,
    behavior: {
      coreActionCount: 42,
      coreActionProjectionBytes: 2730,
      coreActionSha256: EXPECTED_CORE_ACTION_MULTISET_SHA256,
      differsFromOccurrences: [20, 30, 32],
      glossaryHandlers: 12,
      normalizedGlossaryTerms: 5,
      explicitAlias: {'Mathematical aentence': 'Sentence'},
      dragBindings: EXPECTED_DRAG_BINDINGS,
      randomCycleAdapter: built.config.randomCycle.adapter,
      sourceChoices: built.config.randomCycle.sourceChoices,
      terminalCorrectCount: 4,
      replayCompleteReset: true,
      networkPolicy: 'deny-by-default',
    },
    generatedBindings,
    maintainedBindings: {
      privateRegistry,
      generatedRegistry,
      generator,
      freeze,
      successor,
      currentnessReceipt,
      browserReceipt,
    },
    verification: {
      generatorWriteModeRuns: 1,
      consecutiveGeneratorChecksAfterWrite: 2,
      generatorTest: 'PASS',
      p3P4P5GeneratorChecksAndTests: 'PASS_EXCEPT_DOCUMENTED_INHERITED_P5_ENOENT',
      occurrence32BehaviorRegression: 'PASS',
      l11PrivateProductBridgeRegression: 'PASS',
      descriptorProfilePrivateRegistryTests: 'PASS',
      sourceVerifier: 'PASS',
      formalVerifier: 'PASS_1751_426_425_8_SCHEMA2_SHELL0',
      demosTypecheck: 'PASS',
      webTypecheck: 'PASS',
      build: 'PASS',
      browserQa: 'PASS_TWO_REAL_MODERN_MY_LESSON_CAPTURES_ZERO_ERRORS',
      immutableP5Projection: 'PASS_COUNT25_NUL1698_SHA256_E63FA515032067299EFBBe54F1C572E51EC4C1D1768F462BAD578FBDD2914C70'.toLowerCase(),
      inheritedFailClosed: [
        'P5 focused closure ENOENT from absent repo-local source symlink; explicit canonical source closure and other P5 assertions pass',
        'ledger:page-only:check frozen P1 generated-registry pin mismatch',
        'verify:workbench completion ledger stale: 285 recorded versus expected 300 after this workspace',
      ],
    },
    counts: {
      privateBefore: {registered: 15, unavailable: 28},
      privateAfter: {registered: 16, unavailable: 27},
      lanesAfter: {factoryAdmitted: 5, factoryRemaining: 22,
        advancedManualAdmitted: 11, advancedManualRemaining: 5},
      formalUnchanged: {denominator: 1751, occurrences: 426,
        uniqueRenderers: 425, lessons: 8, schemaVersion: 2, courseShellCount: 0},
      strictComplete: 0,
    },
    authorityNotExercised: {
      originalRuntimeAcceptance: true,
      fidelityAcceptance: true,
      audioListeningAcceptance: true,
      humanOwnerAcceptance: true,
      strictCompletion: true,
      formalRelease: true,
      publication: true,
      deployment: true,
      productionMutation: true,
      p6: true,
    },
    commitIdentityDisposition:
      'The final commit, tree, parent, branch, and changed-path projection are recorded after commit in the worker handoff and independent controller receipt, never self-referentially here.',
    nextSingleTask: 'Independent P5.1 Phase-B controller review only',
  };
  const markdown = `# G4 L9 P5.1 occurrence 29 bounded implementation receipt\n\n` +
    `Result: **READY FOR INDEPENDENT PHASE-B CONTROLLER REVIEW**. This worker does not self-accept the implementation.\n\n` +
    `Occurrence 29 (\`${ANIMATION_ID}\`) is privately registered in the retained modern My Lesson host. The exact five-file source closure passed; the 42-action core is distinct from occurrences 20, 30, and 32; the S1-S4 deterministic random cycle, six drag outcomes, 12-to-5 glossary mapping, four-correct terminal state, Replay reset, host navigation, audio lifecycle, and deny-by-default network boundary were exercised.\n\n` +
    `Private G4 L9 changes from 15/28 to 16/27 registered/unavailable. Corrected lanes are factory 5/22 and advanced-manual 11/5. Formal status remains 1,751 / 426 / 425 / 8, schema 2, shell 0; strict complete remains 0.\n\n` +
    `No original-runtime, fidelity, listening/audio, human, Owner, strict-completion, release, publication, deployment, production, family-scale-out, lesson-scale-out, or P6 authority was exercised.\n\n` +
    `The final commit identity is intentionally not embedded in a file that belongs to that commit; it is reported after commit in the handoff.\n`;
  return new Map([
    [IMPLEMENTATION_RECEIPT_JSON_PATH, stableJson(receipt)],
    [IMPLEMENTATION_RECEIPT_MD_PATH, markdown],
  ]);
}

async function materializeFinalReceipts(built, mode) {
  const receipts = await buildFinalReceipts(built);
  const mismatches = [];
  for (const [relative, content] of receipts) {
    const target = path.join(repositoryRoot, relative);
    const expected = Buffer.from(content);
    if (mode === 'write') {
      await mkdir(path.dirname(target), {recursive: true});
      await writeFile(target, expected);
    } else {
      const observed = await readFile(target).catch(() => null);
      if (!observed?.equals(expected)) mismatches.push(relative);
    }
  }
  if (mismatches.length > 0) {
    throw new Error(`Generated P5.1 final receipts are stale:\n${mismatches.join('\n')}`);
  }
}

function parseArguments(argv) {
  let mode = 'check';
  let sourceRoot;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--write') mode = 'write';
    else if (value === '--check') mode = 'check';
    else if (value === '--finalize-receipts') mode = 'finalize-receipts';
    else if (value === '--check-final-receipts') mode = 'check-final-receipts';
    else if (value === '--source-root') {
      sourceRoot = argv[index + 1];
      invariant(sourceRoot, '--source-root requires a value');
      index += 1;
    } else throw new Error(`Unknown argument: ${value}`);
  }
  invariant(sourceRoot, '--source-root is required');
  return {mode, sourceRoot};
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const built = await buildGeneratedArtifacts({sourceRoot: options.sourceRoot});
  if (options.mode === 'finalize-receipts') {
    await materializeFinalReceipts(built, 'write');
  } else if (options.mode === 'check-final-receipts') {
    await materializeFinalReceipts(built, 'check');
  } else {
    await materialize(built, options.mode);
  }
  process.stdout.write(
    `G4 L9 P5.1 ${options.mode} PASS: ${built.artifacts.size} core text artifacts + 1 exact audio asset\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
