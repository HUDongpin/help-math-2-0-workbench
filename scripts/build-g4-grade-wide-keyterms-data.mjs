#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {
  mkdir,
  lstat,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const SOURCE_DIRECTORY =
  'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML';
const DATASETS = Object.freeze({
  en: Object.freeze({
    bytes: 378_783,
    file: 'ELKTEG4.xml',
    output: 'apps/web/public/generated/g4-grade-wide-keyterms-en.json',
    sha256:
      'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
  }),
  es: Object.freeze({
    bytes: 374_466,
    file: 'ELKTSG4.xml',
    output: 'apps/web/public/generated/g4-grade-wide-keyterms-es.json',
    sha256:
      '7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00',
  }),
});
const KNOWN_ATTRIBUTES = Object.freeze(new Set([
  'EngCategory',
  'SpanCategory',
  'ScreenkeyTerm',
  'SubLinkEng',
  'SubLinkSpan',
  'ExFileName',
]));

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function projectPath(relativePath) {
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(
    relative &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative),
    `path escapes project root: ${relativePath}`,
  );
  return resolved;
}

function decodeEntity(entity) {
  const named = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: '\u00a0',
    quot: '"',
  };
  if (entity.startsWith('#x')) {
    const value = Number.parseInt(entity.slice(2), 16);
    return Number.isSafeInteger(value) ? String.fromCodePoint(value) : '';
  }
  if (entity.startsWith('#')) {
    const value = Number.parseInt(entity.slice(1), 10);
    return Number.isSafeInteger(value) ? String.fromCodePoint(value) : '';
  }
  invariant(
    Object.hasOwn(named, entity),
    `unsupported legacy XML entity: &${entity};`,
  );
  return named[entity];
}

export function decodeLegacyText(value) {
  return value
    .replace(/&([A-Za-z]+|#x[0-9A-Fa-f]+|#[0-9]+);/g, (_, entity) =>
      decodeEntity(entity))
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function nodeTitle(value) {
  return decodeLegacyText(value.replaceAll('~', ' '));
}

function parseAttributes(source) {
  const attributes = {};
  const warnings = [];
  const consumed = source.replace(
    /([A-Za-z][A-Za-z0-9]*)\s*=\s*"([^"]*)"/g,
    (_, key, value) => {
      invariant(KNOWN_ATTRIBUTES.has(key), `unknown key-term attribute: ${key}`);
      if (attributes[key] !== undefined) {
        invariant(
          attributes[key] === value,
          `conflicting duplicate key-term attribute: ${key}`,
        );
        warnings.push({
          kind: 'identical-duplicate-attribute-normalized',
          attribute: key,
        });
      } else {
        attributes[key] = value;
      }
      return '';
    },
  );
  invariant(
    consumed.trim() === '',
    `unparsed key-term attributes: ${consumed.trim().slice(0, 80)}`,
  );
  for (const key of KNOWN_ATTRIBUTES) {
    invariant(
      typeof attributes[key] === 'string',
      `missing key-term attribute: ${key}`,
    );
  }
  return {attributes, warnings};
}

function parseSublinks(value) {
  if (!value.trim()) return {links: [], warnings: []};
  const warnings = [];
  const links = value.split('~').filter(Boolean).map((item) => {
    const comma = item.indexOf(',');
    if (comma <= 0 || comma >= item.length - 1) {
      warnings.push({
        kind: 'malformed-sublink-token-preserved',
        token: decodeLegacyText(item),
      });
      return {
        sourceText: decodeLegacyText(item),
        targetTitle: null,
      };
    }
    return {
      sourceText: decodeLegacyText(item.slice(0, comma)),
      targetTitle: decodeLegacyText(item.slice(comma + 1)),
    };
  });
  return {links, warnings};
}

function stableEntryId(indexLanguage, ordinal, nodeName) {
  const suffix = createHash('sha256')
    .update(`${indexLanguage}\0${ordinal}\0${nodeName}`)
    .digest('hex')
    .slice(0, 12);
  return `${indexLanguage}-${String(ordinal).padStart(4, '0')}-${suffix}`;
}

export function parseLegacyKeyTermsXml(xml, indexLanguage) {
  invariant(indexLanguage === 'en' || indexLanguage === 'es', 'invalid index language');
  const rows = xml.replace(/^\uFEFF/, '').split(/\r?\n/);
  const entries = [];
  const warnings = [];
  let rootOpened = false;
  let rootClosed = false;
  for (let lineIndex = 0; lineIndex < rows.length; lineIndex += 1) {
    const row = rows[lineIndex].trim();
    if (!row) continue;
    if (row === '<Glossary>') {
      invariant(!rootOpened && entries.length === 0, 'duplicate Glossary root');
      rootOpened = true;
      continue;
    }
    if (row === '</Glossary>') {
      invariant(rootOpened && !rootClosed, 'unexpected Glossary close');
      rootClosed = true;
      continue;
    }
    invariant(rootOpened && !rootClosed, `entry outside Glossary at line ${lineIndex + 1}`);
    const match = row.match(/^<([^\s>]+)([^>]*)>([\s\S]*)<\/([^>]+)>$/);
    invariant(match, `malformed key-term entry at line ${lineIndex + 1}`);
    const [, nodeName, attributeSource, body, rawClosingName] = match;
    const closingName = rawClosingName.trim();
    invariant(
      closingName === nodeName,
      `key-term closing node mismatch at line ${lineIndex + 1}`,
    );
    if (rawClosingName !== nodeName) {
      warnings.push({
        kind: 'closing-node-whitespace-normalized',
        line: lineIndex + 1,
        nodeName,
      });
    }
    const titleParts = nodeName.split('~LNG~');
    invariant(titleParts.length === 2, `missing bilingual node title at line ${lineIndex + 1}`);
    const definitionSeparator = body.indexOf('~LNG~');
    invariant(
      definitionSeparator >= 0 &&
        body.indexOf('~LNG~', definitionSeparator + 5) === -1,
      `invalid bilingual definition at line ${lineIndex + 1}`,
    );
    const attributeResult = parseAttributes(attributeSource);
    const attributes = attributeResult.attributes;
    warnings.push(...attributeResult.warnings.map((warning) => ({
      ...warning,
      line: lineIndex + 1,
      nodeName,
    })));
    const englishSublinks = parseSublinks(attributes.SubLinkEng);
    const spanishSublinks = parseSublinks(attributes.SubLinkSpan);
    warnings.push(
      ...englishSublinks.warnings.map((warning) => ({
        ...warning,
        language: 'en',
        line: lineIndex + 1,
        nodeName,
      })),
      ...spanishSublinks.warnings.map((warning) => ({
        ...warning,
        language: 'es',
        line: lineIndex + 1,
        nodeName,
      })),
    );
    const ordinal = entries.length + 1;
    entries.push({
      id: stableEntryId(indexLanguage, ordinal, nodeName),
      sourceOrdinal: ordinal,
      titles: {
        en: nodeTitle(titleParts[0]),
        es: nodeTitle(titleParts[1]),
      },
      categories: {
        en: decodeLegacyText(attributes.EngCategory).toLocaleLowerCase('en-US'),
        es: decodeLegacyText(attributes.SpanCategory).toLocaleLowerCase('es-US'),
      },
      definitions: {
        en: decodeLegacyText(body.slice(0, definitionSeparator)),
        es: decodeLegacyText(body.slice(definitionSeparator + 5)),
      },
      sublinks: {
        en: englishSublinks.links,
        es: spanishSublinks.links,
      },
      screenKeyTerm: decodeLegacyText(attributes.ScreenkeyTerm),
      diagram: {
        declaredFilename: decodeLegacyText(attributes.ExFileName),
        webResolutionStatus: 'not-hash-bound-for-web',
      },
    });
  }
  invariant(rootOpened && rootClosed, 'Glossary root is incomplete');
  invariant(entries.length > 0, 'Glossary contains no entries');
  return {entries, warnings};
}

function publicDocument(indexLanguage, source, parsed) {
  return {
    schemaVersion: 1,
    dataKind: 'grade-wide-shell-keyterms-static-candidate',
    sourceDisposition: 'unresolved-lesson-vs-grade-wide',
    indexLanguage,
    source: {
      assetId: source.file,
      bytes: source.bytes,
      sha256: source.sha256,
      ordering: 'source-file-order',
    },
    lessonBinding: {
      releaseId: 'lesson-g04-l03-add-subtract-whole-numbers',
      declaredLessonSpecificSources: indexLanguage === 'en'
        ? ['L3KTE01.xml']
        : ['L3KTS01.xml'],
      declaredLessonSpecificSourcesPresent: false,
      shellGradeWideCandidatePresent: true,
      runtimeResolutionVerified: false,
      productDispositionAccepted: false,
    },
    authority: {
      actionScriptExecuted: false,
      originalRuntimeBaseline: false,
      lessonSpecificSubstitutionAuthorized: false,
      originalRuntimeAccepted: false,
      ownerAccepted: false,
      strictCompletion: false,
      publicRelease: false,
    },
    extraction: {
      entryCount: parsed.entries.length,
      warningCount: parsed.warnings.length,
      warnings: parsed.warnings,
      entityPolicy: 'known-named-and-numeric-text-only',
      legacyUrlsExecuted: false,
      diagramAssetsExecuted: false,
    },
    entries: parsed.entries,
  };
}

export async function buildG4GradeWideKeyTermsData() {
  const outputs = [];
  for (const indexLanguage of ['en', 'es']) {
    const source = DATASETS[indexLanguage];
    const sourcePath = projectPath(path.join(SOURCE_DIRECTORY, source.file));
    const sourceStat = await lstat(sourcePath);
    invariant(sourceStat.isFile() && !sourceStat.isSymbolicLink(), `${source.file} must be a regular file`);
    const sourceBytes = await readFile(sourcePath);
    invariant(
      sourceBytes.length === source.bytes && sha256(sourceBytes) === source.sha256,
      `${source.file} identity changed`,
    );
    const parsed = parseLegacyKeyTermsXml(sourceBytes.toString('utf8'), indexLanguage);
    const document = publicDocument(indexLanguage, source, parsed);
    const bytes = Buffer.from(`${JSON.stringify(document, null, 2)}\n`);
    invariant((await readFile(sourcePath)).equals(sourceBytes), `${source.file} changed during read-only extraction`);
    outputs.push({
      indexLanguage,
      output: source.output,
      bytes,
      document,
    });
  }
  return outputs;
}

export function parseArguments(argv) {
  const options = {mode: 'dry-run'};
  for (const argument of argv) {
    if (argument === '--write') {
      invariant(options.mode === 'dry-run', 'choose exactly one mode');
      options.mode = 'write';
    } else if (argument === '--check') {
      invariant(options.mode === 'dry-run', 'choose exactly one mode');
      options.mode = 'check';
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return options;
}

async function emit(output, bytes, mode) {
  const target = projectPath(output);
  if (mode === 'check') {
    invariant((await readFile(target)).equals(bytes), `${output} is stale`);
    return;
  }
  if (mode !== 'write') return;
  await mkdir(path.dirname(target), {recursive: true});
  const temporary = `${target}.tmp-${process.pid}`;
  try {
    await writeFile(temporary, bytes, {flag: 'wx'});
    await rename(temporary, target);
  } finally {
    await rm(temporary, {force: true});
  }
}

export async function run(options = {}) {
  const {mode = 'dry-run'} = options;
  const outputs = await buildG4GradeWideKeyTermsData();
  for (const output of outputs) {
    await emit(output.output, output.bytes, mode);
  }
  return outputs.map(({document, indexLanguage, output, bytes}) => ({
    indexLanguage,
    output,
    bytes: bytes.length,
    entryCount: document.extraction.entryCount,
    warningCount: document.extraction.warningCount,
    sourceDisposition: document.sourceDisposition,
    strictCompletion: document.authority.strictCompletion,
    publicRelease: document.authority.publicRelease,
  }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const result = await run(parseArguments(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
