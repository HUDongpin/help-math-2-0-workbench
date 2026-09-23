import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildCurrentAccountProfileReadiness,
  renderCurrentAccountSandboxProfile,
  renderMarkdown,
  validateCurrentAccountProfileReadiness,
  writeCurrentAccountProfileReadiness,
} from "./build-g4-l3-ts006-current-account-profile-readiness.mjs";

const MACH_LOOKUP_PROBE = String.raw`require 'fiddle'; h=Fiddle.dlopen(nil); paddr=h['bootstrap_port']; port=Fiddle::Pointer.new(paddr)[0,4].unpack1('L'); out=Fiddle::Pointer.malloc(4); f=Fiddle::Function.new(h['bootstrap_look_up'],[Fiddle::TYPE_INT,Fiddle::TYPE_VOIDP,Fiddle::TYPE_VOIDP],Fiddle::TYPE_INT); rc=f.call(port,ARGV[0],out); STDERR.puts("rc=#{rc}"); exit(rc==0 ? 0 : 1)`;

function runMachLookup(service, policy = null) {
  const rubyArguments = ["--disable-gems", "-e", MACH_LOOKUP_PROBE, service];
  return policy
    ? spawnSync("/usr/bin/sandbox-exec", ["-p", policy, "/usr/bin/ruby", ...rubyArguments], {encoding: "utf8"})
    : spawnSync("/usr/bin/ruby", rubyArguments, {encoding: "utf8"});
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function refingerprint(report) {
  const {reportFingerprintSha256: _discarded, ...withoutFingerprint} = report;
  report.reportFingerprintSha256 = sha256(stable(withoutFingerprint));
  return report;
}

let reportPromise;
function buildOnce() {
  reportPromise ||= buildCurrentAccountProfileReadiness();
  return reportPromise;
}

test("current-account sandbox policy binds exact process, no network, and private HOME denial", () => {
  const policy = renderCurrentAccountSandboxProfile({
    allowedExecutable: "/Applications/Exact Player",
    currentHome: "/Users/example",
    userFonts: "/Users/example/Library/Fonts",
    sessionRoot: "/Volumes/Work/session",
  });
  assert.match(policy, /\(deny network\*\)/u);
  assert.match(policy, /\(deny process-exec\)/u);
  assert.match(policy, /\(deny appleevent-send\)/u);
  assert.match(policy, /com\.apple\.lsd\.open/u);
  assert.match(policy, /\(allow mach-lookup \(global-name "com\.apple\.lsd\.modifydb"\)\)/u);
  assert.match(policy, /\(allow mach-lookup \(global-name "com\.apple\.lsd\.mapdb"\)\)/u);
  assert.match(policy, /\^com\\+\.apple\\+\.lsd\\+\./u);
  assert.match(policy, /Exact Player/u);
  assert.match(policy, /deny file-read\*/u);
  assert.match(policy, /deny file-write\*/u);
  assert.match(policy, /Library\/Fonts/u);
});

test("LaunchServices policy order permits only the two exact Projector startup lookups", () => {
  const policy = renderCurrentAccountSandboxProfile({
    allowedExecutable: "/usr/bin/ruby",
    currentHome: os.homedir(),
    userFonts: path.join(os.homedir(), "Library/Fonts"),
    sessionRoot: path.join(os.tmpdir(), "g4-l3-ts006-mach-lookup-probe"),
  });
  const broadDeny = policy.indexOf("(deny mach-lookup");
  const modifyDbAllow = "(allow mach-lookup (global-name \"com.apple.lsd.modifydb\"))";
  const mapDbAllow = "(allow mach-lookup (global-name \"com.apple.lsd.mapdb\"))";
  const exactModifyDbAllow = policy.indexOf(modifyDbAllow);
  const exactMapDbAllow = policy.indexOf(mapDbAllow);
  assert.ok(broadDeny >= 0, "LaunchServices deny must be present");
  assert.ok(exactModifyDbAllow > broadDeny, "exact self-registration allow must follow the broad LaunchServices deny");
  assert.ok(exactMapDbAllow > exactModifyDbAllow, "exact map-database allow must follow self-registration and the broad deny");
  assert.equal(policy.match(/\(allow mach-lookup/gu)?.length, 2, "only the two exact startup mach-lookup allows are permitted");

  const services = ["com.apple.lsd.modifydb", "com.apple.lsd.open", "com.apple.lsd.mapdb"];
  const outside = Object.fromEntries(services.map((service) => [service, runMachLookup(service)]));
  for (const [service, result] of Object.entries(outside)) {
    assert.equal(result.status, 0, `${service} must exist outside the sandbox so a denial is meaningful: ${result.stderr}`);
  }

  const modifyDb = runMachLookup("com.apple.lsd.modifydb", policy);
  const open = runMachLookup("com.apple.lsd.open", policy);
  const mapDb = runMachLookup("com.apple.lsd.mapdb", policy);
  assert.equal(modifyDb.status, 0, `exact self-registration lookup must succeed: ${modifyDb.stderr}`);
  assert.equal(mapDb.status, 0, `exact LaunchServices database-map lookup must succeed: ${mapDb.stderr}`);
  assert.notEqual(open.status, 0, "LaunchServices host-open lookup must remain denied");
  assert.match(open.stderr, /rc=\d+/u);

  const reversed = policy
    .replace(`${modifyDbAllow}\n${mapDbAllow}\n`, "")
    .replace("(deny mach-lookup", `${modifyDbAllow}\n${mapDbAllow}\n(deny mach-lookup`);
  assert.notEqual(runMachLookup("com.apple.lsd.modifydb", reversed).status, 0,
    "placing self-registration before the broad deny must not silently broaden access");
  assert.notEqual(runMachLookup("com.apple.lsd.mapdb", reversed).status, 0,
    "placing database-map before the broad deny must not silently broaden access");
});

test("current host proves same-account compensating sandbox capabilities without launching Flash", async () => {
  const report = validateCurrentAccountProfileReadiness(await buildOnce());
  assert.equal(report.scope.additionalMacosAccountsRequired, 0);
  assert.equal(report.scope.additionalMacosAccountsCreated, 0);
  assert.equal(report.preparedProfileCandidates.length, 2);
  assert.deepEqual(report.preparedProfileCandidates.map(({language}) => language), ["en", "es"]);
  assert.ok(report.preparedProfileCandidates.every(({projectorLaunched}) => projectorLaunched === false));
  assert.equal(report.technicalProbes.exactAllowlistedExecutableRuns, true);
  assert.equal(report.technicalProbes.nonAllowlistedExecutableDenied, true);
  assert.equal(report.technicalProbes.loopbackNetworkConnectDenied, true);
  assert.equal(report.technicalProbes.privateHomeReadDenied, true);
  assert.equal(report.technicalProbes.allowlistedUserFontsReadAllowed, true);
  assert.equal(report.technicalProbes.privateHomeWriteDenied, true);
  assert.equal(report.technicalProbes.sessionRootWriteAllowed, true);
  assert.equal(report.technicalProbes.externalNetworkContactAttempted, false);
  assert.equal(report.technicalProbes.flashProjectorLaunched, false);
  assert.equal(report.disposableProfileContract.launchServicesHostOpenMachLookup,
    "deny-com.apple.lsd.open");
  assert.equal(report.disposableProfileContract.launchServicesOtherMachLookups,
    "deny-com.apple.lsd-regex");
  assert.equal(report.disposableProfileContract.launchServicesSelfRegistrationMachLookup,
    "allow-exact-com.apple.lsd.modifydb");
  assert.equal(report.disposableProfileContract.launchServicesDatabaseMapMachLookup,
    "allow-exact-com.apple.lsd.mapdb");
  assert.equal(report.executionGate.originalRuntimeExecutionReady, false);
  assert.equal(report.executionGate.emptyDisposableProfileCandidatesPrepared, 2);
  assert.match(renderMarkdown(report), /no additional account be created/u);
});

test("readiness validator rejects re-fingerprinted broad or reordered mach lookup policy", async () => {
  const report = await buildOnce();
  const broad = structuredClone(report);
  broad.disposableProfileContract.normalizedSandboxPolicy += "(allow mach-lookup)\n";
  broad.disposableProfileContract.normalizedSandboxPolicySha256 = sha256(
    broad.disposableProfileContract.normalizedSandboxPolicy,
  );
  refingerprint(broad);
  assert.throws(() => validateCurrentAccountProfileReadiness(broad), /LaunchServices sandbox boundary drifted/u);

  const reversed = structuredClone(report);
  const modifyDbAllow = "(allow mach-lookup (global-name \"com.apple.lsd.modifydb\"))";
  const mapDbAllow = "(allow mach-lookup (global-name \"com.apple.lsd.mapdb\"))";
  reversed.disposableProfileContract.normalizedSandboxPolicy = reversed.disposableProfileContract.normalizedSandboxPolicy
    .replace(`${modifyDbAllow}\n${mapDbAllow}\n`, "")
    .replace("(deny mach-lookup", `${modifyDbAllow}\n${mapDbAllow}\n(deny mach-lookup`);
  reversed.disposableProfileContract.normalizedSandboxPolicySha256 = sha256(
    reversed.disposableProfileContract.normalizedSandboxPolicy,
  );
  refingerprint(reversed);
  assert.throws(() => validateCurrentAccountProfileReadiness(reversed), /LaunchServices sandbox boundary drifted/u);
});

test("readiness validator rejects fabricated runtime execution and acceptance", async () => {
  const report = await buildOnce();
  const executed = structuredClone(report);
  executed.executionGate.runtimeSessionsExecuted = 1;
  assert.throws(() => validateCurrentAccountProfileReadiness(executed), /improperly promoted/u);
  const accepted = structuredClone(report);
  accepted.acceptance.ownerAccepted = true;
  assert.throws(() => validateCurrentAccountProfileReadiness(accepted), /acceptance was promoted/u);
});

test("tracked current-account readiness reports are deterministic", async () => {
  const result = await writeCurrentAccountProfileReadiness({check: true});
  assert.equal(result.action, "verified");
  assert.equal(result.report.executionGate.runtimeSessionsExecuted, 0);
});
