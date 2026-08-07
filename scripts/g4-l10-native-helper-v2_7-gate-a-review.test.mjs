import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";

const successorPath = "docs/G4_L10_NATIVE_HELPER_V2_7_SECURITY_CONTRACT_SUCCESSOR.md";
const directPath = "docs/G4_L10_NATIVE_HELPER_V2_6_SECURITY_CONTRACT_SUCCESSOR.md";
const rootPath = "docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md";
const v23ReviewPath = "docs/G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md";
const reportPath = "docs/G4_L10_NATIVE_HELPER_V2_7_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md";

const expectedSuccessor = "72b28827b7c7baff358abea33c0b919c32953ec9bcb02f4f56a7534a4f78e4cc";
const expectedDirect = "3ce5bf0d79c003a78115be85828b0d36ca8e182e65d4329c58ba9aa3393c436a";
const expectedRoot = "77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583";
const expectedUnitIds = [
  "gate-a-v27-reviewer-a-schemas-authority",
  "gate-a-v27-reviewer-b-custody-review",
  "gate-a-v27-reviewer-z-whole",
];
const expectedScopes = [
  ["00-preamble", "01", "02", "03", "04", "05", "06", "07", "08"],
  ["09", "10", "11", "12", "13", "14", "15", "16"],
  ["whole"],
];
const expectedLaterFindings = new Map([
  ["V23-S64-TLV-ENCODING-UNDEFINED", "28f01dbd89956d3331c603f3cb9918a53419c3eb84e1868b285ee5ed231019b9"],
  ["V23-GLOBAL-TAG-TYPE-REGISTRY-NOT-FROZEN", "5c628191205083114eecd6645745d6a8621129069ededf2650049f68d2e800ce"],
  ["V24-GLOBAL-REGISTRY-DROPS-CONDITIONAL-TYPES", "5c628191205083114eecd6645745d6a8621129069ededf2650049f68d2e800ce"],
  ["V24-GLOBAL-REGISTRY-OMITS-INLINE-TAGS", "5c628191205083114eecd6645745d6a8621129069ededf2650049f68d2e800ce"],
  ["V23-DIRECT-PREDECESSOR-TYPE-LINEAGE-STALE", "28f01dbd89956d3331c603f3cb9918a53419c3eb84e1868b285ee5ed231019b9"],
  ["V25-REGRESSION-OMISSION-CARDINALITY-EXCLUDES-XATTR", expectedDirect],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const hex = /^[0-9a-f]{64}$/;
const b64uGrammar = /^[A-Za-z0-9_-]+$/;
const utf8 = new TextDecoder("utf-8", { fatal: true });

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

const lp = (bytes) => Buffer.concat([u32(bytes.length), bytes]);

function unsigned(value, maximum, label) {
  assert.match(value, /^(?:0|[1-9][0-9]*)$/, `${label}: canonical unsigned`);
  const result = BigInt(value);
  assert(result <= BigInt(maximum), `${label}: maximum`);
  return result;
}

function utc(value, label) {
  assert.match(value, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, `${label}: UTC grammar`);
  const millis = Date.parse(value);
  assert(!Number.isNaN(millis), `${label}: valid UTC`);
  assert.equal(new Date(millis).toISOString().slice(0, 19) + "Z", value, `${label}: canonical UTC`);
  return millis;
}

function b64u(value, label, minimum = 1, maximum = 16_777_216) {
  assert.match(value, b64uGrammar, `${label}: base64url grammar`);
  const bytes = Buffer.from(value, "base64url");
  assert.equal(bytes.toString("base64url"), value, `${label}: canonical base64url`);
  assert(bytes.length >= minimum && bytes.length <= maximum, `${label}: byte bound`);
  return bytes;
}

function identity(value, label) {
  const bytes = b64u(value, label, 1, 4096);
  const decoded = utf8.decode(bytes);
  assert(!/[\0\r\n\t]/.test(decoded), `${label}: forbidden byte`);
  return bytes;
}

function fields(line, names, label) {
  const parts = line.split("|");
  assert.equal(parts.length, names.length, `${label}: field count`);
  return Object.fromEntries(names.map((name, index) => {
    assert(parts[index].startsWith(`${name}=`), `${label}: ${name}`);
    return [name, parts[index].slice(name.length + 1)];
  }));
}

function parseArgv(encoded, label) {
  const bytes = b64u(encoded, label, 4, 1_049_604);
  let offset = 0;
  const count = bytes.readUInt32BE(offset);
  offset += 4;
  assert(count >= 1 && count <= 256, `${label}: argument count`);
  let aggregate = 0;
  for (let ordinal = 0; ordinal < count; ordinal += 1) {
    assert(offset + 4 <= bytes.length, `${label}: length header`);
    const length = bytes.readUInt32BE(offset);
    offset += 4;
    assert(length >= 1 && length <= 1_048_576, `${label}: argument length`);
    assert(offset + length <= bytes.length, `${label}: argument extent`);
    const argument = bytes.subarray(offset, offset + length);
    offset += length;
    aggregate += length;
    assert(!/[\0\r]/.test(utf8.decode(argument)), `${label}: argument hygiene`);
  }
  assert.equal(offset, bytes.length, `${label}: exact extent`);
  assert(aggregate <= 1_048_576, `${label}: aggregate bound`);
}

function rawFields(line) {
  return Object.fromEntries(line.split("|").map((part) => {
    const split = part.indexOf("=");
    return [part.slice(0, split), part.slice(split + 1)];
  }));
}

const [successor, direct, root, v23Review, report, reportStat] = await Promise.all([
  readFile(successorPath),
  readFile(directPath),
  readFile(rootPath),
  readFile(v23ReviewPath, "utf8"),
  readFile(reportPath),
  stat(reportPath),
]);
assert.equal(sha256(successor), expectedSuccessor);
assert.equal(sha256(direct), expectedDirect);
assert.equal(sha256(root), expectedRoot);
assert.equal(successor.length, 9515);
assert.equal(successor.reduce((sum, byte) => sum + (byte === 10 ? 1 : 0), 0), 194);
assert.equal(reportStat.mode & 0o7777, 0o444, "review mode 0444");
assert(report.length > 0 && report.length <= 16_777_216, "review size bound");
assert.equal(report.at(-1), 10, "one final LF");
assert.notEqual(report.at(-2), 10, "not two final LFs");
assert(!report.includes(0) && !report.includes(9) && !report.includes(13), "review byte hygiene");
assert(!/ +$/m.test(utf8.decode(report)), "review trailing whitespace");

const lines = utf8.decode(report).slice(0, -1).split("\n");
let cursor = 0;
const take = (expected) => assert.equal(lines[cursor++], expected, `line ${cursor}`);
const value = (name) => {
  const prefix = `${name}=`;
  assert(lines[cursor].startsWith(prefix), `line ${cursor + 1}: ${name}`);
  return lines[cursor++].slice(prefix.length);
};

take("# G4 L10 Native Helper v2.7 Successor Independent Review");
take("");
take("## Frozen identity");
take("format-version=2");
const successorSha = value("successor-sha256");
const directSha = value("direct-predecessor-sha256");
const rootSha = value("root-predecessor-sha256");
const bytes = value("successor-byte-count");
const lf = value("successor-lf-line-count");
const batch = value("review-batch-id");
assert.equal(successorSha, expectedSuccessor);
assert.equal(directSha, expectedDirect);
assert.equal(rootSha, expectedRoot);
assert.equal(unsigned(bytes, 2n ** 64n - 1n, "bytes"), 9515n);
assert.equal(unsigned(lf, 2n ** 64n - 1n, "LF"), 194n);
assert.match(batch, hex);

take("");
take("## Independent review units");
assert.equal(unsigned(value("unit-count"), 3, "unit count"), 3n);
const unitNames = [
  "unit", "reviewer-id", "task-id", "transcript-id", "model-tool", "started", "finished",
  "before", "after", "range", "scope-class", "sections", "section-set-sha256",
  "command-count", "command-transcript-sha256",
];
const commandNames = [
  "command", "argv-stream-b64u", "cwd-b64u", "started", "finished", "exit-status",
  "stdout-byte-count", "stdout-sha256", "stderr-byte-count", "stderr-sha256",
];
const units = [];
for (let unitOrdinal = 0; unitOrdinal < 3; unitOrdinal += 1) {
  const unit = fields(lines[cursor++], unitNames, `unit ${unitOrdinal}`);
  assert.equal(unit.unit, String(unitOrdinal));
  const reviewer = identity(unit["reviewer-id"], `unit ${unitOrdinal} reviewer`);
  const reviewerText = utf8.decode(reviewer);
  assert.equal(reviewerText, expectedUnitIds[unitOrdinal]);
  const task = identity(unit["task-id"], `unit ${unitOrdinal} task`);
  const transcript = identity(unit["transcript-id"], `unit ${unitOrdinal} transcript`);
  identity(unit["model-tool"], `unit ${unitOrdinal} model`);
  const started = utc(unit.started, `unit ${unitOrdinal} started`);
  const finished = utc(unit.finished, `unit ${unitOrdinal} finished`);
  assert(started <= finished);
  assert.equal(unit.before, expectedSuccessor);
  assert.equal(unit.after, expectedSuccessor);
  assert.equal(unit.range, "1..EOF");
  assert.equal(unit["scope-class"], unitOrdinal === 2 ? "whole" : "scoped");
  const tokens = unit.sections.split(",");
  assert.deepEqual(tokens, expectedScopes[unitOrdinal]);
  const sectionPreimage = Buffer.concat([
    Buffer.from("HMG4GAS1", "ascii"), u32(1), u32(tokens.length),
    ...tokens.map((token) => lp(Buffer.from(token, "ascii"))),
  ]);
  assert.equal(sha256(sectionPreimage), unit["section-set-sha256"]);
  const commandCount = Number(unsigned(unit["command-count"], 256, "command count"));
  assert(commandCount >= 1);
  const commandRows = [];
  for (let commandOrdinal = 0; commandOrdinal < commandCount; commandOrdinal += 1) {
    const line = lines[cursor++];
    const command = fields(line, commandNames, `command ${unitOrdinal}.${commandOrdinal}`);
    assert.equal(command.command, `${unitOrdinal}.${commandOrdinal}`);
    parseArgv(command["argv-stream-b64u"], `command ${unitOrdinal}.${commandOrdinal} argv`);
    identity(command["cwd-b64u"], `command ${unitOrdinal}.${commandOrdinal} cwd`);
    const commandStarted = utc(command.started, "command started");
    const commandFinished = utc(command.finished, "command finished");
    assert(started <= commandStarted && commandStarted <= commandFinished && commandFinished <= finished);
    assert.equal(command["exit-status"], "0");
    unsigned(command["stdout-byte-count"], 16_777_216, "stdout bytes");
    unsigned(command["stderr-byte-count"], 16_777_216, "stderr bytes");
    assert.match(command["stdout-sha256"], hex);
    assert.match(command["stderr-sha256"], hex);
    commandRows.push(line);
  }
  const transcriptPreimage = Buffer.concat([
    Buffer.from("HMG4GAC1", "ascii"), u32(1), u32(commandRows.length),
    ...commandRows.map((line) => lp(Buffer.from(line, "utf8"))),
  ]);
  assert.equal(sha256(transcriptPreimage), unit["command-transcript-sha256"]);
  units.push({ ...unit, reviewer, task, transcript, tokens });
}
for (const property of ["reviewer", "task", "transcript"]) {
  assert.equal(new Set(units.map((unit) => unit[property].toString("hex"))).size, 3, `${property} unique`);
}
assert(Buffer.compare(units[0].reviewer, units[1].reviewer) < 0);
assert(Buffer.compare(units[1].reviewer, units[2].reviewer) < 0);
const scopedTokens = [...units[0].tokens, ...units[1].tokens];
assert.equal(new Set(scopedTokens).size, 17, "scoped disjoint");
assert.deepEqual(scopedTokens, ["00-preamble", ...Array.from({ length: 16 }, (_, index) => String(index + 1).padStart(2, "0"))]);

const batchPreimage = Buffer.concat([
  Buffer.from("HMG4GAB2", "ascii"), u32(2), Buffer.from(successorSha, "hex"),
  Buffer.from(directSha, "hex"), Buffer.from(rootSha, "hex"), u64(bytes), u64(lf), u32(3),
  ...units.flatMap((unit) => [lp(unit.reviewer), lp(unit.task), lp(unit.transcript)]),
]);
assert.equal(sha256(batchPreimage), batch, "review batch preimage");

take("");
take("## Findings and remediation");
assert.equal(unsigned(value("finding-count"), 1024, "finding count"), 27n);
const findingNames = [
  "finding", "priority", "code-b64u", "reviewer-id", "disposition", "original-text-b64u",
  "original-text-sha256", "remediated-text-b64u", "remediated-text-sha256",
  "first-reviewer-confirmed-remediation-sha256",
];
const currentReviewerIds = new Set(units.map((unit) => unit["reviewer-id"]));
const findings = [];
for (let ordinal = 0; ordinal < 27; ordinal += 1) {
  const finding = fields(lines[cursor++], findingNames, `finding ${ordinal}`);
  assert.equal(finding.finding, String(ordinal));
  assert(["P0", "P1", "P2"].includes(finding.priority));
  assert(currentReviewerIds.has(finding["reviewer-id"]), "current reviewer attribution");
  assert.equal(finding.disposition, "remediated");
  const code = identity(finding["code-b64u"], `finding ${ordinal} code`);
  const reviewer = identity(finding["reviewer-id"], `finding ${ordinal} reviewer`);
  const original = b64u(finding["original-text-b64u"], `finding ${ordinal} original`);
  const remediated = b64u(finding["remediated-text-b64u"], `finding ${ordinal} remediated`);
  utf8.decode(original);
  utf8.decode(remediated);
  assert.equal(sha256(original), finding["original-text-sha256"]);
  assert.equal(sha256(remediated), finding["remediated-text-sha256"]);
  assert.match(finding["first-reviewer-confirmed-remediation-sha256"], hex);
  findings.push({ ...finding, code, reviewer });
}
assert.equal(new Set(findings.map((finding) => finding.code.toString("hex"))).size, 27, "finding codes unique");
for (let index = 1; index < findings.length; index += 1) {
  const prior = findings[index - 1];
  const current = findings[index];
  const p = Number(prior.priority.slice(1)) - Number(current.priority.slice(1));
  const c = Buffer.compare(prior.code, current.code);
  const r = Buffer.compare(prior.reviewer, current.reviewer);
  assert(p < 0 || (p === 0 && (c < 0 || (c === 0 && r < 0))), "finding sort");
}

const v23Rows = v23Review.split("\n").filter((line) => line.startsWith("finding=") && !line.startsWith("finding=count"));
assert.equal(v23Rows.length, 21);
const v23ByCode = new Map(v23Rows.map((line) => {
  const row = rawFields(line);
  return [Buffer.from(row["code-b64u"], "base64url").toString("utf8"), row];
}));
for (const finding of findings) {
  const code = utf8.decode(finding.code);
  const prior = v23ByCode.get(code);
  if (prior) {
    for (const name of ["priority", "code-b64u", "original-text-b64u", "original-text-sha256", "remediated-text-b64u", "remediated-text-sha256", "first-reviewer-confirmed-remediation-sha256"]) {
      assert.equal(finding[name], prior[name], `${code}: frozen v2.3 ${name}`);
    }
  } else {
    assert.equal(finding["first-reviewer-confirmed-remediation-sha256"], expectedLaterFindings.get(code), `${code}: later first-confirmed hash`);
  }
}
assert.equal([...findings].filter((finding) => expectedLaterFindings.has(utf8.decode(finding.code))).length, 6);

take("");
take("## Final verdict");
take("open-p0=0");
take("open-p1=0");
take("open-p2=0");
take("all-finding-count=27");
take("verdict=PASS");
take("");
take("## Authority boundary");
take("specification-only; acceptance-effect=0; runtime-authority=0");
assert.equal(cursor, lines.length, "exact grammar and EOF");

console.log(JSON.stringify({
  verdict: "PASS",
  reportSha256: sha256(report),
  reportBytes: report.length,
  successorSha256: successorSha,
  reviewBatchId: batch,
  unitCount: 3,
  findingCount: 27,
  open: { p0: 0, p1: 0, p2: 0 },
}, null, 2));
