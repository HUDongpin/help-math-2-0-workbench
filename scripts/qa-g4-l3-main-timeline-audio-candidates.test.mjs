import assert from "node:assert/strict";
import test from "node:test";

import {
  summarizeEnglish,
  summarizeSpanish,
} from "./qa-g4-l3-main-timeline-audio-candidates.mjs";

const pathname =
  "/flash-assets/courses/course-g04-l03-rw-004/audio/embedded-stream-0001.mp3";
const clean = {
  requests: [`http://127.0.0.1:3214${pathname}`],
  responses: [{url: `http://127.0.0.1:3214${pathname}`, status: 200}],
  unexpectedRequests: [],
  failedRequests: [],
  consoleErrors: [],
  pageErrors: [],
};

test("main-timeline English QA requires a post-Replay active exact source", () => {
  const state = {
    records: [
      {source: pathname, status: "playing"},
      {source: pathname, status: "playing"},
    ],
    elements: [{
      source: pathname,
      paused: false,
      ended: false,
      readyState: 4,
      currentTimeStarted: true,
    }],
  };
  assert.equal(
    summarizeEnglish({
      pathname,
      beforeRecordCount: 1,
      state,
      replay: "1",
      diagnostics: clean,
    }).pass,
    true,
  );
  assert.equal(
    summarizeEnglish({
      pathname,
      beforeRecordCount: 2,
      state,
      replay: "1",
      diagnostics: clean,
    }).pass,
    false,
  );
});

test("main-timeline Spanish QA requires a visible active user control", () => {
  const state = {
    records: [{source: pathname, status: "playing"}],
    elements: [{
      source: pathname,
      paused: false,
      ended: false,
      readyState: 4,
      currentTimeStarted: true,
    }],
  };
  assert.equal(
    summarizeSpanish({
      pathname,
      state,
      stopLabelVisible: true,
      diagnostics: clean,
    }).pass,
    true,
  );
  assert.equal(
    summarizeSpanish({
      pathname,
      state,
      stopLabelVisible: false,
      diagnostics: clean,
    }).pass,
    false,
  );
});
