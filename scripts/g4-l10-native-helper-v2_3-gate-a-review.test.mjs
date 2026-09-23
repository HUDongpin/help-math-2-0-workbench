import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import assert from "node:assert/strict";

const successorPath =
  "docs/G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR.md";
const directPath =
  "docs/G4_L10_NATIVE_HELPER_V2_2_SECURITY_CONTRACT_SUCCESSOR.md";
const rootPath = "docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md";
const reviewPath =
  "docs/G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md";

const expectedSuccessor =
  "bf0abed59f8db5be0ef83657530bc81cc93d85c9ae466461142c06933e569320";
const expectedDirect =
  "d7bb8755cbd8fb3a7f4d709d1ec2879f8aee4fa8b8ad4cbacfd7e5068a9eeb5c";
const expectedRoot =
  "77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583";

const sha256 = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");

function u32(value) {
  const result = Buffer.alloc(4);
  result.writeUInt32BE(value);
  return result;
}

function u64(value) {
  const result = Buffer.alloc(8);
  result.writeBigUInt64BE(BigInt(value));
  return result;
}

function lp(bytes) {
  return Buffer.concat([u32(bytes.length), bytes]);
}

function parseCanonicalUnsigned(value, maximum, label) {
  assert.match(value, /^(?:0|[1-9][0-9]*)$/, `${label}: decimal grammar`);
  const parsed = BigInt(value);
  assert(parsed <= BigInt(maximum), `${label}: maximum`);
  return parsed;
}

function parseCanonicalI32(value, label) {
  assert.match(value, /^(?:0|-?[1-9][0-9]*)$/, `${label}: signed grammar`);
  const parsed = BigInt(value);
  assert(parsed >= -2147483648n && parsed <= 2147483647n, `${label}: I32`);
  return parsed;
}

function parseUtc(value, label) {
  assert.match(
    value,
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/,
    `${label}: UTC grammar`,
  );
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/,
  );
  assert.notEqual(match[1], "0000", `${label}: Gregorian year`);
  assert(Number(match[4]) <= 23, `${label}: hour`);
  assert(Number(match[5]) <= 59, `${label}: minute`);
  assert(Number(match[6]) <= 59, `${label}: second`);
  const date = new Date(value);
  assert(!Number.isNaN(date.valueOf()), `${label}: valid instant`);
  assert.equal(date.toISOString().slice(0, 19) + "Z", value, `${label}: exact date`);
  return date.valueOf();
}

const hex = /^[0-9a-f]{64}$/;
const b64uGrammar = /^[A-Za-z0-9_-]+$/;
const utf8Decoder = new TextDecoder("utf-8", { fatal: true });

function decodeB64u(value, label, minimum = 1, maximum = 4096) {
  assert.match(value, b64uGrammar, `${label}: base64url grammar`);
  const bytes = Buffer.from(value, "base64url");
  assert.equal(bytes.toString("base64url"), value, `${label}: canonical base64url`);
  assert(bytes.length >= minimum && bytes.length <= maximum, `${label}: length`);
  return bytes;
}

function decodeIdentity(value, label) {
  const bytes = decodeB64u(value, label);
  const decoded = utf8Decoder.decode(bytes);
  assert(!/[\u0000\r\n\t]/.test(decoded), `${label}: forbidden byte`);
  return bytes;
}

function fields(line, prefix, names) {
  const pieces = line.split("|");
  assert.equal(pieces.length, names.length, `${prefix}: field count`);
  const result = {};
  for (let index = 0; index < names.length; index += 1) {
    const expected = `${names[index]}=`;
    assert(pieces[index].startsWith(expected), `${prefix}: field ${names[index]}`);
    result[names[index]] = pieces[index].slice(expected.length);
  }
  return result;
}

function parseArgvStream(encoded, label) {
  const bytes = decodeB64u(encoded, `${label}.argv`, 1, 1_049_604);
  assert(bytes.length >= 4, `${label}: argv header`);
  let offset = 0;
  const count = bytes.readUInt32BE(offset);
  offset += 4;
  assert(count >= 1 && count <= 256, `${label}: argv count`);
  let argumentBytes = 0;
  for (let index = 0; index < count; index += 1) {
    assert(offset + 4 <= bytes.length, `${label}: argv length header`);
    const length = bytes.readUInt32BE(offset);
    offset += 4;
    assert(length >= 1 && length <= 4096, `${label}: argv argument length`);
    assert(offset + length <= bytes.length, `${label}: argv argument extent`);
    const argument = bytes.subarray(offset, offset + length);
    offset += length;
    argumentBytes += length;
    const decoded = utf8Decoder.decode(argument);
    assert(!/[\u0000\r\n\t]/.test(decoded), `${label}: argv forbidden byte`);
  }
  assert.equal(offset, bytes.length, `${label}: argv exact consumption`);
  assert(argumentBytes <= 1_048_576, `${label}: argv aggregate`);
}

const successor = await readFile(successorPath);
const direct = await readFile(directPath);
const root = await readFile(rootPath);
const report = await readFile(reviewPath);
const reviewStat = await stat(reviewPath);

assert.equal(reviewStat.mode & 0o7777, 0o444, "report mode");
assert(report.length >= 1 && report.length <= 16_777_216, "report byte bound");
assert.equal(report[0], 0x23, "report begins with heading");
assert.equal(report.at(-1), 0x0a, "report final LF");
assert.notEqual(report.at(-2), 0x0a, "report exactly one final LF");
assert(!report.includes(0x00), "report has no NUL");
assert(!report.includes(0x0d), "report has no CR");
assert(!report.includes(0x09), "report has no tab");
assert(!/(?: |\u00a0)\n/u.test(utf8Decoder.decode(report)), "report has no trailing space");

assert.equal(sha256(successor), expectedSuccessor, "live successor digest");
assert.equal(sha256(direct), expectedDirect, "live direct-predecessor digest");
assert.equal(sha256(root), expectedRoot, "live root-predecessor digest");

const lines = utf8Decoder.decode(report).slice(0, -1).split("\n");
let cursor = 0;
const take = (expected) => {
  assert.equal(lines[cursor], expected, `line ${cursor + 1}`);
  cursor += 1;
};
const takeValue = (name) => {
  const prefix = `${name}=`;
  assert(lines[cursor].startsWith(prefix), `line ${cursor + 1}: ${name}`);
  const result = lines[cursor].slice(prefix.length);
  cursor += 1;
  return result;
};

take("# G4 L10 Native Helper v2.3 Successor Independent Review");
take("");
take("## Frozen identity");
take("format-version=2");
const successorSha = takeValue("successor-sha256");
const directSha = takeValue("direct-predecessor-sha256");
const rootSha = takeValue("root-predecessor-sha256");
const successorBytes = takeValue("successor-byte-count");
const successorLf = takeValue("successor-lf-line-count");
const reportedBatch = takeValue("review-batch-id");
assert.equal(successorSha, expectedSuccessor);
assert.equal(directSha, expectedDirect);
assert.equal(rootSha, expectedRoot);
assert.match(reportedBatch, hex);
assert.equal(parseCanonicalUnsigned(successorBytes, 2n ** 64n - 1n, "bytes"), BigInt(successor.length));
const liveLf = successor.reduce((count, byte) => count + (byte === 0x0a ? 1 : 0), 0);
assert.equal(parseCanonicalUnsigned(successorLf, 2n ** 64n - 1n, "LF"), BigInt(liveLf));

take("");
take("## Independent review units");
const unitCount = Number(parseCanonicalUnsigned(takeValue("unit-count"), 18, "unit count"));
assert(unitCount >= 4);

const unitNames = [
  "unit", "reviewer-id", "task-id", "transcript-id", "model-tool", "started",
  "finished", "before", "after", "range", "scope-class", "sections",
  "section-set-sha256", "command-count", "command-transcript-sha256",
];
const commandNames = [
  "command", "argv-stream-b64u", "cwd-b64u", "started", "finished",
  "exit-status", "stdout-byte-count", "stdout-sha256", "stderr-byte-count",
  "stderr-sha256",
];
const units = [];
let totalCommands = 0;
let totalOutputBytes = 0n;
for (let unitOrdinal = 0; unitOrdinal < unitCount; unitOrdinal += 1) {
  const row = fields(lines[cursor], `unit ${unitOrdinal}`, unitNames);
  cursor += 1;
  assert.equal(row.unit, String(unitOrdinal));
  const reviewer = decodeIdentity(row["reviewer-id"], `unit ${unitOrdinal} reviewer`);
  const task = decodeIdentity(row["task-id"], `unit ${unitOrdinal} task`);
  const transcript = decodeIdentity(row["transcript-id"], `unit ${unitOrdinal} transcript`);
  decodeIdentity(row["model-tool"], `unit ${unitOrdinal} model`);
  const started = parseUtc(row.started, `unit ${unitOrdinal} started`);
  const finished = parseUtc(row.finished, `unit ${unitOrdinal} finished`);
  assert(started <= finished);
  assert.equal(row.before, expectedSuccessor);
  assert.equal(row.after, expectedSuccessor);
  assert.equal(row.range, "1..EOF");
  assert(["scoped", "whole"].includes(row["scope-class"]));
  assert.match(row["section-set-sha256"], hex);
  assert.match(row["command-transcript-sha256"], hex);
  const commandCount = Number(parseCanonicalUnsigned(row["command-count"], 256, "command count"));
  assert(commandCount >= 1);
  const commandRows = [];
  let priorFinished = started;
  for (let commandOrdinal = 0; commandOrdinal < commandCount; commandOrdinal += 1) {
    const commandLine = lines[cursor];
    const command = fields(commandLine, `command ${unitOrdinal}.${commandOrdinal}`, commandNames);
    cursor += 1;
    assert.equal(command.command, `${unitOrdinal}.${commandOrdinal}`);
    parseArgvStream(command["argv-stream-b64u"], `command ${unitOrdinal}.${commandOrdinal}`);
    decodeIdentity(command["cwd-b64u"], `command ${unitOrdinal}.${commandOrdinal} cwd`);
    const commandStarted = parseUtc(command.started, "command started");
    const commandFinished = parseUtc(command.finished, "command finished");
    assert(started <= commandStarted && commandStarted <= commandFinished && commandFinished <= finished);
    assert(priorFinished <= commandStarted, "serialized command intervals");
    priorFinished = commandFinished;
    parseCanonicalI32(command["exit-status"], "exit status");
    const stdoutBytes = parseCanonicalUnsigned(command["stdout-byte-count"], 16_777_216, "stdout bytes");
    const stderrBytes = parseCanonicalUnsigned(command["stderr-byte-count"], 16_777_216, "stderr bytes");
    totalOutputBytes += stdoutBytes + stderrBytes;
    assert.match(command["stdout-sha256"], hex);
    assert.match(command["stderr-sha256"], hex);
    commandRows.push(commandLine);
  }
  totalCommands += commandCount;
  const transcriptPreimage = Buffer.concat([
    Buffer.from("HMG4GAC1", "ascii"), u32(1), u32(commandRows.length),
    ...commandRows.map((rowBytes) => lp(Buffer.from(rowBytes, "utf8"))),
  ]);
  assert.equal(sha256(transcriptPreimage), row["command-transcript-sha256"]);
  const tokens = row.sections.split(",");
  const sectionPreimage = Buffer.concat([
    Buffer.from("HMG4GAS1", "ascii"), u32(1), u32(tokens.length),
    ...tokens.map((token) => lp(Buffer.from(token, "ascii"))),
  ]);
  assert.equal(sha256(sectionPreimage), row["section-set-sha256"]);
  units.push({ ...row, reviewer, task, transcript, tokens });
}
assert(totalCommands >= 1 && totalCommands <= 4096);
assert(totalOutputBytes <= 268_435_456n);

for (const key of ["reviewer", "task", "transcript"]) {
  const values = units.map((unit) => unit[key].toString("hex"));
  assert.equal(new Set(values).size, values.length, `${key} uniqueness`);
}
for (let index = 1; index < units.length; index += 1) {
  assert(Buffer.compare(units[index - 1].reviewer, units[index].reviewer) < 0, "reviewer byte sort");
}
const scoped = units.filter((unit) => unit["scope-class"] === "scoped");
const whole = units.filter((unit) => unit["scope-class"] === "whole");
assert.equal(whole.length, 1);
assert.deepEqual(whole[0].tokens, ["whole"]);
assert(scoped.length >= 3);
assert.equal(scoped.length + whole.length, units.length);
const fixedTokens = ["00-preamble", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16"];
const seenTokens = [];
for (const unit of scoped) {
  assert(unit.tokens.length >= 1);
  assert.deepEqual([...unit.tokens].sort(), unit.tokens, "scoped ASCII token sort");
  for (const token of unit.tokens) {
    assert(fixedTokens.includes(token), "known scoped token");
    assert(!seenTokens.includes(token), "disjoint scoped tokens");
    seenTokens.push(token);
  }
}
assert.deepEqual([...seenTokens].sort(), [...fixedTokens].sort(), "complete scoped union");

const batchPreimage = Buffer.concat([
  Buffer.from("HMG4GAB2", "ascii"), u32(2), Buffer.from(successorSha, "hex"),
  Buffer.from(directSha, "hex"), Buffer.from(rootSha, "hex"),
  u64(successorBytes), u64(successorLf), u32(units.length),
  ...units.flatMap((unit) => [lp(unit.reviewer), lp(unit.task), lp(unit.transcript)]),
]);
assert.equal(sha256(batchPreimage), reportedBatch, "review batch ID");

take("");
take("## Findings and remediation");
const findingCount = Number(parseCanonicalUnsigned(takeValue("finding-count"), 1024, "finding count"));
const findingNames = [
  "finding", "priority", "code-b64u", "reviewer-id", "disposition",
  "original-text-b64u", "original-text-sha256", "remediated-text-b64u",
  "remediated-text-sha256", "first-reviewer-confirmed-remediation-sha256",
];
const findings = [];
const reviewerSet = new Set(units.map((unit) => unit["reviewer-id"]));
for (let ordinal = 0; ordinal < findingCount; ordinal += 1) {
  const finding = fields(lines[cursor], `finding ${ordinal}`, findingNames);
  cursor += 1;
  assert.equal(finding.finding, String(ordinal));
  assert(["P0", "P1", "P2"].includes(finding.priority));
  const code = decodeIdentity(finding["code-b64u"], `finding ${ordinal} code`);
  assert(reviewerSet.has(finding["reviewer-id"]), "finding reviewer exists");
  const reviewer = decodeIdentity(finding["reviewer-id"], `finding ${ordinal} reviewer`);
  assert.equal(finding.disposition, "remediated");
  const original = decodeB64u(finding["original-text-b64u"], `finding ${ordinal} original`);
  const remediated = decodeB64u(finding["remediated-text-b64u"], `finding ${ordinal} remediated`);
  utf8Decoder.decode(original);
  utf8Decoder.decode(remediated);
  assert(!original.includes(0), "finding original NUL");
  assert(!remediated.includes(0), "finding remediated NUL");
  assert.equal(sha256(original), finding["original-text-sha256"]);
  assert.equal(sha256(remediated), finding["remediated-text-sha256"]);
  assert.match(finding["first-reviewer-confirmed-remediation-sha256"], hex);
  findings.push({ ...finding, code, reviewer });
}
for (let index = 1; index < findings.length; index += 1) {
  const prior = findings[index - 1];
  const current = findings[index];
  const priorityOrder = Number(prior.priority.slice(1)) - Number(current.priority.slice(1));
  const codeOrder = Buffer.compare(prior.code, current.code);
  const reviewerOrder = Buffer.compare(prior.reviewer, current.reviewer);
  assert(priorityOrder < 0 || (priorityOrder === 0 && (codeOrder < 0 || (codeOrder === 0 && reviewerOrder < 0))), "finding sort and uniqueness");
}

take("");
take("## Final verdict");
take("open-p0=0");
take("open-p1=0");
take("open-p2=0");
assert.equal(Number(parseCanonicalUnsigned(takeValue("all-finding-count"), 1024, "all findings")), findingCount);
take("verdict=PASS");
take("");
take("## Authority boundary");
take("specification-only; acceptance-effect=0; runtime-authority=0");
assert.equal(cursor, lines.length, "exact report grammar and EOF");

console.log(JSON.stringify({
  verdict: "PASS",
  reportSha256: sha256(report),
  reportBytes: report.length,
  successorSha256: successorSha,
  reviewBatchId: reportedBatch,
  unitCount,
  commandCount: totalCommands,
  findingCount,
  open: { p0: 0, p1: 0, p2: 0 },
}, null, 2));
