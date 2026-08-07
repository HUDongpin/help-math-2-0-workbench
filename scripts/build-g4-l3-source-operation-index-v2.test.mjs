import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {link, mkdir, mkdtemp, readFile, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {promisify} from "node:util";

import {
  parseActionScriptSource,
  validateReport,
  writeOrCheckSourceOperationReports,
} from "./build-g4-l3-source-operation-index-v2.mjs";

const reportUrl = new URL("../reports/g4-l3-source-operation-index-v2.json", import.meta.url);
const markdownUrl = new URL("../reports/g4-l3-source-operation-index-v2.md", import.meta.url);
const staticIndexUrl = new URL("../reports/g4-l3-static-source-event-index.json", import.meta.url);
const [reportText, markdown, staticIndexText] = await Promise.all([
  readFile(reportUrl, "utf8"),
  readFile(markdownUrl, "utf8"),
  readFile(staticIndexUrl, "utf8"),
]);
const report = JSON.parse(reportText);
const staticIndex = JSON.parse(staticIndexText);
const execFileAsync = promisify(execFile);

test("parser retains exact event, method, receiver, arguments, line, and source-event bindings", () => {
  const text = [
    'on(release, keyPress "<Enter>")',
    "{",
    '  _global.lang = "SP";',
    '  target.gotoAndPlay("begin");',
    "  var branch = random(2);",
    "  if (Key.isDown(Key.ENTER)) { score += 1; }",
    '  narrator.loadSound("SA/L3.mp3", true);',
    "  resetQuiz();",
    '  getURL("javascript:void(0)");',
    "}",
    "",
  ].join("\n");
  const parsed = parseActionScriptSource({
    scriptPath: 'DefineButton2_210/BUTTONCONDACTION on(release, keyPress "<Enter>").as',
    text,
    sourceEvents: [{sourceEventId: "source-event-0042"}],
  });

  const handler = parsed.operations.find((operation) => operation.operationKind === "event-handler");
  assert.equal(handler.eventExpression, 'on(release, keyPress "<Enter>")');
  assert.deepEqual(handler.argumentExpressions, ['release, keyPress "<Enter>"']);
  assert.deepEqual(handler.categories, ["input"]);
  assert.equal(handler.lineNumber, 1);
  assert.equal(handler.columnNumber, 1);
  assert.deepEqual(handler.sourceEventIds, ["source-event-0042"]);

  const timeline = parsed.operations.find((operation) => operation.method === "gotoAndPlay");
  assert.equal(timeline.receiverExpression, "target");
  assert.deepEqual(timeline.argumentExpressions, ['"begin"']);
  assert.equal(timeline.exactExpression, 'target.gotoAndPlay("begin");');
  assert.equal(timeline.lineNumber, 4);
  assert.equal(timeline.columnNumber, 3);
  assert.equal(timeline.methodColumnNumber, 10);
  assert.deepEqual(timeline.categories, ["timeline", "replay-reset"]);

  const random = parsed.operations.find((operation) => operation.method === "random");
  assert.deepEqual(random.argumentExpressions, ["2"]);
  assert.deepEqual(random.categories, ["random"]);

  const key = parsed.operations.find((operation) => operation.method === "isDown");
  assert.equal(key.receiverExpression, "Key");
  assert.deepEqual(key.argumentExpressions, ["Key.ENTER"]);
  assert.deepEqual(key.categories, ["input"]);

  const sound = parsed.operations.find((operation) => operation.method === "loadSound");
  assert.equal(sound.receiverExpression, "narrator");
  assert.deepEqual(sound.argumentExpressions, ['"SA/L3.mp3"', "true"]);
  assert.deepEqual(sound.categories, ["external", "language", "audio"]);
  assert.equal(sound.externalApi, "Sound.loadSound");

  assert.deepEqual(parsed.operations.find((operation) => operation.method === "resetQuiz").categories, ["replay-reset"]);
  assert.equal(parsed.operations.find((operation) => operation.method === "getURL").externalApi, "getURL");
  assert.ok(parsed.signals.some((signal) => signal.category === "global" && signal.identifier === "lang" && signal.access === "write"));
  assert.ok(parsed.signals.some((signal) => signal.category === "scoring" && /score/i.test(signal.exactExpression)));
  assert.ok(parsed.signals.every((signal) => signal.sourceEventIds[0] === "source-event-0042"));
});

test("balanced parser preserves multiline nested arguments and ignores comments and strings", () => {
  const text = [
    "target.gotoAndStop(",
    '  selectFrame("x,y"),',
    "  frames[fn(1, 2)]",
    ");",
    '// ignored.getURL("https://invalid.example");',
    'var literal = "also.getURL(\\"https://invalid.example\\")";',
    "",
  ].join("\n");
  const parsed = parseActionScriptSource({scriptPath: "frame_1/DoAction.as", text});
  assert.equal(parsed.operations.length, 1);
  assert.equal(parsed.operations[0].method, "gotoAndStop");
  assert.deepEqual(parsed.operations[0].argumentExpressions, [
    'selectFrame("x,y")',
    "frames[fn(1, 2)]",
  ]);
  assert.equal(parsed.operations[0].exactExpression, [
    "target.gotoAndStop(",
    '  selectFrame("x,y"),',
    "  frames[fn(1, 2)]",
    ");",
  ].join("\n"));
  assert.deepEqual(parsed.operations[0].categories, ["timeline"]);
  assert.equal(parsed.operations[0].eventExpression, null);
});

test("lifecycle handlers stay separate from user-input and pointer handlers", () => {
  for (const expression of ["onClipEvent(load)", "onClipEvent(enterFrame)", "on(initialize)"]) {
    const parsed = parseActionScriptSource({
      scriptPath: `DefineSprite_1/frame_1/${expression}.as`,
      text: `${expression}\n{\n  stop();\n}\n`,
    });
    const handler = parsed.operations.find((operation) => operation.operationKind === "event-handler");
    assert.deepEqual(handler.categories, ["lifecycle"]);
  }
  for (const expression of ["onClipEvent(mouseDown)", "onClipEvent(keyDown)", "on(release)"]) {
    const parsed = parseActionScriptSource({
      scriptPath: `DefineSprite_1/frame_1/${expression}.as`,
      text: `${expression}\n{\n  stop();\n}\n`,
    });
    const handler = parsed.operations.find((operation) => operation.operationKind === "event-handler");
    assert.deepEqual(handler.categories, ["input"]);
  }
});

test("checked report binds the complete 40-item re-export and exact source-operation totals", () => {
  assert.equal(validateReport(report), true);
  assert.deepEqual(report.summary, {
    canonicalItems: 40,
    physicallyRehashedSwfs: 40,
    completeFfdecReexports: 40,
    exportedScriptFileCount: 1809,
    normalizedScriptBytes: 488123,
    exactOperationCount: 3403,
    exactOperationsByCategory: {
      timeline: 1577,
      lifecycle: 77,
      random: 18,
      input: 950,
      scoring: 457,
      "replay-reset": 297,
      external: 23,
      language: 61,
      audio: 322,
      global: 533,
    },
    exactTimelineOperationMethodsResolved: 1577,
    exactEventHandlerExpressionsResolved: 816,
    exactExternalCallsResolved: 23,
    exactSignalCount: 3493,
    exactSignalsByCategory: {
      input: 378,
      scoring: 586,
      "replay-reset": 22,
      external: 1,
      language: 95,
      audio: 506,
      global: 1905,
    },
    sourceBoundScenarioTraceCandidateCount: 193,
    itemsWithSourceBoundScenarioTraceCandidates: 40,
    shellStaticExactCandidatesMatched: 20,
    shellStaticExactCandidateCount: 20,
    shellSupportingExpressionLinesMatched: 30,
    itemsWithRuntimeReachability: 0,
    authoritativeScenarioInventories: 0,
    authoritativeTraceSpecs: 0,
    acceptanceChanges: 0,
    itemSetSha256: "d03af59eb80b207e217defdbc813b493f9ab31132fd8963e24fdb13281971ff9",
  });
  assert.equal(report.sourceBindings.sourceSetSha256, "aa16462bac75c14246c8a66d21593b7e9d907681d399eda1ba0e0712d879b584");
  assert.equal(report.sourceBindings.reexportSetSha256, "c27e3dc6a6cc81790e61111357fbf8d259a45fdd2ee279b17c14e10b734e7d19");
  assert.equal(report.sourceBindings.tool.ffdec.version, "JPEXS Free Flash Decompiler v.26.2.1");
  assert.equal(report.sourceBindings.tool.ffdec.ffdecJarSha256, "090ab695053ad94cba6408574c7d7eea20ec60b6ae789ee6056a23f45106762f");
});

test("every operation and signal remains bound to the static event index and local item namespace", () => {
  const staticByAnimation = new Map(staticIndex.items.map((item) => [item.animationId, item]));
  for (const item of report.items) {
    const staticItem = staticByAnimation.get(item.animationId);
    const eventIds = new Set(staticItem.sourceEvents.map((event) => event.sourceEventId));
    assert.equal(item.upstreamBindings.sourceEventRecordsBound, staticItem.sourceEvents.length);
    assert.equal(item.upstreamBindings.uniqueSourceEventScriptsBound,
      new Set(staticItem.sourceEvents.map((event) => event.script.path)).size);
    const operationIds = new Set(item.operations.map((operation) => operation.operationId));
    const signalIds = new Set(item.signals.map((signal) => signal.signalId));
    for (const operation of item.operations) {
      assert.ok(operation.sourceEventIds.every((id) => eventIds.has(id)));
      assert.equal(operation.expressionSha256.length, 64);
    }
    for (const signal of item.signals) assert.ok(signal.sourceEventIds.every((id) => eventIds.has(id)));
    for (const candidate of item.scenarioTraceCandidates) {
      assert.ok(candidate.sourceOperationIds.every((id) => operationIds.has(id)));
      assert.ok(candidate.sourceSignalIds.every((id) => signalIds.has(id)));
      assert.equal(candidate.runtimeReachabilityEstablished, false);
      assert.equal(candidate.naturalExecutionProofEstablished, false);
      assert.equal(candidate.acceptanceEffect, "none");
    }
  }
  const shell = report.items.find((item) => item.animationId === "shell-course-g04-l03-index-local");
  const shellOperations = new Map(shell.operations.map((operation) => [operation.operationId, operation]));
  assert.equal(report.shellCrosscheck.candidateOperationBindings.length, 20);
  for (const binding of report.shellCrosscheck.candidateOperationBindings) {
    assert.equal(shellOperations.get(binding.operationId).shellContractCandidateId, binding.candidateId);
  }
});

test("pointer candidates contain actual pointer tokens and exclude lifecycle handlers", () => {
  let lifecycleHandlerCount = 0;
  for (const item of report.items) {
    const operations = new Map(item.operations.map((operation) => [operation.operationId, operation]));
    lifecycleHandlerCount += item.operations.filter((operation) =>
      operation.operationKind === "event-handler" && operation.categories.includes("lifecycle")).length;
    for (const candidate of item.scenarioTraceCandidates.filter(({candidateId}) => candidateId === "pointer-and-clip-handler-paths")) {
      for (const operationId of candidate.sourceOperationIds) {
        const operation = operations.get(operationId);
        assert.match(
          operation.eventExpression || operation.exactExpression,
          /\b(?:releaseOutside|release|press|rollOver|rollOut|dragOver|dragOut|mouseDown|mouseUp|mouseMove)\b/i,
        );
        assert.doesNotMatch(operation.eventExpression || "", /\b(?:load|unload|enterFrame|initialize|data|construct)\b/i);
      }
    }
  }
  assert.equal(lifecycleHandlerCount, 77);
});

test("validator fails closed on runtime, authority, acceptance, candidate, or expression promotion", () => {
  const cases = [
    [(copy) => { copy.authority.runtimeReachabilityEstablished = true; }, /authority runtimeReachabilityEstablished/],
    [(copy) => { copy.items[0].runtimeBoundary.runtimeLaunched = true; }, /runtimeLaunched/],
    [(copy) => { copy.items[0].scenarioTraceCandidates[0].orderedScheduleEstablished = true; }, /candidate crosses/],
    [(copy) => { copy.acceptance.routeChanges = 1; }, /Acceptance boundary/],
    [(copy) => { copy.items[0].operations[0].expressionSha256 = "0".repeat(64); }, /invalid exact operation/],
  ];
  for (const [mutate, expected] of cases) {
    const copy = structuredClone(report);
    mutate(copy);
    assert.throws(() => validateReport(copy), expected);
  }
});

test("validator recomputes expression, source, re-export, item-set, and summary aggregate bindings", () => {
  const cases = [
    [
      (copy) => {
        copy.items[0].operations[0].exactExpression += " ";
        copy.items[0].operations[0].expressionSha256 = createHash("sha256")
          .update(copy.items[0].operations[0].exactExpression)
          .digest("hex");
      },
      /item-set SHA-256/u,
    ],
    [
      (copy) => {
        copy.items[0].source.swf.sha256 = "0".repeat(64);
        copy.items[0].assetId = `swf-${copy.items[0].source.swf.sha256}`;
      },
      /source-set SHA-256/u,
    ],
    [
      (copy) => { copy.items[0].reexport.normalizedBundleSha256 = "0".repeat(64); },
      /re-export-set SHA-256/u,
    ],
    [
      (copy) => { copy.summary.itemSetSha256 = "0".repeat(64); },
      /item-set SHA-256/u,
    ],
    [
      (copy) => { copy.summary.exactSignalCount += 1; },
      /summary aggregates/u,
    ],
    [
      (copy) => { copy.items[0].counts.signals += 1; },
      /operation\/signal counts are stale/u,
    ],
  ];
  for (const [mutate, expected] of cases) {
    const copy = structuredClone(report);
    mutate(copy);
    assert.throws(() => validateReport(copy), expected);
  }
});

test("validator fails closed on shell candidate-operation mapping drift", () => {
  const cases = [
    [
      (copy) => {
        copy.shellCrosscheck.candidateOperationBindings[1].candidateId =
          copy.shellCrosscheck.candidateOperationBindings[0].candidateId;
      },
      /candidate and operation IDs must each be unique/u,
    ],
    [
      (copy) => {
        copy.shellCrosscheck.candidateOperationBindings[1].operationId =
          copy.shellCrosscheck.candidateOperationBindings[0].operationId;
      },
      /candidate and operation IDs must each be unique/u,
    ],
    [
      (copy) => { copy.shellCrosscheck.candidateOperationBindings[0].operationId = "operation-99999"; },
      /does not resolve to the G4 L3 shell item/u,
    ],
    [
      (copy) => {
        const shell = copy.items.find((item) => item.animationId === "shell-course-g04-l03-index-local");
        const binding = copy.shellCrosscheck.candidateOperationBindings[0];
        shell.operations.find((operation) => operation.operationId === binding.operationId).shellContractCandidateId = "static-999";
      },
      /disagrees with the shell operation binding/u,
    ],
    [
      (copy) => { copy.shellCrosscheck.candidateOperationBindings.pop(); },
      /exactly 20 candidate-operation bindings/u,
    ],
  ];
  for (const [mutate, expected] of cases) {
    const copy = structuredClone(report);
    mutate(copy);
    assert.throws(() => validateReport(copy), expected);
  }
});

test("validator pins authoritative shell IDs, columns, match modes, and supporting-line totals", () => {
  const shell = (copy) => copy.items.find((item) => item.animationId === "shell-course-g04-l03-index-local");
  const cases = [
    [
      (copy) => {
        const binding = copy.shellCrosscheck.candidateOperationBindings[0];
        const operation = shell(copy).operations.find((candidate) => candidate.operationId === binding.operationId);
        binding.candidateId = "static-999";
        operation.shellContractCandidateId = "static-999";
      },
      /exact authoritative candidate IDs/u,
    ],
    [
      (copy) => { copy.shellCrosscheck.candidateOperationBindings[0].parsedExpressionColumnNumber += 1; },
      /parsed columns disagree/u,
    ],
    [
      (copy) => { copy.shellCrosscheck.candidateOperationBindings[0].parsedMethodColumnNumber += 1; },
      /parsed columns disagree/u,
    ],
    [
      (copy) => { copy.shellCrosscheck.candidateOperationBindings[0].contractColumnNumber = 0; },
      /contract column must be a positive integer/u,
    ],
    [
      (copy) => { copy.shellCrosscheck.candidateOperationBindings[0].exactCallMatchMode = "approximate"; },
      /invalid or inconsistent exact-call match mode/u,
    ],
    [
      (copy) => {
        const binding = copy.shellCrosscheck.candidateOperationBindings.find(({candidateId}) => candidateId === "static-019");
        binding.exactCallMatchMode = "exact-operation-expression";
      },
      /invalid or inconsistent exact-call match mode/u,
    ],
    [
      (copy) => {
        copy.shellCrosscheck.supportingExpressionLinesMatched = 29;
        copy.summary.shellSupportingExpressionLinesMatched = 29;
      },
      /20 matched candidates and 30 supporting source lines/u,
    ],
  ];
  for (const [mutate, expected] of cases) {
    const copy = structuredClone(report);
    mutate(copy);
    assert.throws(() => validateReport(copy), expected);
  }
});

test("markdown publishes exact static totals and an explicit zero-authority boundary", () => {
  assert.match(markdown, /Physically re-hashed SWFs: \*\*40\/40\*\*/);
  assert.match(markdown, /Exact source operations: \*\*3,403\*\*/);
  assert.match(markdown, /Source-bound scenario\/trace candidates: \*\*193\*\* across \*\*40\/40\*\*/);
  assert.match(markdown, /Runtime reachability, authoritative scenarios\/traces, acceptance, and completion: \*\*0\*\*/);
  assert.match(markdown, /Every runtime, audio, visual, human, owner, and strict-completion gate remains false/);
});

test("report publication rejects path escapes, source paths, wrong types, links, and check-mode overwrites", async (t) => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "g4-l3-source-operation-output-"));
  t.after(() => rm(fixture, {recursive: true, force: true}));
  const root = path.join(fixture, "project");
  const reports = path.join(root, "reports");
  const sources = path.join(root, "source-assets");
  const outside = path.join(fixture, "outside");
  await Promise.all([
    mkdir(reports, {recursive: true}),
    mkdir(sources, {recursive: true}),
    mkdir(outside, {recursive: true}),
  ]);

  const safeMarkdown = path.join(reports, "safe.md");
  const publish = (jsonOutput, overrides = {}) => writeOrCheckSourceOperationReports({
    root,
    jsonOutput,
    markdownOutput: safeMarkdown,
    expectedJson: "replacement-json\n",
    expectedMarkdown: "replacement-markdown\n",
    ...overrides,
  });

  const outsideSentinel = path.join(outside, "sentinel.json");
  await writeFile(outsideSentinel, "outside sentinel\n");
  await assert.rejects(publish(outsideSentinel), /inside .*reports/u);
  assert.equal(await readFile(outsideSentinel, "utf8"), "outside sentinel\n");

  const parentEscape = ["reports", "..", "source-assets", "parent-escape.json"].join(path.sep);
  await assert.rejects(publish(parentEscape), /inside .*reports/u);
  assert.equal(await readFile(outsideSentinel, "utf8"), "outside sentinel\n");

  const sourceSentinel = path.join(sources, "source-sentinel.json");
  await writeFile(sourceSentinel, "source sentinel\n");
  await assert.rejects(publish(sourceSentinel), /inside .*reports/u);
  assert.equal(await readFile(sourceSentinel, "utf8"), "source sentinel\n");

  await assert.rejects(publish(path.join(reports, "wrong-extension.md")), /must end in \.json/u);

  await symlink(outside, path.join(reports, "linked-directory"));
  await assert.rejects(
    publish(path.join(reports, "linked-directory", "escaped.json")),
    /symbolic-link path component/u,
  );
  assert.equal(await readFile(outsideSentinel, "utf8"), "outside sentinel\n");

  const symlinkTarget = path.join(reports, "symlink-target.json");
  await symlink(outsideSentinel, symlinkTarget);
  await assert.rejects(publish(symlinkTarget), /symbolic-link path component/u);
  assert.equal(await readFile(outsideSentinel, "utf8"), "outside sentinel\n");

  const hardlinkSentinel = path.join(outside, "hardlink-sentinel.json");
  const hardlinkTarget = path.join(reports, "hardlink-target.json");
  await writeFile(hardlinkSentinel, "hardlink sentinel\n");
  await link(hardlinkSentinel, hardlinkTarget);
  await assert.rejects(publish(hardlinkTarget), /must not be hard-linked/u);
  assert.equal(await readFile(hardlinkSentinel, "utf8"), "hardlink sentinel\n");

  const fifoTarget = path.join(reports, "fifo-target.json");
  await execFileAsync("mkfifo", [fifoTarget]);
  await assert.rejects(publish(fifoTarget), /existing regular file/u);
  assert.equal(await readFile(outsideSentinel, "utf8"), "outside sentinel\n");

  const checkedJson = path.join(reports, "checked.json");
  const checkedMarkdown = path.join(reports, "checked.md");
  await Promise.all([
    writeFile(checkedJson, "checked json sentinel\n"),
    writeFile(checkedMarkdown, "checked markdown sentinel\n"),
  ]);
  await assert.rejects(
    publish(checkedJson, {markdownOutput: checkedMarkdown, check: true}),
    /missing or stale/u,
  );
  assert.equal(await readFile(checkedJson, "utf8"), "checked json sentinel\n");
  assert.equal(await readFile(checkedMarkdown, "utf8"), "checked markdown sentinel\n");
});
