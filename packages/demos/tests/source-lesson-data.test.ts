import assert from 'node:assert/strict';
import {readdirSync, readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {loadAnimationModule} from '../src/animation-registry';
import {withSourceLessonAudio} from '../src/source-lesson-audio';
import {
  assertSourceLessonDataFor,
  loadSourceLessonData,
  sourceLessonDataLoaders,
  sourceLessonIdForKey,
  type SourceLessonData,
} from '../src/source-lesson-data';
import interactiveKeys from '../src/source-interactive-keys.json';

const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
const dataDir = path.join(srcDir, 'source-lesson-data');
const lessonFiles = readdirSync(dataDir).filter((file) => file.endsWith('.json')).sort();
const readLesson = (file: string) =>
  JSON.parse(readFileSync(path.join(dataDir, file), 'utf8')) as SourceLessonData;

test('every lesson data file holds only its own lesson and has a loader', () => {
  assert.deepEqual(Object.keys(sourceLessonDataLoaders).sort(), lessonFiles.map((file) => file.slice(0, -5)));
  for (const file of lessonFiles) {
    const data = readLesson(file);
    assert.equal(data.lessonId, file.slice(0, -5));
    for (const part of [data.audio, data.quiz, data.feedback]) {
      for (const key of Object.keys(part)) assert.equal(sourceLessonIdForKey(key), data.lessonId, `${key} in ${file}`);
    }
  }
});

test('interactive key index matches the quiz and feedback data', () => {
  const keys = lessonFiles.flatMap((file) => {
    const data = readLesson(file);
    return [...Object.keys(data.quiz), ...Object.keys(data.feedback)];
  });
  assert.deepEqual([...new Set(keys)].sort(), [...interactiveKeys].sort());
});

test('a lesson data file is imported only by its loader or by that lesson\'s own modules', () => {
  const sources = readdirSync(srcDir, {recursive: true, encoding: 'utf8'})
    .filter((file) => /\.tsx?$/u.test(file));
  for (const file of sources) {
    const text = readFileSync(path.join(srcDir, file), 'utf8');
    for (const [, lessonId] of text.matchAll(/source-lesson-data\/(g0\d-l\d\d)\.json/gu)) {
      if (file === 'source-lesson-data.ts') continue;
      const ownLesson = /course-(g0\d-l\d\d)-/u.exec(file)?.[1] ??
        /g(\d)-l(\d+)/u.exec(file)?.slice(1).reduce((grade, lesson) => `g0${grade}-l${lesson.padStart(2, '0')}`);
      assert.equal(ownLesson, lessonId, `${file} imports ${lessonId}`);
    }
  }
});

test('loading a key returns only its own lesson', async () => {
  const data = await loadSourceLessonData('course-g04-l03-fq-002');
  assert.equal(data?.lessonId, 'g04-l03');
  assert.equal(await loadSourceLessonData('conversion-1-2'), undefined);
});

test('lesson data handed to another lesson fails loudly', async () => {
  const other = await loadSourceLessonData('course-g03-l01-fq-001');
  assert.ok(other);
  assert.throws(() => assertSourceLessonDataFor(other, 'course-g04-l03-fq-002'), /does not belong/u);
  const module = await loadAnimationModule('conversion-1-2');
  assert.ok(module);
  assert.throws(() => withSourceLessonAudio({...module, key: 'course-g04-l03-fq-002'}, other), /does not belong/u);
});

test('a source quiz page still gets its recovered audio and quiz renderer', async () => {
  const quizKey = [...interactiveKeys].find((key) => key.startsWith('course-g03-l01-'));
  assert.ok(quizKey);
  const data = await loadSourceLessonData(quizKey);
  const module = await loadAnimationModule(quizKey);
  assert.ok(module && data);
  const recovered = data.audio[quizKey];
  if (recovered?.interactive?.length) {
    for (const asset of recovered.interactive) {
      assert.ok(module.interactiveAudioAssets?.some((existing) => existing.id === asset.id), asset.id);
    }
  }
  assert.equal(module.transport, undefined);
});
