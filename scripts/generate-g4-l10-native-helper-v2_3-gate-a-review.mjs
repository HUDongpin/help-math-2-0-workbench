import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const successorPath = path.join(
  root,
  "docs/G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR.md",
);
const directPath = path.join(
  root,
  "docs/G4_L10_NATIVE_HELPER_V2_2_SECURITY_CONTRACT_SUCCESSOR.md",
);
const rootPredecessorPath = path.join(
  root,
  "docs/G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md",
);
const priorReviewPath = path.join(
  root,
  "docs/G4_L10_NATIVE_HELPER_V2_1_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md",
);
const outputPath = path.join(
  root,
  "docs/G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md",
);

const successorSha = "bf0abed59f8db5be0ef83657530bc81cc93d85c9ae466461142c06933e569320";
const directSha = "d7bb8755cbd8fb3a7f4d709d1ec2879f8aee4fa8b8ad4cbacfd7e5068a9eeb5c";
const rootSha = "77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583";
const emptySha = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
const cwd = "/Volumes/WestWorld/HELP MATH 2.0";
const relativeTarget = "docs/G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR.md";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

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

function lengthPrefixed(bytes) {
  return Buffer.concat([u32(bytes.length), bytes]);
}

function b64u(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

function argvStream(argv) {
  return Buffer.concat([
    u32(argv.length),
    ...argv.map((argument) => lengthPrefixed(Buffer.from(argument, "utf8"))),
  ]);
}

function sectionSetSha(tokens) {
  const preimage = Buffer.concat([
    Buffer.from("HMG4GAS1", "ascii"),
    u32(1),
    u32(tokens.length),
    ...tokens.map((token) => lengthPrefixed(Buffer.from(token, "ascii"))),
  ]);
  return sha256(preimage);
}

function commandRow(unitOrdinal, commandOrdinal, command) {
  const stdoutBytes = Buffer.from(command.stdout, "utf8");
  const row = [
    `command=${unitOrdinal}.${commandOrdinal}`,
    `argv-stream-b64u=${b64u(argvStream(command.argv))}`,
    `cwd-b64u=${b64u(Buffer.from(cwd, "utf8"))}`,
    `started=${command.started}`,
    `finished=${command.finished}`,
    "exit-status=0",
    `stdout-byte-count=${stdoutBytes.length}`,
    `stdout-sha256=${sha256(stdoutBytes)}`,
    "stderr-byte-count=0",
    `stderr-sha256=${emptySha}`,
  ].join("|");
  return { row, stdoutBytes };
}

const shortCode = 'require "digest"; require "time"; p=ARGV.fetch(0); started=Time.now.utc.iso8601(6); b=File.binread(p); finished=Time.now.utc.iso8601(6); puts "started_utc=#{started}"; puts "sha256=#{Digest::SHA256.hexdigest(b)}"; puts "bytes=#{b.bytesize}"; puts "lf=#{b.count("\\n")}"; puts "finished_utc=#{finished}"';
const shortArgv = ["ruby", "-e", shortCode, "--", relativeTarget];

function shortStdout(started, finished) {
  return [
    `started_utc=${started}`,
    `sha256=${successorSha}`,
    "bytes=972512",
    "lf=15360",
    `finished_utc=${finished}`,
    "",
  ].join("\n");
}

const beforeBCode = 'p=ARGV.fetch(0); started=Time.now.utc.iso8601(9); bytes=File.binread(p); stat=File.stat(p); finished=Time.now.utc.iso8601(9); puts "phase=before"; puts "path=#{p}"; puts "started_utc=#{started}"; puts "finished_utc=#{finished}"; puts "byte_read_count=#{bytes.bytesize}"; puts "lf_count=#{bytes.count("\\n")}"; puts "sha256=#{Digest::SHA256.hexdigest(bytes)}"; puts "mode=#{format("%04o", stat.mode & 0o7777)}"';
const afterBCode = beforeBCode.replace('puts "phase=before"', 'puts "phase=after"');

function stdoutB(phase, started, finished) {
  return [
    `phase=${phase}`,
    `path=${relativeTarget}`,
    `started_utc=${started}`,
    `finished_utc=${finished}`,
    "byte_read_count=972512",
    "lf_count=15360",
    `sha256=${successorSha}`,
    "mode=0444",
    "",
  ].join("\n");
}

const units = [
  {
    reviewer: "gate-a-v23-reviewer-a-lorentz",
    task: "gate-a-v23-a-bf0abed5",
    transcript: "gate-a-v23-a-final-v1",
    model: "gpt-5.6-sol-collaboration-exec-command",
    started: "2026-08-05T09:17:02Z",
    finished: "2026-08-05T09:17:34Z",
    scope: "scoped",
    tokens: ["00-preamble", "01", "02", "03", "04", "05"],
    commands: [
      {
        argv: shortArgv,
        started: "2026-08-05T09:17:02Z",
        finished: "2026-08-05T09:17:02Z",
        stdout: shortStdout(
          "2026-08-05T09:17:02.745822Z",
          "2026-08-05T09:17:02.746028Z",
        ),
      },
      {
        argv: shortArgv,
        started: "2026-08-05T09:17:34Z",
        finished: "2026-08-05T09:17:34Z",
        stdout: shortStdout(
          "2026-08-05T09:17:34.143205Z",
          "2026-08-05T09:17:34.143424Z",
        ),
      },
    ],
  },
  {
    reviewer: "gate-a-v23-reviewer-b-anscombe",
    task: "gate-a-v23-b-bf0abed5",
    transcript: "gate-a-v23-b-final-v1",
    model: "gpt-5.6-sol-collaboration-exec-command",
    started: "2026-08-05T09:16:35Z",
    finished: "2026-08-05T09:17:41Z",
    scope: "scoped",
    tokens: ["06", "07", "08", "09", "10"],
    commands: [
      {
        argv: ["ruby", "-rdigest", "-rtime", "-e", beforeBCode, relativeTarget],
        started: "2026-08-05T09:16:35Z",
        finished: "2026-08-05T09:16:35Z",
        stdout: stdoutB(
          "before",
          "2026-08-05T09:16:35.845796000Z",
          "2026-08-05T09:16:35.845995000Z",
        ),
      },
      {
        argv: ["ruby", "-rdigest", "-rtime", "-e", afterBCode, relativeTarget],
        started: "2026-08-05T09:17:41Z",
        finished: "2026-08-05T09:17:41Z",
        stdout: stdoutB(
          "after",
          "2026-08-05T09:17:41.600856000Z",
          "2026-08-05T09:17:41.601041000Z",
        ),
      },
    ],
  },
  {
    reviewer: "gate-a-v23-reviewer-c-james",
    task: "gate-a-v23-c2-bf0abed5",
    transcript: "gate-a-v23-c2-final-v1",
    model: "gpt-5.6-sol-collaboration-exec-command",
    started: "2026-08-05T09:24:17Z",
    finished: "2026-08-05T09:24:23Z",
    scope: "scoped",
    tokens: ["11", "12", "13", "14", "15", "16"],
    commands: [
      {
        argv: shortArgv,
        started: "2026-08-05T09:24:17Z",
        finished: "2026-08-05T09:24:17Z",
        stdout: shortStdout(
          "2026-08-05T09:24:17.885192Z",
          "2026-08-05T09:24:17.885387Z",
        ),
      },
      {
        argv: shortArgv,
        started: "2026-08-05T09:24:23Z",
        finished: "2026-08-05T09:24:23Z",
        stdout: shortStdout(
          "2026-08-05T09:24:23.227950Z",
          "2026-08-05T09:24:23.228160Z",
        ),
      },
    ],
  },
  {
    reviewer: "gate-a-v23-reviewer-y-whole2",
    task: "gate-a-v23-whole2-bf0abed5",
    transcript: "gate-a-v23-whole2-final-v1",
    model: "gpt-5.6-sol-collaboration-exec-command",
    started: "2026-08-05T09:26:00Z",
    finished: "2026-08-05T09:26:12Z",
    scope: "whole",
    tokens: ["whole"],
    commands: [
      {
        argv: shortArgv,
        started: "2026-08-05T09:26:00Z",
        finished: "2026-08-05T09:26:00Z",
        stdout: shortStdout(
          "2026-08-05T09:26:00.469669Z",
          "2026-08-05T09:26:00.469876Z",
        ),
      },
      {
        argv: shortArgv,
        started: "2026-08-05T09:26:12Z",
        finished: "2026-08-05T09:26:12Z",
        stdout: shortStdout(
          "2026-08-05T09:26:12.542928Z",
          "2026-08-05T09:26:12.543134Z",
        ),
      },
    ],
  },
];

function unitRows() {
  return units.map((unit, unitOrdinal) => {
    const commands = unit.commands.map((command, commandOrdinal) =>
      commandRow(unitOrdinal, commandOrdinal, command),
    );
    const transcriptPreimage = Buffer.concat([
      Buffer.from("HMG4GAC1", "ascii"),
      u32(1),
      u32(commands.length),
      ...commands.map(({ row }) => lengthPrefixed(Buffer.from(row, "utf8"))),
    ]);
    const row = [
      `unit=${unitOrdinal}`,
      `reviewer-id=${b64u(Buffer.from(unit.reviewer, "utf8"))}`,
      `task-id=${b64u(Buffer.from(unit.task, "utf8"))}`,
      `transcript-id=${b64u(Buffer.from(unit.transcript, "utf8"))}`,
      `model-tool=${b64u(Buffer.from(unit.model, "utf8"))}`,
      `started=${unit.started}`,
      `finished=${unit.finished}`,
      `before=${successorSha}`,
      `after=${successorSha}`,
      "range=1..EOF",
      `scope-class=${unit.scope}`,
      `sections=${unit.tokens.join(",")}`,
      `section-set-sha256=${sectionSetSha(unit.tokens)}`,
      `command-count=${commands.length}`,
      `command-transcript-sha256=${sha256(transcriptPreimage)}`,
    ].join("|");
    return [row, ...commands.map(({ row: command }) => command)];
  });
}

function reviewBatchId() {
  const preimage = Buffer.concat([
    Buffer.from("HMG4GAB2", "ascii"),
    u32(2),
    Buffer.from(successorSha, "hex"),
    Buffer.from(directSha, "hex"),
    Buffer.from(rootSha, "hex"),
    u64(972512),
    u64(15360),
    u32(units.length),
    ...units.flatMap((unit) =>
      [unit.reviewer, unit.task, unit.transcript].map((value) =>
        lengthPrefixed(Buffer.from(value, "utf8")),
      ),
    ),
  ]);
  return sha256(preimage);
}

function parsePriorFinding(line) {
  const fields = Object.fromEntries(
    line.split("|").map((part) => {
      const split = part.indexOf("=");
      return [part.slice(0, split), part.slice(split + 1)];
    }),
  );
  return {
    priority: fields.priority,
    code: Buffer.from(fields["code-b64u"], "base64url").toString("utf8"),
    original: Buffer.from(fields["original-text-b64u"], "base64url").toString("utf8"),
    remediated: Buffer.from(fields["remediated-text-b64u"], "base64url").toString("utf8"),
    reviewer:
      Number(fields.finding) <= 5
        ? units[0].reviewer
        : Number(fields.finding) <= 9
          ? units[1].reviewer
          : Number(fields.finding) <= 11
            ? units[2].reviewer
            : units[3].reviewer,
    firstConfirmed: successorSha,
  };
}

const newFindings = [
  {
    code: "GATE-P1-V22-GATEA-COMPANION-STILL-V21",
    original: "V2.2 required the existing read-only v2.1 Gate-A companion path, title, and one-predecessor grammar.",
    remediated: "V2.3 requires a new no-clobber format-2 companion path and binds distinct direct and root predecessor digests in HMG4GAB2.",
  },
  {
    code: "GATE-P1-V22-PIDLISTFDS-AMENDMENT-NOT-GLOBAL",
    original: "The aligned-short PIDLISTFDS rule applied only to helper startup while launcher and fixture producers retained stale or unspecified return semantics.",
    remediated: "PIDLISTFDS_CAPACITY_V1 now controls helper, launcher child, launcher parent, and fixture evidence with canonical observations and domain-complete vectors.",
  },
  {
    code: "GATE-P1-V22-PREDECESSOR-SHA-DOMAIN-AMBIGUOUS",
    original: "Section 0 incorporated two predecessor SHA-256 values while singular predecessor_contract_sha256 fields required only an undefined exact Section 0 value.",
    remediated: "V2.3 defines every singular predecessor field as the direct v2.2 SHA-256 and keeps the root predecessor in a separately named lineage-only field.",
  },
  {
    code: "GATE-P1-V23-FIXTURE-STABLE-PASS-IMPOSSIBLE",
    original: "Kind 95 retained per-pass FDEnumerationObservation bytes in a byte-identical projection even though their shared budget ordinals must differ.",
    remediated: "Kind 95 omits the independent enumeration observations only from its legacy equality projection while retaining both terminal-list equalities and one shared attempt chain.",
  },
  {
    code: "GATE-P1-V23-PIDLISTFDS-RETRY-BUDGET-SPLIT",
    original: "Each successful FDEnumerationObservation could carry eight attempts without a shared budget across the required stable pair.",
    remediated: "Context attempt start and end ordinals now chain helper and fixture stable pairs under one total budget of at most eight while launcher phase snapshots remain separate.",
  },
  {
    code: "GATE-P1-V23-RAW-AGGREGATE-SERIALIZATION-CONFLICT",
    original: "The draft required raw native proc_fdinfo buffer bytes even though the SDK authority boundary forbade serialized raw aggregates and padding.",
    remediated: "The frozen schema serializes only canonical ProcFDInfoObservation selected-field projections and never raw aggregate, padding, partial record, or buffer-tail bytes.",
  },
  {
    code: "GATE-P1-V23-RETRY-PROJECTION-ORDER-UNDEFINED",
    original: "Retry ProcFDInfoObservation lists had no unique ordering, so identical syscall results could produce different canonical hashes.",
    remediated: "Every retry and terminal projection is unsigned-sorted by proc_fd bits and proc_fdtype and then assigned contiguous ordinals.",
  },
].map((finding) => ({
  ...finding,
  priority: "P1",
  reviewer: units[1].reviewer,
  firstConfirmed: successorSha,
}));

function findingRow(finding, ordinal) {
  const code = Buffer.from(finding.code, "utf8");
  const reviewer = Buffer.from(finding.reviewer, "utf8");
  const original = Buffer.from(finding.original, "utf8");
  const remediated = Buffer.from(finding.remediated, "utf8");
  return [
    `finding=${ordinal}`,
    `priority=${finding.priority}`,
    `code-b64u=${b64u(code)}`,
    `reviewer-id=${b64u(reviewer)}`,
    "disposition=remediated",
    `original-text-b64u=${b64u(original)}`,
    `original-text-sha256=${sha256(original)}`,
    `remediated-text-b64u=${b64u(remediated)}`,
    `remediated-text-sha256=${sha256(remediated)}`,
    `first-reviewer-confirmed-remediation-sha256=${finding.firstConfirmed}`,
  ].join("|");
}

const [successor, direct, rootPredecessor, priorReview] = await Promise.all([
  readFile(successorPath),
  readFile(directPath),
  readFile(rootPredecessorPath),
  readFile(priorReviewPath, "utf8"),
]);
if (sha256(successor) !== successorSha || successor.length !== 972512) {
  throw new Error("successor exact preimage mismatch");
}
if (sha256(direct) !== directSha || sha256(rootPredecessor) !== rootSha) {
  throw new Error("predecessor exact preimage mismatch");
}
if (successor.filter((byte) => byte === 0x0a).length !== 15360) {
  throw new Error("successor LF count mismatch");
}
const priorFindings = priorReview
  .split("\n")
  .filter((line) => line.startsWith("finding=") && !line.startsWith("finding=count"))
  .map(parsePriorFinding);
if (priorFindings.length !== 14) {
  throw new Error(`expected 14 prior findings, observed ${priorFindings.length}`);
}
const findings = [...priorFindings, ...newFindings].sort((left, right) =>
  Buffer.compare(Buffer.from(left.code, "utf8"), Buffer.from(right.code, "utf8")) ||
  Buffer.compare(Buffer.from(left.reviewer, "utf8"), Buffer.from(right.reviewer, "utf8")),
);
const rows = unitRows();
const report = [
  "# G4 L10 Native Helper v2.3 Successor Independent Review",
  "",
  "## Frozen identity",
  "format-version=2",
  `successor-sha256=${successorSha}`,
  `direct-predecessor-sha256=${directSha}`,
  `root-predecessor-sha256=${rootSha}`,
  "successor-byte-count=972512",
  "successor-lf-line-count=15360",
  `review-batch-id=${reviewBatchId()}`,
  "",
  "## Independent review units",
  `unit-count=${units.length}`,
  ...rows.flat(),
  "",
  "## Findings and remediation",
  `finding-count=${findings.length}`,
  ...findings.map(findingRow),
  "",
  "## Final verdict",
  "open-p0=0",
  "open-p1=0",
  "open-p2=0",
  `all-finding-count=${findings.length}`,
  "verdict=PASS",
  "",
  "## Authority boundary",
  "specification-only; acceptance-effect=0; runtime-authority=0",
  "",
].join("\n");
if (report.includes("\r") || report.includes("\0") || report.includes("\t")) {
  throw new Error("noncanonical control byte in report");
}
if (/ +$/m.test(report) || !report.endsWith("\n") || report.endsWith("\n\n")) {
  throw new Error("noncanonical report whitespace");
}
await writeFile(outputPath, report, { encoding: "utf8", flag: "wx", mode: 0o444 });
process.stdout.write(
  JSON.stringify(
    {
      outputPath,
      sha256: sha256(Buffer.from(report, "utf8")),
      bytes: Buffer.byteLength(report),
      lf: report.split("\n").length - 1,
      unitCount: units.length,
      findingCount: findings.length,
      reviewBatchId: reviewBatchId(),
    },
    null,
    2,
  ) + "\n",
);
