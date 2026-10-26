import {createHash} from 'node:crypto';
import {constants, closeSync, fstatSync, lstatSync, openSync, readFileSync,
  realpathSync} from 'node:fs';
import path from 'node:path';
import {P064_SOURCE_ROOT} from './nms-l02-p064-question-audio-access';

const INDEX = 'migrations/shared-nms002-l02-p064/audit/audio-source-candidates-v1.json';
const INDEX_SHA256 = '60937f89ba02f67723dc534d5e6316517e82325053d3bacafe903c28b1510e58';
const SWF = 'G6-G8-shared/NMS002/L2/FQ/L2FQ02.swf';
const SWF_SHA256 = 'f655f05d7be5576503a66f52909b322bd3fce3e7b51a7fcda52291f755bf346c';
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

function readExact(root: string, relative: string, bytes: number, expectedSha: string): Buffer {
  if (!path.isAbsolute(root) || path.resolve(root) !== root
    || !lstatSync(root).isDirectory() || realpathSync(root) !== root
    || !relative.split('/').every(part => part && part !== '.' && part !== '..')
    || bytes < 1 || bytes > 512_000) throw new Error('P064_AUDIO_PATH');
  let target = root;
  const parts = relative.split('/');
  for (const part of parts.slice(0, -1)) {
    target = path.join(target, part);
    const stat = lstatSync(target);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('P064_AUDIO_SYMLINK');
  }
  target = path.join(target, parts.at(-1)!);
  const before = lstatSync(target);
  if (!before.isFile() || before.isSymbolicLink() || before.size !== bytes
    || realpathSync(target) !== target) throw new Error('P064_AUDIO_FILE');
  const fd = openSync(target, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const opened = fstatSync(fd);
    if (!opened.isFile() || opened.dev !== before.dev || opened.ino !== before.ino
      || opened.size !== bytes) throw new Error('P064_AUDIO_CHANGED');
    const content = readFileSync(fd);
    const after = fstatSync(fd);
    if (content.length !== bytes || after.size !== bytes
      || after.mtimeMs !== opened.mtimeMs || sha(content) !== expectedSha) {
      throw new Error('P064_AUDIO_HASH');
    }
    return content;
  } finally {closeSync(fd);}
}

type AudioRow = Readonly<{folderCode: string; questionId: number; role: string;
  option: string | null; relativePath: string; bytes: number; sha256: string}>;

function readP064Audio(workspaceRoot: string, folder: string, questionId: number,
  option: string | null): {
  readonly bytes: Buffer; readonly sha256: string;
} {
  if (!['EA', 'SA'].includes(folder) || !Number.isInteger(questionId)
    || questionId < 1 || questionId > 35
    || (option !== null && !/^[A-D]$/u.test(option))) throw new Error('P064_AUDIO_SELECTION');
  const indexBytes = readExact(workspaceRoot, INDEX, 109156, INDEX_SHA256);
  const index = JSON.parse(indexBytes.toString('utf8')) as {
    schemaVersion: number; animationId: string; sourceMediaRows: AudioRow[];
  };
  if (index.schemaVersion !== 1 || index.animationId !== 'shared-nms002-l02-p064'
    || index.sourceMediaRows.length !== 350) throw new Error('P064_AUDIO_INDEX');
  const role = option === null ? 'question' : 'option';
  const rows = index.sourceMediaRows.filter(row => row.folderCode === folder
    && row.questionId === questionId && row.role === role && row.option === option);
  const relative = `G6-G8-shared/NMS002/L2/FQ/${folder}/Q${questionId}${option ?? ''}.mp3`;
  if (rows.length !== 1 || rows[0]!.relativePath !== relative) throw new Error('P064_AUDIO_BINDING');
  readExact(P064_SOURCE_ROOT, SWF, 55392, SWF_SHA256);
  const row = rows[0]!;
  return {bytes: readExact(P064_SOURCE_ROOT, relative, row.bytes, row.sha256), sha256: row.sha256};
}

export function readP064QuestionAudio(workspaceRoot: string, folder: string, questionId: number) {
  return readP064Audio(workspaceRoot, folder, questionId, null);
}

/** Source-file candidate only; the legacy host's option-to-file mapping is not yet verified. */
export function readP064OptionAudio(workspaceRoot: string, folder: string,
  questionId: number, option: string) {
  return readP064Audio(workspaceRoot, folder, questionId, option);
}
