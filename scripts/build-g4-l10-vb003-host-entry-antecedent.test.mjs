import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveNaturalPrefix,
  parseLessonDetails,
  parseScriptBundle,
  stableJson,
} from "./build-g4-l10-vb003-host-entry-antecedent.mjs";

test("parses FFDec record markers without losing global source-line identity", () => {
  const parsed = parseScriptBundle([
    "===== frame_1/DoAction.as =====",
    "stop();",
    "",
    "===== frame_2/DoAction.as =====",
    "play();",
    "",
  ].join("\n"));
  assert.equal(parsed.records.size, 2);
  assert.deepEqual(parsed.records.get("frame_1/DoAction.as").lines[0], {line: 2, text: "stop();"});
  assert.deepEqual(parsed.records.get("frame_2/DoAction.as").lines[0], {line: 5, text: "play();"});
});

test("parses the embedded shell playlist and derives the exact shell-only natural antecedent", () => {
  const sections = parseLessonDetails([
    "function noop(){}",
    'LessonDetails = "[CourseDetails]~CourseName,X~TotalSection,8[Details_Split][Section1Details]~IR~L10RW01.swf[Details_Split][Section2Details]~RW~L10RW02.swf~L10RW03.swf~L10RW04.swf~L10RW05.swf[Details_Split][Section3Details]~VB~L10VB01.swf~L10VB02.swf~L10VB03.swf[Details_Split][Section4Details]~IN~L10IN01.swf[Details_Split][Section5Details]~TI~L10TI01.swf[Details_Split][Section6Details]~GS~L10GS01.swf[Details_Split][Section7Details]~TS~L10TS01.swf[Details_Split][Section8Details]~FQ~L10FQ01.swf";',
  ].join("\n"));
  const active = [
    "IR/L10RW01.swf",
    "RW/L10RW02.swf",
    "RW/L10RW03.swf",
    "RW/L10RW04.swf",
    "RW/L10RW05.swf",
    "VB/L10VB02.swf",
    "VB/L10VB03.swf",
  ];
  const prefix = deriveNaturalPrefix(sections, "VB/L10VB03.swf", active);
  assert.equal(prefix.length, 8);
  assert.equal(prefix[0].entryKind, "shell-default-initial-load");
  assert.equal(prefix[5].sourcePath, "VB/L10VB01.swf");
  assert.equal(prefix[5].activeCourseXmlPage, false);
  assert.equal(prefix[7].sourcePath, "VB/L10VB03.swf");
  assert.equal(prefix[7].nextPressCount, 7);
  assert.equal(prefix[7].target, true);
});

test("fails closed when a target is absent or the host section contract drifts", () => {
  const valid = 'LessonDetails = "[Details_Split][Section1Details]~IR~a.swf[Details_Split][Section2Details]~RW~b.swf[Details_Split][Section3Details]~VB~c.swf[Details_Split][Section4Details]~IN~d.swf[Details_Split][Section5Details]~TI~e.swf[Details_Split][Section6Details]~GS~f.swf[Details_Split][Section7Details]~TS~g.swf[Details_Split][Section8Details]~FQ~h.swf";';
  const sections = parseLessonDetails(valid);
  assert.throws(() => deriveNaturalPrefix(sections, "VB/missing.swf", []), /absent from LessonDetails/);
  assert.throws(() => parseLessonDetails(valid.replace("[Section8Details]", "[Bad]")), /invalid LessonDetails section marker/);
});

test("stable JSON recursively orders object keys while preserving array order", () => {
  assert.equal(stableJson({z: 1, a: {d: 2, b: 1}, q: [{y: 2, x: 1}]}), [
    "{",
    '  "a": {',
    '    "b": 1,',
    '    "d": 2',
    "  },",
    '  "q": [',
    "    {",
    '      "x": 1,',
    '      "y": 2',
    "    }",
    "  ],",
    '  "z": 1',
    "}",
    "",
  ].join("\n"));
});

