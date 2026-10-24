import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {getWorkspaceRoot} from './catalog';
import type {PageOnlyLessonGlossaryEntry} from './whole-lesson-player-descriptor';

const ROOT = '/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
const EN_SHA = '14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b';
const ES_SHA = '3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407';
function pinned(file: string, size: number, sha256: string) {
  const before = lstatSync(file, {bigint: true});
  if (!before.isFile() || before.nlink !== 1n || realpathSync(file) !== file || before.size !== BigInt(size))
    throw Error('P009 glossary ordinary source file required');
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  if (before.ino !== after.ino || before.dev !== after.dev || before.size !== after.size ||
    before.mtimeNs !== after.mtimeNs || before.mode !== after.mode || before.nlink !== after.nlink ||
    createHash('sha256').update(bytes).digest('hex') !== sha256) throw Error('P009 glossary source drift');
  return bytes;
}
function plain(value: string) {
  const text = value.replaceAll('&nbsp;', ' ').replace(/\s+/gu, ' ').trim();
  if (!text || /[<>]|&[A-Za-z#]/u.test(text)) throw Error('P009 glossary unsupported legacy markup');
  return text;
}
type RecordEntry = {key: string; sourceLabelEn: string; sourceLabelEs: string; definitionEn: string; definitionEs: string};

/** Four source dictionary entries absent from the predecessor's lesson union. */
export function supplementP009Glossary(base: readonly PageOnlyLessonGlossaryEntry[]): readonly PageOnlyLessonGlossaryEntry[] {
  const bytes = pinned(path.join(getWorkspaceRoot(), 'migrations/shared-alg001-l12-p009/audit/source-keyterms.json'),
    20166, '927aec6318e3b90e63e80c2670cce36e4ed9b76c10ef808872c9b0381181ffc3');
  pinned(`${ROOT}/L1KTE01.xml`, 345838, EN_SHA);
  pinned(`${ROOT}/L1KTS01.xml`, 344456, ES_SHA);
  const audit = JSON.parse(bytes.toString()) as {animationId: string; sources: {path: string; sha256: string; records: RecordEntry[]}[]};
  if (audit.animationId !== 'shared-alg001-l12-p009' || audit.sources.length !== 2 ||
    audit.sources[0].path !== `${ROOT}/L1KTE01.xml` || audit.sources[0].sha256 !== EN_SHA ||
    audit.sources[1].path !== `${ROOT}/L1KTS01.xml` || audit.sources[1].sha256 !== ES_SHA)
    throw Error('P009 glossary source association mismatch');
  const source = base.find(entry => entry.source.en.sha256 === EN_SHA && entry.source.es.sha256 === ES_SHA)?.source;
  if (!source) throw Error('P009 predecessor has no matching canonical dictionary identity');
  const extra = ['Pair', 'Locate', 'X-coordinate', 'Y-coordinate'].map(key => {
    if (base.some(entry => entry.sourceKeyAttribute === key)) throw Error('P009 duplicate supplemental key');
    const en = audit.sources[0].records.filter(record => record.key === key);
    const es = audit.sources[1].records.filter(record => record.key === key);
    if (en.length !== 1 || es.length !== 1 || plain(en[0].definitionEn) !== plain(es[0].definitionEn) ||
      plain(en[0].definitionEs) !== plain(es[0].definitionEs) || en[0].sourceLabelEn !== es[0].sourceLabelEn ||
      en[0].sourceLabelEs !== es[0].sourceLabelEs) throw Error('P009 bilingual source entry mismatch');
    const id = key.toLowerCase();
    if (base.some(entry => entry.id === id)) throw Error('P009 supplemental entry ID collision');
    return {id, sourceKeyAttribute: key,
      labels: {en: plain(en[0].sourceLabelEn), es: plain(es[0].sourceLabelEs)},
      definitions: {en: plain(en[0].definitionEn), es: plain(es[0].definitionEs)}, source};
  });
  return Object.freeze([...base, ...extra]);
}
