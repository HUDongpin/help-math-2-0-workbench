import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {gunzipSync} from "node:zlib";
import test from "node:test";
import {TI005_QUESTION_COPY} from "../src/modern-lessons/g4-l3-ti005-question";
import {COURSE_G04_L03_TI_005_SOURCE} from "../src/timelines/course-g04-l03-ti-005";

test("TI005 native instructions retain the source question and both operating instructions", () => {
  const catalog = JSON.parse(gunzipSync(readFileSync(new URL(
    `../../../catalog/typography-v1/source-catalog/assets/${COURSE_G04_L03_TI_005_SOURCE.swfSha256}.json.gz`,
    import.meta.url,
  ))).toString());
  assert.equal(catalog.sourceSha256, COURSE_G04_L03_TI_005_SOURCE.swfSha256);
  const text = (ids: number[]) => ids.map(id => {
    const definition = catalog.textDefinitions.find((item: {characterId: number}) => item.characterId === id);
    assert.ok(definition, `missing source text ${id}`);
    return definition.runs.map((run: {text: string}) => run.text).join("").trim();
  }).join(" ").replace(/\s+/g, " ");
  assert.equal(TI005_QUESTION_COPY.questionNumber, text([158]));
  assert.equal(TI005_QUESTION_COPY.prompt, text([159]));
  assert.equal(TI005_QUESTION_COPY.answerInstruction, text([172, 180]));
  assert.equal(TI005_QUESTION_COPY.newProblemInstruction, text([182, 183]));
});
