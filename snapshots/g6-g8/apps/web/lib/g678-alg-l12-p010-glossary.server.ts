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
    throw Error('P010 glossary ordinary source file required');
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  if (before.ino !== after.ino || before.dev !== after.dev || before.size !== after.size ||
    before.mtimeNs !== after.mtimeNs || before.mode !== after.mode || before.nlink !== after.nlink ||
    createHash('sha256').update(bytes).digest('hex') !== sha256) throw Error('P010 glossary source drift');
  return bytes;
}
function plain(value: string) {
  const text = value.replaceAll('&nbsp;', ' ').replace(/\s+/gu, ' ').trim();
  if (!text || /[<>]|&[A-Za-z#]/u.test(text)) throw Error('P010 glossary unsupported legacy markup');
  return text;
}
type RecordEntry = {literalKey: string; lookup: {kind:string; from:string; to:string; genericCaseNormalizationAllowed:boolean}; sourceLabelEn: string; sourceLabelEs: string; definitionEn: string; definitionEs: string};

/** Five source dictionary entries absent from the predecessor's lesson union. */
export function supplementP010Glossary(base: readonly PageOnlyLessonGlossaryEntry[]): readonly PageOnlyLessonGlossaryEntry[] {
  const bytes = pinned(path.join(getWorkspaceRoot(), 'migrations/shared-alg001-l12-p010/audit/source-keyterms.json'),
    27860, '9f524c88c59e9a3ce3a1e39e5461bb4b3c9c5b93e13c0d03daa60c2baeb41c07');
  pinned(`${ROOT}/L1KTE01.xml`, 345838, EN_SHA);
  pinned(`${ROOT}/L1KTS01.xml`, 344456, ES_SHA);
  const audit = JSON.parse(bytes.toString()) as {animationId: string; sources: {path: string; sha256: string; records: RecordEntry[]}[]};
  if (audit.animationId !== 'shared-alg001-l12-p010' || audit.sources.length !== 2 ||
    audit.sources[0].path !== `${ROOT}/L1KTE01.xml` || audit.sources[0].sha256 !== EN_SHA ||
    audit.sources[1].path !== `${ROOT}/L1KTS01.xml` || audit.sources[1].sha256 !== ES_SHA)
    throw Error('P010 glossary source association mismatch');
  const source = base.find(entry => entry.source.en.sha256 === EN_SHA && entry.source.es.sha256 === ES_SHA)?.source;
  if (!source) throw Error('P010 predecessor has no matching canonical dictionary identity');
  const extra = ['Geometric figures', 'Position', 'length', 'Width', 'Height'].map(key => {
    if (base.some(entry => entry.sourceKeyAttribute === key)) throw Error('P010 duplicate supplemental key');
    const en = audit.sources[0].records.filter(record => record.literalKey === key);
    const es = audit.sources[1].records.filter(record => record.literalKey === key);
    if (en.length !== 1 || es.length !== 1 ||
      [en[0],es[0]].some(record => record.lookup.from !== key || record.lookup.to !== (key === 'length' ? 'Length' : key) ||
        record.lookup.kind !== (key === 'length' ? 'explicit-case-crosswalk' : 'exact-literal') ||
        record.lookup.genericCaseNormalizationAllowed !== false) || plain(en[0].definitionEn) !== plain(es[0].definitionEn) ||
      plain(en[0].definitionEs) !== plain(es[0].definitionEs) || en[0].sourceLabelEn !== es[0].sourceLabelEn ||
      en[0].sourceLabelEs !== es[0].sourceLabelEs) throw Error('P010 bilingual source entry mismatch');
    const id = key.toLowerCase().replaceAll(' ', '-');
    if (base.some(entry => entry.id === id)) throw Error('P010 supplemental entry ID collision');
    return {id, sourceKeyAttribute: key,
      labels: {en: plain(en[0].sourceLabelEn), es: plain(es[0].sourceLabelEs)},
      definitions: {en: plain(en[0].definitionEn), es: plain(es[0].definitionEs)}, source};
  });
  return Object.freeze([...base, ...extra]);
}
