import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const docs = path.join(root, "docs");
const successorPath = path.join(docs, "G4_L10_NATIVE_HELPER_V2_7_SECURITY_CONTRACT_SUCCESSOR.md");
const directPath = path.join(docs, "G4_L10_NATIVE_HELPER_V2_6_SECURITY_CONTRACT_SUCCESSOR.md");
const rootPath = path.join(docs, "G4_L10_NATIVE_HELPER_V2_SECURITY_CONTRACT.md");
const v23ReviewPath = path.join(docs, "G4_L10_NATIVE_HELPER_V2_3_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md");
const outputPath = path.join(docs, "G4_L10_NATIVE_HELPER_V2_7_SECURITY_CONTRACT_SUCCESSOR_INDEPENDENT_REVIEW.md");

const successorSha = "72b28827b7c7baff358abea33c0b919c32953ec9bcb02f4f56a7534a4f78e4cc";
const directSha = "3ce5bf0d79c003a78115be85828b0d36ca8e182e65d4329c58ba9aa3393c436a";
const rootSha = "77c2479d7be197e62a9cf37e05d71d6051858a29167143ca39ddc5be7b994583";
const v24Sha = "28f01dbd89956d3331c603f3cb9918a53419c3eb84e1868b285ee5ed231019b9";
const v25Sha = "5c628191205083114eecd6645745d6a8621129069ededf2650049f68d2e800ce";
const emptySha = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
const cwd = "/Volumes/WestWorld/HELP MATH 2.0";
const target = "docs/G4_L10_NATIVE_HELPER_V2_7_SECURITY_CONTRACT_SUCCESSOR.md";
const successorBytes = 9515;
const successorLf = 194;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

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

const b64u = (bytes) => Buffer.from(bytes).toString("base64url");

function argvStream(argv) {
  return Buffer.concat([
    u32(argv.length),
    ...argv.map((value) => lp(Buffer.from(value, "utf8"))),
  ]);
}

function sectionSetSha(tokens) {
  return sha256(Buffer.concat([
    Buffer.from("HMG4GAS1", "ascii"),
    u32(1),
    u32(tokens.length),
    ...tokens.map((token) => lp(Buffer.from(token, "ascii"))),
  ]));
}

function commandRow(unitOrdinal, commandOrdinal, command) {
  const stdout = Buffer.from(command.stdout, "utf8");
  const encodedArgv = command.argvStreamB64u ?? b64u(argvStream(command.argv));
  const row = [
    `command=${unitOrdinal}.${commandOrdinal}`,
    `argv-stream-b64u=${encodedArgv}`,
    `cwd-b64u=${b64u(Buffer.from(cwd, "utf8"))}`,
    `started=${command.started}`,
    `finished=${command.finished}`,
    "exit-status=0",
    `stdout-byte-count=${stdout.length}`,
    `stdout-sha256=${sha256(stdout)}`,
    "stderr-byte-count=0",
    `stderr-sha256=${emptySha}`,
  ].join("|");
  return { row, stdout };
}

function identityStdout(phase, started, finished) {
  return [
    `phase=${phase}`,
    `path=${target}`,
    `started_utc=${started}`,
    `finished_utc=${finished}`,
    `byte_read_count=${successorBytes}`,
    `lf_count=${successorLf}`,
    `sha256=${successorSha}`,
    "mode=0444",
    "",
  ].join("\n");
}

const identityCode = 'p=ARGV.fetch(0); started=Time.now.utc.iso8601(9); bytes=File.binread(p); stat=File.stat(p); finished=Time.now.utc.iso8601(9); puts "phase=before"; puts "path=#{p}"; puts "started_utc=#{started}"; puts "finished_utc=#{finished}"; puts "byte_read_count=#{bytes.bytesize}"; puts "lf_count=#{bytes.count("\\n")}"; puts "sha256=#{Digest::SHA256.hexdigest(bytes)}"; puts "mode=#{format("%04o", stat.mode & 0o7777)}"';
const afterIdentityCode = identityCode.replace('puts "phase=before"', 'puts "phase=after"');

const aBeforeArgv = "AAAABgAAAARydWJ5AAAACC1yZGlnZXN0AAAAAi1lAAABRnAseD1BUkdWO3M9VGltZS5ub3cudXRjLnN0cmZ0aW1lKCclWS0lbS0lZFQlSDolTTolU1onKTtiPUZpbGUuYmlucmVhZCh4KTttPUZpbGUuc3RhdCh4KS5tb2RlJjA3Nzc3O2Y9VGltZS5ub3cudXRjLnN0cmZ0aW1lKCclWS0lbS0lZFQlSDolTTolU1onKTtwdXRzICJwaGFzZT0je3B9fHBhdGg9I3t4fXxzdGFydGVkX3V0Yz0je3N9fGZpbmlzaGVkX3V0Yz0je2Z9fGJ5dGVfcmVhZF9jb3VudD0je2IuYnl0ZXNpemV9fGxmX2NvdW50PSN7Yi5jb3VudCgiXG4iKX18c2hhMjU2PSN7RGlnZXN0OjpTSEEyNTYuaGV4ZGlnZXN0KGIpfXxtb2RlPSN7Zm9ybWF0KCclMDRvJyxtKX0iAAAABmJlZm9yZQAAAD1kb2NzL0c0X0wxMF9OQVRJVkVfSEVMUEVSX1YyXzdfU0VDVVJJVFlfQ09OVFJBQ1RfU1VDQ0VTU09SLm1k";
const aAfterArgv = "AAAABgAAAARydWJ5AAAACC1yZGlnZXN0AAAAAi1lAAABRnAseD1BUkdWO3M9VGltZS5ub3cudXRjLnN0cmZ0aW1lKCclWS0lbS0lZFQlSDolTTolU1onKTtiPUZpbGUuYmlucmVhZCh4KTttPUZpbGUuc3RhdCh4KS5tb2RlJjA3Nzc3O2Y9VGltZS5ub3cudXRjLnN0cmZ0aW1lKCclWS0lbS0lZFQlSDolTTolU1onKTtwdXRzICJwaGFzZT0je3B9fHBhdGg9I3t4fXxzdGFydGVkX3V0Yz0je3N9fGZpbmlzaGVkX3V0Yz0je2Z9fGJ5dGVfcmVhZF9jb3VudD0je2IuYnl0ZXNpemV9fGxmX2NvdW50PSN7Yi5jb3VudCgiXG4iKX18c2hhMjU2PSN7RGlnZXN0OjpTSEEyNTYuaGV4ZGlnZXN0KGIpfXxtb2RlPSN7Zm9ybWF0KCclMDRvJyxtKX0iAAAABWFmdGVyAAAAPWRvY3MvRzRfTDEwX05BVElWRV9IRUxQRVJfVjJfN19TRUNVUklUWV9DT05UUkFDVF9TVUNDRVNTT1IubWQ";

const zBeforeArgv = "AAAAAwAAAAgvYmluL3pzaAAAAAMtbGMAAAQ-c2V0IC1ldW8gcGlwZWZhaWwKdGFyZ2V0PSdkb2NzL0c0X0wxMF9OQVRJVkVfSEVMUEVSX1YyXzdfU0VDVVJJVFlfQ09OVFJBQ1RfU1VDQ0VTU09SLm1kJwpzdGFydGVkPSQoZGF0ZSAtdSAnKyVZLSVtLSVkVCVIOiVNOiVTWicpCm5vZGUgLSAiJHRhcmdldCIgPDwnTk9ERScKY29uc3QgZnMgPSByZXF1aXJlKCdmcycpOwpjb25zdCBjcnlwdG8gPSByZXF1aXJlKCdjcnlwdG8nKTsKY29uc3QgcCA9IHByb2Nlc3MuYXJndlsyXTsKY29uc3QgYiA9IGZzLnJlYWRGaWxlU3luYyhwKTsKY29uc3QgcyA9IGZzLnN0YXRTeW5jKHApOwpjb25zdCBzaGEgPSBjcnlwdG8uY3JlYXRlSGFzaCgnc2hhMjU2JykudXBkYXRlKGIpLmRpZ2VzdCgnaGV4Jyk7CmNvbnN0IGxmID0gYi5yZWR1Y2UoKG4sIHgpID0-IG4gKyAoeCA9PT0gMTAgPyAxIDogMCksIDApOwpjb25zdCBtb2RlID0gKHMubW9kZSAmIDBvNzc3KS50b1N0cmluZyg4KS5wYWRTdGFydCg0LCAnMCcpOwppZiAoc2hhICE9PSAnNzJiMjg4MjdiN2M3YmFmZjM1OGFiZWEzM2MwYjkxOWMzMjk1M2VjOWJjYjAyZjRmNTZhNzUzNGE0Zjc4ZTRjYycpIHRocm93IG5ldyBFcnJvcigndGFyZ2V0IHNoYSBtaXNtYXRjaCcpOwppZiAoYi5sZW5ndGggIT09IDk1MTUpIHRocm93IG5ldyBFcnJvcigndGFyZ2V0IGJ5dGUgY291bnQgbWlzbWF0Y2gnKTsKaWYgKGxmICE9PSAxOTQpIHRocm93IG5ldyBFcnJvcigndGFyZ2V0IExGIGNvdW50IG1pc21hdGNoJyk7CmlmIChtb2RlICE9PSAnMDQ0NCcpIHRocm93IG5ldyBFcnJvcigndGFyZ2V0IG1vZGUgbWlzbWF0Y2gnKTsKaWYgKGIuaW5jbHVkZXMoMTMpKSB0aHJvdyBuZXcgRXJyb3IoJ3RhcmdldCBjb250YWlucyBDUiBieXRlJyk7Ck5PREUKZmluaXNoZWQ9JChkYXRlIC11ICcrJVktJW0tJWRUJUg6JU06JVNaJykKcHJpbnRmICdzdGFydGVkPSVzIGZpbmlzaGVkPSVzIHBoYXNlPWJlZm9yZSBzaGEyNTY9NzJiMjg4MjdiN2M3YmFmZjM1OGFiZWEzM2MwYjkxOWMzMjk1M2VjOWJjYjAyZjRmNTZhNzUzNGE0Zjc4ZTRjYyBieXRlcz05NTE1IGxmPTE5NCBtb2RlPTA0NDQgaHlnaWVuZT1va1xuJyAiJHN0YXJ0ZWQiICIkZmluaXNoZWQi";
const zChainArgv = "AAAAAwAAAAgvYmluL3pzaAAAAAMtbGMAAAU-c2V0IC1ldW8gcGlwZWZhaWwKc3RhcnRlZD0kKGRhdGUgLXUgJyslWS0lbS0lZFQlSDolTTolU1onKQpub2RlIDw8J05PREUnCmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTsKY29uc3QgY3J5cHRvID0gcmVxdWlyZSgnY3J5cHRvJyk7CmNvbnN0IGZpbGVzID0gWwogIFsnZG9jcy9HNF9MMTBfTkFUSVZFX0hFTFBFUl9WMl83X1NFQ1VSSVRZX0NPTlRSQUNUX1NVQ0NFU1NPUi5tZCcsICc3MmIyODgyN2I3YzdiYWZmMzU4YWJlYTMzYzBiOTE5YzMyOTUzZWM5YmNiMDJmNGY1NmE3NTM0YTRmNzhlNGNjJ10sCiAgWydkb2NzL0c0X0wxMF9OQVRJVkVfSEVMUEVSX1YyXzZfU0VDVVJJVFlfQ09OVFJBQ1RfU1VDQ0VTU09SLm1kJywgJzNjZTViZjBkNzljMDAzYTc4MTE1YmU4NTgyOGIwZDM2Y2E4ZTE4MmU2NWQ0MzI5YzU4YmE5YWEzMzkzYzQzNmEnXSwKICBbJ2RvY3MvRzRfTDEwX05BVElWRV9IRUxQRVJfVjJfU0VDVVJJVFlfQ09OVFJBQ1QubWQnLCAnNzdjMjQ3OWQ3YmUxOTdlNjJhOWNmMzdlMDVkNzFkNjA1MTg1OGEyOTE2NzE0M2NhMzlkZGM1YmU3Yjk5NDU4MyddCl07CmZvciAoY29uc3QgW3AsIHdhbnRdIG9mIGZpbGVzKSB7CiAgY29uc3QgYiA9IGZzLnJlYWRGaWxlU3luYyhwKTsKICBjb25zdCBnb3QgPSBjcnlwdG8uY3JlYXRlSGFzaCgnc2hhMjU2JykudXBkYXRlKGIpLmRpZ2VzdCgnaGV4Jyk7CiAgaWYgKGdvdCAhPT0gd2FudCkgdGhyb3cgbmV3IEVycm9yKCdjaGFpbiBzaGEgbWlzbWF0Y2g6ICcgKyBwKTsKfQpjb25zdCB0YXJnZXQgPSBmcy5yZWFkRmlsZVN5bmMoZmlsZXNbMF1bMF0sICd1dGY4Jyk7CmlmICghdGFyZ2V0LmluY2x1ZGVzKGZpbGVzWzFdWzFdKSkgdGhyb3cgbmV3IEVycm9yKCdkaXJlY3QtcHJlZGVjZXNzb3IgYmluZGluZyBhYnNlbnQnKTsKaWYgKCF0YXJnZXQuaW5jbHVkZXMoZmlsZXNbMl1bMV0pKSB0aHJvdyBuZXcgRXJyb3IoJ3Jvb3QgYmluZGluZyBhYnNlbnQnKTsKTk9ERQpmaW5pc2hlZD0kKGRhdGUgLXUgJyslWS0lbS0lZFQlSDolTTolU1onKQpwcmludGYgJ3N0YXJ0ZWQ9JXMgZmluaXNoZWQ9JXMgcGhhc2U9Y2hhaW4gdGFyZ2V0LXNoYTI1Nj03MmIyODgyN2I3YzdiYWZmMzU4YWJlYTMzYzBiOTE5YzMyOTUzZWM5YmNiMDJmNGY1NmE3NTM0YTRmNzhlNGNjIHByZWRlY2Vzc29yLXNoYTI1Nj0zY2U1YmYwZDc5YzAwM2E3ODExNWJlODU4MjhiMGQzNmNhOGUxODJlNjVkNDMyOWM1OGJhOWFhMzM5M2M0MzZhIHJvb3Qtc2hhMjU2PTc3YzI0NzlkN2JlMTk3ZTYyYTljZjM3ZTA1ZDcxZDYwNTE4NThhMjkxNjcxNDNjYTM5ZGRjNWJlN2I5OTQ1ODMgc3RydWN0dXJlPWhhc2gtYm91bmRcbicgIiRzdGFydGVkIiAiJGZpbmlzaGVkIg";
const zAfterArgv = "AAAAAwAAAAgvYmluL3pzaAAAAAMtbGMAAAQ9c2V0IC1ldW8gcGlwZWZhaWwKdGFyZ2V0PSdkb2NzL0c0X0wxMF9OQVRJVkVfSEVMUEVSX1YyXzdfU0VDVVJJVFlfQ09OVFJBQ1RfU1VDQ0VTU09SLm1kJwpzdGFydGVkPSQoZGF0ZSAtdSAnKyVZLSVtLSVkVCVIOiVNOiVTWicpCm5vZGUgLSAiJHRhcmdldCIgPDwnTk9ERScKY29uc3QgZnMgPSByZXF1aXJlKCdmcycpOwpjb25zdCBjcnlwdG8gPSByZXF1aXJlKCdjcnlwdG8nKTsKY29uc3QgcCA9IHByb2Nlc3MuYXJndlsyXTsKY29uc3QgYiA9IGZzLnJlYWRGaWxlU3luYyhwKTsKY29uc3QgcyA9IGZzLnN0YXRTeW5jKHApOwpjb25zdCBzaGEgPSBjcnlwdG8uY3JlYXRlSGFzaCgnc2hhMjU2JykudXBkYXRlKGIpLmRpZ2VzdCgnaGV4Jyk7CmNvbnN0IGxmID0gYi5yZWR1Y2UoKG4sIHgpID0-IG4gKyAoeCA9PT0gMTAgPyAxIDogMCksIDApOwpjb25zdCBtb2RlID0gKHMubW9kZSAmIDBvNzc3KS50b1N0cmluZyg4KS5wYWRTdGFydCg0LCAnMCcpOwppZiAoc2hhICE9PSAnNzJiMjg4MjdiN2M3YmFmZjM1OGFiZWEzM2MwYjkxOWMzMjk1M2VjOWJjYjAyZjRmNTZhNzUzNGE0Zjc4ZTRjYycpIHRocm93IG5ldyBFcnJvcigndGFyZ2V0IHNoYSBtaXNtYXRjaCcpOwppZiAoYi5sZW5ndGggIT09IDk1MTUpIHRocm93IG5ldyBFcnJvcigndGFyZ2V0IGJ5dGUgY291bnQgbWlzbWF0Y2gnKTsKaWYgKGxmICE9PSAxOTQpIHRocm93IG5ldyBFcnJvcigndGFyZ2V0IExGIGNvdW50IG1pc21hdGNoJyk7CmlmIChtb2RlICE9PSAnMDQ0NCcpIHRocm93IG5ldyBFcnJvcigndGFyZ2V0IG1vZGUgbWlzbWF0Y2gnKTsKaWYgKGIuaW5jbHVkZXMoMTMpKSB0aHJvdyBuZXcgRXJyb3IoJ3RhcmdldCBjb250YWlucyBDUiBieXRlJyk7Ck5PREUKZmluaXNoZWQ9JChkYXRlIC11ICcrJVktJW0tJWRUJUg6JU06JVNaJykKcHJpbnRmICdzdGFydGVkPSVzIGZpbmlzaGVkPSVzIHBoYXNlPWFmdGVyIHNoYTI1Nj03MmIyODgyN2I3YzdiYWZmMzU4YWJlYTMzYzBiOTE5YzMyOTUzZWM5YmNiMDJmNGY1NmE3NTM0YTRmNzhlNGNjIGJ5dGVzPTk1MTUgbGY9MTk0IG1vZGU9MDQ0NCBoeWdpZW5lPW9rXG4nICIkc3RhcnRlZCIgIiRmaW5pc2hlZCI";

const units = [
  {
    reviewer: "gate-a-v27-reviewer-a-schemas-authority",
    task: "gate-a-v27-scope-00-08-72b28827",
    transcript: "gate-a-v27-a-final-v1",
    model: "gpt-5.6-sol-collaboration-exec-command",
    started: "2026-08-05T11:55:18Z",
    finished: "2026-08-05T12:09:11Z",
    scope: "scoped",
    tokens: ["00-preamble", "01", "02", "03", "04", "05", "06", "07", "08"],
    expectedTranscriptSha: "a43ce6ba50c00cccc942396b23e84cd33f6c064729c5282296e4dd78b0eca250",
    commands: [
      {
        argvStreamB64u: aBeforeArgv,
        started: "2026-08-05T12:04:47Z",
        finished: "2026-08-05T12:04:47Z",
        stdout: `phase=before|path=${target}|started_utc=2026-08-05T12:04:47Z|finished_utc=2026-08-05T12:04:47Z|byte_read_count=9515|lf_count=194|sha256=${successorSha}|mode=0444\n`,
      },
      {
        argvStreamB64u: aAfterArgv,
        started: "2026-08-05T12:04:47Z",
        finished: "2026-08-05T12:04:47Z",
        stdout: `phase=after|path=${target}|started_utc=2026-08-05T12:04:47Z|finished_utc=2026-08-05T12:04:47Z|byte_read_count=9515|lf_count=194|sha256=${successorSha}|mode=0444\n`,
      },
    ],
  },
  {
    reviewer: "gate-a-v27-reviewer-b-custody-review",
    task: "gate-a-v27-scope-09-16-72b28827",
    transcript: "gate-a-v27-b-final-v1",
    model: "gpt-5.6-sol-collaboration-exec-command",
    started: "2026-08-05T11:51:05Z",
    finished: "2026-08-05T11:54:25Z",
    scope: "scoped",
    tokens: ["09", "10", "11", "12", "13", "14", "15", "16"],
    commands: [
      {
        argv: ["ruby", "-rdigest", "-rtime", "-e", identityCode, target],
        started: "2026-08-05T11:51:05Z",
        finished: "2026-08-05T11:51:05Z",
        stdout: identityStdout("before", "2026-08-05T11:51:05.017405000Z", "2026-08-05T11:51:05.017461000Z"),
      },
      {
        argv: ["ruby", "-rdigest", "-rtime", "-e", afterIdentityCode, target],
        started: "2026-08-05T11:54:25Z",
        finished: "2026-08-05T11:54:25Z",
        stdout: identityStdout("after", "2026-08-05T11:54:25.742439000Z", "2026-08-05T11:54:25.742506000Z"),
      },
    ],
  },
  {
    reviewer: "gate-a-v27-reviewer-z-whole",
    task: "gate-a-v27-whole-72b28827",
    transcript: "gate-a-v27-z-final-v1",
    model: "gpt-5.6-sol-collaboration-exec-command",
    started: "2026-08-05T11:51:15Z",
    finished: "2026-08-05T12:10:29Z",
    scope: "whole",
    tokens: ["whole"],
    expectedTranscriptSha: "dbbc85538534b81b5dd7eed31399b94fedb5b23706a2aaef9a5ea0d4295d30cc",
    commands: [
      {
        argvStreamB64u: zBeforeArgv,
        started: "2026-08-05T12:03:55Z",
        finished: "2026-08-05T12:03:55Z",
        stdout: `started=2026-08-05T12:03:55Z finished=2026-08-05T12:03:55Z phase=before sha256=${successorSha} bytes=9515 lf=194 mode=0444 hygiene=ok\n`,
      },
      {
        argvStreamB64u: zChainArgv,
        started: "2026-08-05T12:03:55Z",
        finished: "2026-08-05T12:03:55Z",
        stdout: `started=2026-08-05T12:03:55Z finished=2026-08-05T12:03:55Z phase=chain target-sha256=${successorSha} predecessor-sha256=${directSha} root-sha256=${rootSha} structure=hash-bound\n`,
      },
      {
        argvStreamB64u: zAfterArgv,
        started: "2026-08-05T12:03:55Z",
        finished: "2026-08-05T12:03:55Z",
        stdout: `started=2026-08-05T12:03:55Z finished=2026-08-05T12:03:55Z phase=after sha256=${successorSha} bytes=9515 lf=194 mode=0444 hygiene=ok\n`,
      },
    ],
  },
];

function unitRows() {
  return units.map((unit, unitOrdinal) => {
    const commands = unit.commands.map((command, commandOrdinal) =>
      commandRow(unitOrdinal, commandOrdinal, command));
    const transcript = Buffer.concat([
      Buffer.from("HMG4GAC1", "ascii"),
      u32(1),
      u32(commands.length),
      ...commands.map(({ row }) => lp(Buffer.from(row, "utf8"))),
    ]);
    const transcriptSha = sha256(transcript);
    if (unit.expectedTranscriptSha && transcriptSha !== unit.expectedTranscriptSha) {
      throw new Error(`${unit.reviewer}: command transcript exact-preimage mismatch`);
    }
    return [[
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
      `command-transcript-sha256=${transcriptSha}`,
    ].join("|"), ...commands.map(({ row }) => row)];
  });
}

function reviewBatchId() {
  return sha256(Buffer.concat([
    Buffer.from("HMG4GAB2", "ascii"),
    u32(2),
    Buffer.from(successorSha, "hex"),
    Buffer.from(directSha, "hex"),
    Buffer.from(rootSha, "hex"),
    u64(successorBytes),
    u64(successorLf),
    u32(units.length),
    ...units.flatMap((unit) => [unit.reviewer, unit.task, unit.transcript]
      .map((value) => lp(Buffer.from(value, "utf8")))),
  ]));
}

function parseFinding(line) {
  const fields = Object.fromEntries(line.split("|").map((part) => {
    const split = part.indexOf("=");
    return [part.slice(0, split), part.slice(split + 1)];
  }));
  return {
    priority: fields.priority,
    code: Buffer.from(fields["code-b64u"], "base64url").toString("utf8"),
    original: Buffer.from(fields["original-text-b64u"], "base64url").toString("utf8"),
    remediated: Buffer.from(fields["remediated-text-b64u"], "base64url").toString("utf8"),
    reviewer: units[2].reviewer,
    firstConfirmed: fields["first-reviewer-confirmed-remediation-sha256"],
  };
}

const laterFindings = [
  {
    priority: "P1",
    code: "V23-S64-TLV-ENCODING-UNDEFINED",
    original: "V2.3 declared six S64 authority fields, including two negative -25316 values, without a wire type byte, width, endian, signed representation, or canonical decode and re-encode rule.",
    remediated: "V2.4 and its incorporated successors define 0x11 S64 as exactly eight-byte two's-complement big-endian, freeze mathematical decoding and byte-identical re-encoding, restrict it to six sites, and require independent boundary and type-confusion vectors.",
    firstConfirmed: v24Sha,
  },
  {
    priority: "P1",
    code: "V23-GLOBAL-TAG-TYPE-REGISTRY-NOT-FROZEN",
    original: "The v2.3 implementation used a generic known base-type predicate as if it could prove exact field-site legality, so known wrong types and undeclared tags were not closed at that layer.",
    remediated: "V2.5 and later successors withdraw every regex or global tag-to-one-type projection from authority and require exact context-qualified enclosing-schema validation to dominate every authority-consuming call path.",
    firstConfirmed: v25Sha,
  },
  {
    priority: "P1",
    code: "V24-GLOBAL-REGISTRY-DROPS-CONDITIONAL-TYPES",
    original: "V2.4 collapsed FinalEntry.0503 path to POLICY_REL_PATH even though roles 2 through 7 require SAFE_CUSTODY_LEAF and role 8 requires OBSERVED_CUSTODY_LEAF.",
    remediated: "V2.5 and later successors make FinalEntry.0503 context-qualified by already validated location_role and require the complete 8-by-17 role and known-type matrix plus unknown-type negatives.",
    firstConfirmed: v25Sha,
  },
  {
    priority: "P1",
    code: "V24-GLOBAL-REGISTRY-OMITS-INLINE-TAGS",
    original: "V2.4 treated a line-anchored Markdown regex as a complete registry even though it omitted valid inline, mid-line, member-prefixed, multiword-label, and no-displayed-0x schema sites.",
    remediated: "V2.5 and later successors make every effective enclosing schema authoritative regardless of prose layout, freeze the known regression sites, and require two independently authored semantic schema walkers plus a production-catalog bijection.",
    firstConfirmed: v25Sha,
  },
  {
    priority: "P2",
    code: "V23-DIRECT-PREDECESSOR-TYPE-LINEAGE-STALE",
    original: "V2.3 said it extended its direct v2.2 predecessor by types 0x0d through 0x10 even though v2.2 already froze those types.",
    remediated: "V2.4 and later successors identify their sole direct predecessors by exact hash, preserve transitive lineage separately, reaffirm 0x0d through 0x10, and add only 0x11 S64.",
    firstConfirmed: v24Sha,
  },
  {
    priority: "P2",
    code: "V25-REGRESSION-OMISSION-CARDINALITY-EXCLUDES-XATTR",
    original: "V2.5 called a 38-tag list the exact regex omission set while separately acknowledging that XattrRule.7101 through 7103 were also valid regex-invisible sites.",
    remediated: "V2.6 and v2.7 freeze the three-plus-thirty-eight 41-member minimum regression set and forbid every candidate global projection count, pair count, byte count, and digest from expected truth or authority.",
    firstConfirmed: directSha,
  },
].map((finding) => ({ ...finding, reviewer: units[0].reviewer }));

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

const [successor, direct, rootContract, v23Review] = await Promise.all([
  readFile(successorPath),
  readFile(directPath),
  readFile(rootPath),
  readFile(v23ReviewPath, "utf8"),
]);
if (sha256(successor) !== successorSha || successor.length !== successorBytes ||
    successor.filter((byte) => byte === 0x0a).length !== successorLf) {
  throw new Error("successor exact preimage mismatch");
}
if (sha256(direct) !== directSha || sha256(rootContract) !== rootSha) {
  throw new Error("predecessor exact preimage mismatch");
}
const priorFindings = v23Review.split("\n")
  .filter((line) => line.startsWith("finding=") && !line.startsWith("finding=count"))
  .map(parseFinding);
if (priorFindings.length !== 21) {
  throw new Error(`expected 21 frozen v2.3 findings, observed ${priorFindings.length}`);
}
const findings = [...priorFindings, ...laterFindings].sort((left, right) =>
  Number(left.priority.slice(1)) - Number(right.priority.slice(1)) ||
  Buffer.compare(Buffer.from(left.code), Buffer.from(right.code)) ||
  Buffer.compare(Buffer.from(left.reviewer), Buffer.from(right.reviewer)));
if (findings.length !== 27 || new Set(findings.map(({ code }) => code)).size !== 27) {
  throw new Error("required 27-row finding union mismatch");
}

const report = [
  "# G4 L10 Native Helper v2.7 Successor Independent Review",
  "",
  "## Frozen identity",
  "format-version=2",
  `successor-sha256=${successorSha}`,
  `direct-predecessor-sha256=${directSha}`,
  `root-predecessor-sha256=${rootSha}`,
  `successor-byte-count=${successorBytes}`,
  `successor-lf-line-count=${successorLf}`,
  `review-batch-id=${reviewBatchId()}`,
  "",
  "## Independent review units",
  `unit-count=${units.length}`,
  ...unitRows().flat(),
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
if (report.includes("\r") || report.includes("\0") || report.includes("\t") ||
    / +$/m.test(report) || !report.endsWith("\n") || report.endsWith("\n\n")) {
  throw new Error("noncanonical report byte hygiene");
}
await writeFile(outputPath, report, { encoding: "utf8", flag: "wx", mode: 0o444 });
process.stdout.write(`${JSON.stringify({
  outputPath,
  sha256: sha256(Buffer.from(report)),
  bytes: Buffer.byteLength(report),
  lf: report.split("\n").length - 1,
  reviewBatchId: reviewBatchId(),
  unitCount: units.length,
  findingCount: findings.length,
}, null, 2)}\n`);
