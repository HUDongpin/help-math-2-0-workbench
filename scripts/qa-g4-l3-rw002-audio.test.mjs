import assert from "node:assert/strict";
import test from "node:test";

import {
  summarizeEnglishQa,
  summarizeSpanishQa,
} from "./qa-g4-l3-rw002-audio.mjs";

const embedded =
  "/flash-assets/courses/course-g04-l03-rw-002/audio/embedded-stream-0001.mp3";
const spanish =
  "/flash-assets/courses/course-g04-l03-rw-002/audio/spanish-host-narration.mp3";
const diagnostics = {
  unexpectedRequests: [],
  failedRequests: [],
  consoleErrors: [],
  pageErrors: [],
};

test("RW002 English QA requires a fulfilled post-Replay source play", () => {
  const base = {
    before: {records: [], elements: []},
    after: {
      records: [{source: embedded, status: "playing", error: null}],
      elements: [{
        source: embedded,
        paused: false,
        ended: false,
        readyState: 4,
        currentTimeStarted: true,
      }],
    },
    replay: "1",
    requests: [`http://127.0.0.1:3214${embedded}`],
    responses: [{url: `http://127.0.0.1:3214${embedded}`, status: 200}],
    diagnostics,
  };
  assert.equal(summarizeEnglishQa(base).pass, true);
  assert.equal(
    summarizeEnglishQa({
      ...base,
      after: {records: [{source: embedded, status: "rejected"}], elements: []},
    }).pass,
    false,
  );
});

test("RW002 Spanish QA requires the user control and active exact source", () => {
  const base = {
    state: {
      records: [{source: spanish, status: "playing", error: null}],
      elements: [{
        source: spanish,
        paused: false,
        ended: false,
        readyState: 4,
        currentTimeStarted: true,
      }],
    },
    stopLabelVisible: true,
    requests: [`http://127.0.0.1:3214${spanish}`],
    responses: [{url: `http://127.0.0.1:3214${spanish}`, status: 200}],
    diagnostics,
  };
  assert.equal(summarizeSpanishQa(base).pass, true);
  assert.equal(
    summarizeSpanishQa({...base, stopLabelVisible: false}).pass,
    false,
  );
});
