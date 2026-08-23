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
  'HELP-MATH-G4-L9-P5-F08-OCCURRENCE-32-STRESS-GATE-20260823';
export const CALIBRATION_ID = 'g4-l9-p5-f08-occurrence-32-stress-v1';
export const RELEASE_ID = 'private-g4-l9-p5-f08-occurrence-32-stress-v1';
export const DESCRIPTOR_ID = 'g4-l9-p5-private-page-only-product-bridge-v1';
export const FREEZE_PATH =
  'catalog/g4-l9-p5-f08-occurrence-32-stress-freeze-v1.json';
export const GENERATED_WEB_PATH =
  'apps/web/lib/g4-l9-p5-f08-occurrence-32-stress.generated.ts';
export const ANIMATION_ID = 'course-g04-l09-ti-007';
export const PLACEMENT_ID = 'g04-l09-placement-032';
export const SOURCE_OCCURRENCE = 32;
export const EXPECTED_CORE_ACTION_MULTISET_SHA256 =
  'c3188e59250e977dee0638de3ce00e8dc50850649e036e3d7018d0cc0b448e57';
export const EXPECTED_SOURCE_CLOSURE_SHA256 =
  '020e7f49fe0d9b9663690051472bc9d130f1ec9df0caacc71e4c9ecfab227a65';

const PREFLIGHT_PATH = 'catalog/g4-l9-page-only-migration-preflight-v1.json';
const EXPECTED_PREFLIGHT_SHA256 =
  '7a6e018b65e9df4dd523d775a9bf7e079644eed083e1e1781e4a41763a3ae2f4';
const P4_FREEZE_PATH = 'catalog/g4-l9-p4-representative-slice-freeze-v1.json';
const EXPECTED_P4_FREEZE_SHA256 =
  '72f9d7af89d689378772a8d259085e10800a88b0f8c5914c8398d61902074ace';
const CANDIDATE_ROOT =
  'apps/web/candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1';
const AUDIO_COPY_PATH =
  `${CANDIDATE_ROOT}/courses/${ANIMATION_ID}/audio/source-narration-undetermined.mp3`;
const CANVAS_PATH = `${CANDIDATE_ROOT}/courses/${ANIMATION_ID}/canvas-renderer.js`;
const TIMELINE_PATH = `packages/demos/src/timelines/${ANIMATION_ID}.ts`;
const MIGRATION_ROOT = `migrations/${ANIMATION_ID}`;

const SOURCE_CLOSURE = Object.freeze([
  Object.freeze({
    path: 'HELP_COURSES/ELMGR4/L9/index.xml',
    bytes: 9736,
    sha256: 'd1d3bdba357f66e252d6201b00cffeed409ea4505233595cedf1f5bfd10722b4',
  }),
  Object.freeze({
    path: 'HELP_COURSES/ELMGR4/L9/SA/L9TI07.mp3',
    bytes: 303072,
    sha256: '2f5e5d447f2659acec7a67ce8cc4ced1875ce99f5a9385227b1ec4ee0fab4d8c',
  }),
  Object.freeze({
    path: 'HELP_COURSES/ELMGR4/L9/TI/L9TI07.swf',
    bytes: 119871,
    sha256: '469e14b63de51729334d56c1f51aba732968113b2630ab5b05e702fdc1979c25',
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
  'Inverse operations',
  'Solve',
  'Equation',
  'Value',
  'Unknown',
  'Solution',
  'Column',
  'Addition',
  'Multiplication',
  'Subtraction',
  'Division',
  'Perform',
  'Equation',
  'Inverse operations',
]);

export const EXPECTED_DRAG_BINDINGS = Object.freeze([
  Object.freeze({sourceInstance: 'Scr1', outcome: 'correct'}),
  Object.freeze({sourceInstance: 'Scr2', outcome: 'correct'}),
  Object.freeze({sourceInstance: 'Scr3', outcome: 'correct'}),
  Object.freeze({sourceInstance: 'Scr4', outcome: 'incorrect'}),
  Object.freeze({sourceInstance: 'Scr5', outcome: 'incorrect'}),
  Object.freeze({sourceInstance: 'Scr6', outcome: 'correct'}),
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
  '_parent.doGetRndQuest',
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
  invariant(rows.reduce((total, row) => total + row.bytes, 0) === 1_185_928,
    'exact five-file source closure byte count drifted');
  invariant(projection.length === 553,
    `exact source closure projection expected 553 bytes, observed ${projection.length}`);
  invariant(sha256(projection) === EXPECTED_SOURCE_CLOSURE_SHA256,
    'exact source closure projection SHA-256 drifted');
  const pairedFla = path.join(sourceRoot, 'HELP_COURSES/ELMGR4/L9/TI/L9TI07.fla');
  invariant(await lstat(pairedFla).catch((error) => {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }) === null, 'TI007 unexpectedly acquired a same-path FLA');
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
    'TI007 exact glossary handler intent sequence drifted');
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
  invariant(uniqueResolved.length === 16,
    `TI007 expected 16 resolved glossary entries, observed ${uniqueResolved.length}`);
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
      invariant(sourceName, 'TI007 drag handler lost its exact source instance');
      return Object.freeze({
        sourceInstance: sourceName.replace('_', ''),
        outcome: row.values.includes('_droptarget') ? 'correct' : 'incorrect',
        actionSha256: row.sha256,
      });
    })
    .toSorted((left, right) => compareText(left.sourceInstance, right.sourceInstance));
  invariant(bindings.length === 6, `TI007 expected six drag handlers, observed ${bindings.length}`);
  invariant(
    JSON.stringify(bindings.map(({sourceInstance, outcome}) => ({sourceInstance, outcome}))) ===
      JSON.stringify(EXPECTED_DRAG_BINDINGS),
    'TI007 exact drag outcome binding drifted',
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
  invariant(decode.stderr === '', 'TI007 exact source MP3 full decode emitted an error');
  const probe = JSON.parse(stdout);
  const stream = probe.streams?.[0];
  const durationMs = Math.round(Number(probe.format?.duration) * 1000);
  invariant(durationMs === 21_648,
    `TI007 exact source audio expected 21648 ms, observed ${durationMs} ms`);
  invariant(Number(stream?.sample_rate) === 48_000 && stream?.channels === 1,
    'TI007 exact source audio stream identity drifted');
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
    const [preflightBytes, p4FreezeBytes, closure, pythonVersion, swfmillVersion] =
      await Promise.all([
        readFile(path.join(repositoryRoot, PREFLIGHT_PATH)),
        readFile(path.join(repositoryRoot, P4_FREEZE_PATH)),
        verifySourceClosure(resolvedRoot),
        execFile('python3', ['--version'], {encoding: 'utf8'}),
        execFile('swfmill', ['--version'], {encoding: 'utf8'}),
      ]);
    invariant(sha256(preflightBytes) === EXPECTED_PREFLIGHT_SHA256,
      'P3 preflight anchor drifted');
    invariant(sha256(p4FreezeBytes) === EXPECTED_P4_FREEZE_SHA256,
      'P4 freeze anchor drifted');
    const preflight = JSON.parse(preflightBytes.toString('utf8'));
    const page30 = preflight.occurrences.find((page) => page.sourceOccurrence === 30);
    const page32 = preflight.occurrences.find((page) => page.sourceOccurrence === 32);
    invariant(page30?.animationId === 'course-g04-l09-ti-005',
      'P4 F08 representative occurrence identity drifted');
    invariant(
      page32?.animationId === ANIMATION_ID &&
      page32.placementId === PLACEMENT_ID &&
      page32.assetId === `swf-${SOURCE_CLOSURE[2].sha256}` &&
      page32.source.swfPath === SOURCE_CLOSURE[2].path &&
      page32.source.swfBytes === SOURCE_CLOSURE[2].bytes &&
      page32.source.pairedFla === null &&
      page32.planning.familyId === 'F08' &&
      page32.planning.implementationLane === 'advanced-manual',
      'TI007 frozen occurrence identity or lane drifted',
    );
    invariant(
      JSON.stringify(page30.staticAudit.scripts.hostMemberCandidates) ===
        JSON.stringify(EXPECTED_HOST_SYMBOLS) &&
      JSON.stringify(page32.staticAudit.scripts.hostMemberCandidates) ===
        JSON.stringify(EXPECTED_HOST_SYMBOLS),
      'TI005/TI007 exact 21-symbol host contract drifted',
    );

    const [actions30, actions32, sourceAudio, enGlossaryBytes, esGlossaryBytes] =
      await Promise.all([
        inspectActions(path.join(resolvedRoot, page30.source.swfPath)),
        inspectActions(path.join(resolvedRoot, page32.source.swfPath)),
        inspectAudio(path.join(resolvedRoot, SOURCE_CLOSURE[1].path)),
        readFile(path.join(resolvedRoot, SOURCE_CLOSURE[3].path)),
        readFile(path.join(resolvedRoot, SOURCE_CLOSURE[4].path)),
      ]);
    for (const [id, actions, expectedCount] of [
      ['TI005', actions30, 55],
      ['TI007', actions32, 63],
    ]) {
      invariant(actions.actionCount === expectedCount,
        `${id} exact action count drifted`);
      invariant(actions.coreActionCount === 44,
        `${id} expected 44 non-glossary core actions`);
      invariant(actions.coreActionProjectionBytes === 2860,
        `${id} core action multiset projection byte count drifted`);
      invariant(actions.coreActionMultisetSha256 === EXPECTED_CORE_ACTION_MULTISET_SHA256,
        `${id} core action multiset SHA-256 drifted`);
    }
    invariant(JSON.stringify(actions30.coreActionHashes) === JSON.stringify(actions32.coreActionHashes),
      'TI005/TI007 non-glossary core action multisets are no longer identical');
    invariant(actions30.glossaryActionCount === 11 && actions32.glossaryActionCount === 19,
      'TI005/TI007 exact glossary action counts drifted');
    const doGetRndQuest30 = actions30.rows.filter((row) => row.values.includes('doGetRndQuest'));
    const doGetRndQuest32 = actions32.rows.filter((row) => row.values.includes('doGetRndQuest'));
    invariant(
      doGetRndQuest30.length === 1 && doGetRndQuest32.length === 1 &&
      doGetRndQuest30[0].sha256 === doGetRndQuest32[0].sha256 &&
      doGetRndQuest32[0].sha256 ===
        'db8a3a2aec5f0c23868957362286b415273eee106a344589aae10b567e8418dc',
      'TI005/TI007 exact doGetRndQuest action identity drifted',
    );
    const glossary = deriveGlossary(actions32, {
      en: enGlossaryBytes.toString('utf8'),
      es: esGlossaryBytes.toString('utf8'),
    });
    const dragBindings = deriveDragBindings(actions32);
    return Object.freeze({
      sourceRoot: resolvedRoot,
      preflight: Object.freeze({bytes: preflightBytes, document: preflight, page30, page32}),
      p4Freeze: Object.freeze({bytes: p4FreezeBytes, document: JSON.parse(p4FreezeBytes)}),
      closure,
      actions30,
      actions32,
      sourceAudio,
      glossary,
      dragBindings,
      doGetRndQuestActionSha256: doGetRndQuest32[0].sha256,
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
  const page = analysis.preflight.page32;
  const timeline = page.staticAudit.timelines.longestStaticallyRootReachableDomain;
  return Object.freeze({
    animationId: ANIMATION_ID,
    placementId: PLACEMENT_ID,
    sourceOccurrence: SOURCE_OCCURRENCE,
    sectionCode: 'TI',
    pageTitle: 'Question 6',
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
    questionCount: 3,
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
    randomQuestionAdapter: 'doGetRndQuest-maintained-seeded-order-v1',
    scenarioId: 'p5-f08-occurrence-32-stress',
    legacyNetworkPolicy: 'deny-by-default',
    f08ScaleOut: false,
  });
}

function timelineSource(config) {
  return [
    '/* Generated by scripts/build-g4-l9-p5-f08-occurrence-32-stress.mjs. Do not edit. */',
    "import type {G4L9P4PageConfig} from '../g4-l9-p4-state-machines';",
    '',
    `export const COURSE_G04_L09_TI_007_CONFIG: G4L9P4PageConfig = Object.freeze(${JSON.stringify(config, null, 2)} as const);`,
    '',
  ].join('\n');
}

function canvasSource(config) {
  return `/* Generated by scripts/build-g4-l9-p5-f08-occurrence-32-stress.mjs. Do not edit. */
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
      context.fillStyle = ['#e6f7ff', '#e6f8ef', '#fff3d6'][Math.abs(seed + 32) % 3];
      context.fillRect(0, 0, 800, 600);
      context.strokeStyle = '#164d77';
      context.lineWidth = 7;
      context.beginPath();
      context.moveTo(92, 390);
      context.lineTo(708, 390);
      context.stroke();
      const outcomes = ${JSON.stringify(config.dragBindings.map((item) => item.outcome))};
      for (let index = 0; index < outcomes.length; index += 1) {
        const height = 58 + ((seed + index * 31 + frame) % 118);
        context.fillStyle = outcomes[index] === 'correct' ? '#087ea4' : '#ef8f17';
        context.fillRect(112 + index * 96, 390 - height, 62, height);
      }
      context.fillStyle = '#17324d';
      context.font = '700 28px system-ui, sans-serif';
      context.fillText('TI · Question 6', 52, 66);
      context.font = '600 18px system-ui, sans-serif';
      context.fillText('Occurrence 32 bounded F08 stress candidate', 52, 102);
      context.fillText('Frame ' + frame + ' / ${config.frameCount}', 52, 540);
      canvas.dataset.flashFrame = String(frame);
      canvas.dataset.flashFrameDomain = ${JSON.stringify(config.frameDomain)};
      canvas.dataset.networkCalls = '0';
      canvas.dataset.originalRuntimeValidated = 'false';
      canvas.dataset.p5StressOccurrence = '32';
      return Object.freeze({animationId, frame, networkCalls: 0});
    },
  });
  window.HELP_MATH_CANVAS_ASSETS = window.HELP_MATH_CANVAS_ASSETS || {};
  window.HELP_MATH_CANVAS_ASSETS[animationId] = asset;
})();
`;
}

function freezeDocument(analysis) {
  const page = analysis.preflight.page32;
  return {
    schemaVersion: 1,
    artifactKind: 'private-page-only-f08-occurrence-32-stress-freeze',
    taskId: TASK_ID,
    calibrationId: CALIBRATION_ID,
    base: {
      ref: 'codex/help-math-g4-l9-p4-14-page-representative-slice-20260823',
      commit: 'fb7dc21e4ecb9d625cd96eb7822a1bce89c9e076',
      parent: 'af2a202e48f0db02be75093a9d11b60db1294772',
      tree: 'df70a0b402f2cdc49dc42da28daf42c241c784a9',
    },
    sourceArtifact: {path: PREFLIGHT_PATH, sha256: EXPECTED_PREFLIGHT_SHA256},
    p4Calibration: {
      calibrationId: analysis.p4Freeze.document.calibrationId,
      freeze: {path: P4_FREEZE_PATH, sha256: EXPECTED_P4_FREEZE_SHA256},
      registeredPageCount: 14,
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
    boundedStressContract: {
      frameDomain: 'sprite-149',
      frameCount: 189,
      doGetRndQuestActionSha256: analysis.doGetRndQuestActionSha256,
      coreActionMultisetSha256: EXPECTED_CORE_ACTION_MULTISET_SHA256,
      dragBindings: EXPECTED_DRAG_BINDINGS,
      glossaryHandlerCount: 19,
      resolvedGlossaryEntryCount: 16,
      explicitAliases: {'Mathematical aentence': 'Sentence'},
      sourceAudioDurationMs: 21648,
      hostSymbolCount: 21,
      practiceFeedbackBranchIndex: 'one-based',
      replayHostReset: ['active-audio', 'practice-feedback-or-fq-score'],
      legacyNetworkPolicy: 'deny-by-default',
    },
    productBoundary: {
      descriptorKind: 'private-page-only-product-bridge',
      baselineRegisteredCurrentJs: 14,
      registeredCurrentJs: 15,
      descriptorPageCount: 43,
      unavailablePageCount: 28,
      courseShellCount: 0,
      factoryAdmitted: 5,
      advancedManualAdmitted: 10,
      remainingFactory: 22,
      remainingAdvancedManual: 7,
      formalRegistryMutation: false,
      formalCounts: {denominator: 1751, occurrences: 426, uniqueRenderers: 425, lessons: 8},
    },
    scaleOut: {
      exactEquivalenceAdmission: false,
      wholeLesson43Pages: false,
      familyF08: false,
      remainingF08Occurrences: [20, 29],
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
    artifactKind: 'g4-l9-p5-f08-occurrence-32-source-equivalence-audit',
    taskId: TASK_ID,
    conclusion:
      'identical-non-glossary-core-action-multiset-but-distinct-bounded-advanced-manual-configuration',
    admission: 'not-exact-equivalence-admission',
    sourceClosure: analysis.closure,
    projectionDefinition: analysis.toolchain,
    coreActionProjection: {
      occurrence30: actionSummary('course-g04-l09-ti-005', analysis.actions30),
      occurrence32: actionSummary(ANIMATION_ID, analysis.actions32),
      exactSortedHashMultiset: analysis.actions32.coreActionHashes,
      identical: true,
      sha256: EXPECTED_CORE_ACTION_MULTISET_SHA256,
    },
    doGetRndQuest: {
      actionSha256: analysis.doGetRndQuestActionSha256,
      exactActionBodyEqual: true,
      adapter: 'maintained-seeded-order-does-not-execute-actionscript',
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
      practiceFeedbackBranchIndex: 'one-based-state-question-index-plus-one',
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
    page: {
      sourceOccurrence: config.sourceOccurrence,
      placementId: config.placementId,
      animationId: config.animationId,
      assetId: analysis.preflight.page32.assetId,
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
      registeredPageCount: 15,
      unavailablePageCount: 28,
      courseShellCount: 0,
      formalCounts: {denominator: 1751, occurrences: 426, uniqueRenderers: 425, lessons: 8},
    },
    scaleOut: {familyF08: false, wholeLesson43Pages: false},
    modernHostIntegration: {
      practiceFeedbackBranchIndex: 'one-based',
      replayResetsActiveAudio: true,
      replayResetsPracticeFeedbackOrFqScore: true,
    },
  };
  return [
    '/* Generated by scripts/build-g4-l9-p5-f08-occurrence-32-stress.mjs. Do not edit. */',
    `export const G4_L9_P5_F08_OCCURRENCE_32_STRESS = Object.freeze(${JSON.stringify(data, null, 2)} as const);`,
    '',
  ].join('\n');
}

function workspaceArtifacts(config, analysis, canvasBytes) {
  const audit = equivalenceAudit(analysis);
  const assets = [
    ['source-swf', config.sourceSwfPath, config.sourceSwfBytes, config.sourceSwfSha256, 'canonical-read-only-swf-only'],
    ['candidate-canvas', CANVAS_PATH, canvasBytes.length, sha256(canvasBytes), 'generated-bounded-engineering-candidate'],
  ];
  return new Map([
    [`${MIGRATION_ROOT}/ACCEPTANCE_CHECKLIST.md`, `# ${ANIMATION_ID} P5 bounded stress acceptance checklist

- [x] Exact occurrence 32 identity and five-file source closure bound
- [x] Non-glossary core action multiset projection reproduced from both bound SWFs
- [x] Six occurrence-specific drag outcomes and 19-to-16 glossary mapping frozen
- [x] Exact 21,648 ms source-audio metadata and deny-by-default network boundary
- [x] Deterministic maintained doGetRndQuest adapter, scoring, Final, and Replay
- [x] One-based practice-feedback branches and complete practice/audio host reset on renderer and My Lesson Replay
- [ ] Original Flash runtime behavior validated
- [ ] Technical and visual fidelity accepted
- [ ] Audio listening and synchronization accepted
- [ ] Human and Owner acceptance
- [ ] Strict completion, formal release, publication, and production verification
- [ ] F08-family or 43-page scale-out
`],
    [`${MIGRATION_ROOT}/MIGRATION_BRIEF.md`, `# ${ANIMATION_ID}

P5 admits only G4 L9 source occurrence 32 through a bounded advanced-manual stress implementation. It reuses the maintained P4 JavaScript state machine while preserving TI007 as a distinct source, configuration, calibration, registry module, glossary surface, drag binding, and exact-audio identity. The maintained modern-host adapter uses one-based practice-feedback branches and clears active practice feedback plus exact interactive audio for both renderer-owned and modern My Lesson Replay. This is private Current-JS engineering integration only; it is not exact-equivalence admission, original-runtime parity, fidelity or audio acceptance, human or Owner acceptance, strict completion, formal release, publication, production verification, F08-family scale-out, or 43-page scale-out.
`],
    [`${MIGRATION_ROOT}/asset-inventory.csv`, `${['kind','path','bytes','sha256','status'].join(',')}\n${assets.map((row) => row.map(csv).join(',')).join('\n')}\n`],
    [`${MIGRATION_ROOT}/audio-inventory.csv`, `${['id','source_path','candidate_path','bytes','sha256','duration_ms','sample_rate_hz','channels','spoken_language','decode','listening_status'].join(',')}\n${[
      'source-narration-undetermined', config.audio.sourcePath, AUDIO_COPY_PATH,
      SOURCE_CLOSURE[1].bytes, config.audio.sourceSha256, config.audio.durationMs,
      48000, 1, 'undetermined', 'full-decode-pass', 'not-listened-not-accepted',
    ].map(csv).join(',')}\n`],
    [`${MIGRATION_ROOT}/audit/p5-f08-occurrence-32-equivalence.json`, stableJson(audit)],
    [`${MIGRATION_ROOT}/evidence/full-frame-coverage.json`, stableJson({
      schemaVersion: 1,
      animationId: ANIMATION_ID,
      structuralFrameDomain: config.frameDomain,
      declaredFrameCount: config.frameCount,
      generatedAddressableFrames: [1, config.frameCount],
      stressMaximumWithinFrozenF08Comparison: true,
      naturalOriginalRuntimeTraceCoverage: 'not-established',
      authoritativeOriginalRuntime: false,
      strictAcceptanceEffect: 'none',
    })],
    [`${MIGRATION_ROOT}/evidence/implementation/p5-private-product-integration.json`, stableJson({
      schemaVersion: 1,
      taskId: TASK_ID,
      animationId: ANIMATION_ID,
      placementId: PLACEMENT_ID,
      sourceOccurrence: SOURCE_OCCURRENCE,
      calibrationId: CALIBRATION_ID,
      integration: 'private-page-only-product-bridge',
      modernHost: 'modern-my-lesson-page-only-v1',
      implementationLane: 'advanced-manual',
      doGetRndQuestAdapter: config.randomQuestionAdapter,
      replay: 'deterministic-full-maintained-state-reset',
      practiceFeedbackBranchIndex: 'one-based',
      replayHostReset: 'active-audio-and-practice-feedback-or-fq-score',
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
    [`${MIGRATION_ROOT}/keyframes.csv`, `frame_domain,frame,role,evidence_status\n${config.frameDomain},1,entry,generated-structural-current-js\n${config.frameDomain},${config.frameCount},stress-terminal,generated-structural-current-js\n`],
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
        registeredCurrentJsAfterAcceptance: 15,
        unavailableAfterAcceptance: 28,
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
  ]);
}

export async function buildGeneratedArtifacts({sourceRoot} = {}) {
  invariant(typeof sourceRoot === 'string' && sourceRoot.length > 0,
    'sourceRoot is required for the exact P5 source-bound generator');
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
  invariant(artifacts.size === 13,
    `P5 generator must own exactly 13 text artifacts, observed ${artifacts.size}`);
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
  'TI007 source audio changed after source analysis');
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

function parseArguments(argv) {
  let mode = 'check';
  let sourceRoot;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--write') mode = 'write';
    else if (value === '--check') mode = 'check';
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
  await materialize(built, options.mode);
  process.stdout.write(
    `G4 L9 P5 ${options.mode} PASS: ${built.artifacts.size} text artifacts + 1 exact audio asset\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
