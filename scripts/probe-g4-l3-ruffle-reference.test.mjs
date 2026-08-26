import assert from "node:assert/strict";
import test from "node:test";

import {
  assertLoopbackBaseUrl,
  parseArguments,
  validateSourceResponse,
} from "./probe-g4-l3-ruffle-reference.mjs";

test("accepts only an exact credential-free HTTP loopback origin", () => {
  assert.equal(assertLoopbackBaseUrl("http://127.0.0.1:3104"), "http://127.0.0.1:3104");
  assert.equal(assertLoopbackBaseUrl("http://localhost:3000"), "http://localhost:3000");
  assert.throws(() => assertLoopbackBaseUrl("https://127.0.0.1:3104"), /plain HTTP/);
  assert.throws(() => assertLoopbackBaseUrl("http://example.com:3104"), /exact loopback/);
  assert.throws(() => assertLoopbackBaseUrl("http://user:pass@127.0.0.1:3104"), /credentials/);
  assert.throws(() => assertLoopbackBaseUrl("http://127.0.0.1:3104/path"), /only an origin/);
});

test("parses an exact hash-, dimensions-, locale-, and output-bound diagnostic command", () => {
  const options = parseArguments([
    "--base-url", "http://127.0.0.1:3104",
    "--animation-id", "course-g04-l03-in-009",
    "--expected-sha256", "a".repeat(64),
    "--expected-bytes", "1234",
    "--expected-width", "800",
    "--expected-height", "600",
    "--lang", "es",
    "--settle-ms", "750",
    "--output", "output/playwright/g4-l3-ruffle-reference-diagnostics/course-g04-l03-in-009/es",
  ]);
  assert.equal(options.baseUrl, "http://127.0.0.1:3104");
  assert.equal(options.animationId, "course-g04-l03-in-009");
  assert.equal(options.expectedBytes, 1234);
  assert.equal(options.expectedWidth, 800);
  assert.equal(options.expectedHeight, 600);
  assert.equal(options.language, "es");
  assert.equal(options.settleMs, 750);
  assert.match(options.output, /output\/playwright\/g4-l3-ruffle-reference-diagnostics\/course-g04-l03-in-009\/es$/);
});

test("rejects unbound, noncanonical, and unsafe probe arguments", () => {
  const base = [
    "--base-url", "http://127.0.0.1:3104",
    "--animation-id", "course-g04-l03-in-009",
    "--expected-sha256", "a".repeat(64),
    "--expected-bytes", "1234",
    "--output", "output/playwright/g4-l3-ruffle-reference-diagnostics/course-g04-l03-in-009/en",
  ];
  assert.throws(() => parseArguments(base.filter((_, index) => index < 6 || index > 7)), /expected-bytes/);
  assert.throws(() => parseArguments([...base.slice(0, 2), "--animation-id", "../escape", ...base.slice(4)]), /lowercase hyphenated/);
  assert.throws(() => parseArguments([...base.slice(0, -2), "--output", "reports/unsafe"]), /must be a child/);
  assert.throws(() => parseArguments([...base, "--lang", "fr"]), /must be en or es/);
  assert.throws(() => parseArguments([...base, "--unknown"]), /Unknown option/);
});

test("validates exact no-store SWF response bytes and hash", async () => {
  const bytes = Buffer.from("fixture-swf-bytes");
  const expectedSha256 = "0ef8d07de9d69f8ea72523a3a195067a0e32a86ef3198fbd9024a3238a21da62";
  const response = new Response(bytes, {
    status: 200,
    headers: {
      "content-type": "application/x-shockwave-flash",
      "cache-control": "no-store",
      "content-security-policy": "default-src 'none'; sandbox",
    },
  });
  const diagnostic = await validateSourceResponse(response, {expectedSha256, expectedBytes: bytes.length});
  assert.equal(diagnostic.exactSourceBytesVerified, true);
  assert.equal(diagnostic.sha256, expectedSha256);
  assert.equal(diagnostic.bytes, bytes.length);
});

test("fails closed when source API response metadata or bytes drift", async () => {
  const bytes = Buffer.from("fixture-swf-bytes");
  await assert.rejects(
    validateSourceResponse(new Response(bytes, {status: 404}), {expectedSha256: "a".repeat(64), expectedBytes: bytes.length}),
    /HTTP 404/,
  );
  await assert.rejects(
    validateSourceResponse(new Response(bytes, {status: 200, headers: {"content-type": "application/octet-stream", "cache-control": "no-store"}}), {expectedSha256: "a".repeat(64), expectedBytes: bytes.length}),
    /content type drift/,
  );
  await assert.rejects(
    validateSourceResponse(new Response(bytes, {status: 200, headers: {"content-type": "application/x-shockwave-flash", "cache-control": "no-store"}}), {expectedSha256: "a".repeat(64), expectedBytes: bytes.length}),
    /hash drift/,
  );
});
