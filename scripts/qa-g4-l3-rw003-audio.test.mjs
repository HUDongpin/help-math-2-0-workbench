import assert from "node:assert/strict";
import test from "node:test";

import {
  EMBEDDED_PATH,
  SPANISH_PATH,
  summarizeEnglishQa,
  summarizeSpanishQa,
} from "./qa-g4-l3-rw003-audio.mjs";

const diagnostics = {
  unexpectedRequests: [],
  failedRequests: [],
  consoleErrors: [],
  pageErrors: [],
};

test("RW003 English QA requires a fulfilled source-frame-8 play after Replay", () => {
  const base = {
    before: {records: [], elements: []},
    after: {
      records: [{source: EMBEDDED_PATH, status: "playing", error: null}],
      elements: [{
        source: EMBEDDED_PATH,
        paused: false,
        ended: false,
        readyState: 4,
        currentTimeStarted: true,
      }],
    },
    replay: "1",
    requests: [`http://127.0.0.1:3214${EMBEDDED_PATH}`],
    responses: [{
      url: `http://127.0.0.1:3214${EMBEDDED_PATH}`,
      status: 200,
    }],
    diagnostics,
  };
  assert.equal(summarizeEnglishQa(base).pass, true);
  assert.equal(
    summarizeEnglishQa({
      ...base,
      after: {
        records: [{source: EMBEDDED_PATH, status: "rejected"}],
        elements: [],
      },
    }).pass,
    false,
  );
});

test("RW003 Spanish QA requires an active exact-source user control", () => {
  const base = {
    state: {
      records: [{source: SPANISH_PATH, status: "playing", error: null}],
      elements: [{
        source: SPANISH_PATH,
        paused: false,
        ended: false,
        readyState: 4,
        currentTimeStarted: true,
      }],
    },
    stopLabelVisible: true,
    requests: [`http://127.0.0.1:3214${SPANISH_PATH}`],
    responses: [{
      url: `http://127.0.0.1:3214${SPANISH_PATH}`,
      status: 200,
    }],
    diagnostics,
  };
  assert.equal(summarizeSpanishQa(base).pass, true);
  assert.equal(
    summarizeSpanishQa({...base, stopLabelVisible: false}).pass,
    false,
  );
});
