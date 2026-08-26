import assert from "node:assert/strict";
import test from "node:test";

import {
  assertLoopbackBaseUrl,
  parseArguments,
  validateSourceResponse,
} from "./probe-g5-l5-ruffle-reference.mjs";

test("accepts only an exact credential-free HTTP loopback origin", () => {
  assert.equal(
    assertLoopbackBaseUrl("http://127.0.0.1:3105"),
    "http://127.0.0.1:3105",
  );
  assert.equal(
    assertLoopbackBaseUrl("http://localhost:3000"),
    "http://localhost:3000",
  );
  assert.throws(
    () => assertLoopbackBaseUrl("https://127.0.0.1:3105"),
    /plain HTTP/,
  );
  assert.throws(
    () => assertLoopbackBaseUrl("http://example.com:3105"),
    /exact loopback/,
  );
  assert.throws(
    () => assertLoopbackBaseUrl("http://user:pass@127.0.0.1:3105"),
    /credentials/,
  );
});

test("parses an exact G5 L5 hash-, stage-, locale-, and output-bound command", () => {
  const options = parseArguments([
    "--base-url", "http://127.0.0.1:3105",
    "--animation-id", "course-g05-l05-in-016",
    "--expected-sha256", "a".repeat(64),
    "--expected-bytes", "1234",
    "--expected-width", "800",
    "--expected-height", "600",
    "--lang", "en",
    "--settle-ms", "3500",
    "--output",
    "output/playwright/g5-l5-ruffle-reference-diagnostics/course-g05-l05-in-016/en-3500ms",
  ]);
  assert.equal(options.baseUrl, "http://127.0.0.1:3105");
  assert.equal(options.animationId, "course-g05-l05-in-016");
  assert.equal(options.expectedBytes, 1234);
  assert.equal(options.expectedWidth, 800);
  assert.equal(options.expectedHeight, 600);
  assert.equal(options.language, "en");
  assert.equal(options.settleMs, 3500);
  assert.match(
    options.output,
    /g5-l5-ruffle-reference-diagnostics\/course-g05-l05-in-016\/en-3500ms$/,
  );
});

test("rejects noncanonical, unsafe, or unsupported probe arguments", () => {
  const base = [
    "--base-url", "http://127.0.0.1:3105",
    "--animation-id", "course-g05-l05-in-016",
    "--expected-sha256", "a".repeat(64),
    "--expected-bytes", "1234",
    "--output",
    "output/playwright/g5-l5-ruffle-reference-diagnostics/course-g05-l05-in-016/en",
  ];
  assert.throws(
    () =>
      parseArguments([
        ...base.slice(0, 2),
        "--animation-id",
        "../escape",
        ...base.slice(4),
      ]),
    /lowercase hyphenated/,
  );
  assert.throws(
    () =>
      parseArguments([
        ...base.slice(0, -2),
        "--output",
        "reports/unsafe",
      ]),
    /must be a child/,
  );
  assert.throws(
    () => parseArguments([...base, "--lang", "fr"]),
    /must be en or es/,
  );
  assert.throws(
    () => parseArguments([...base, "--unknown"]),
    /Unknown option/,
  );
});

test("validates exact no-store SWF response bytes and hash", async () => {
  const bytes = Buffer.from("fixture-swf-bytes");
  const expectedSha256 =
    "0ef8d07de9d69f8ea72523a3a195067a0e32a86ef3198fbd9024a3238a21da62";
  const response = new Response(bytes, {
    status: 200,
    headers: {
      "content-type": "application/x-shockwave-flash",
      "cache-control": "no-store",
      "content-security-policy": "default-src 'none'; sandbox",
    },
  });
  const diagnostic = await validateSourceResponse(response, {
    expectedSha256,
    expectedBytes: bytes.length,
  });
  assert.equal(diagnostic.exactSourceBytesVerified, true);
  assert.equal(diagnostic.sha256, expectedSha256);
  assert.equal(diagnostic.bytes, bytes.length);
});

test("fails closed when source API metadata or bytes drift", async () => {
  const bytes = Buffer.from("fixture-swf-bytes");
  await assert.rejects(
    validateSourceResponse(new Response(bytes, {status: 404}), {
      expectedSha256: "a".repeat(64),
      expectedBytes: bytes.length,
    }),
    /HTTP 404/,
  );
  await assert.rejects(
    validateSourceResponse(
      new Response(bytes, {
        status: 200,
        headers: {
          "content-type": "application/octet-stream",
          "cache-control": "no-store",
        },
      }),
      {expectedSha256: "a".repeat(64), expectedBytes: bytes.length},
    ),
    /content type drift/,
  );
  await assert.rejects(
    validateSourceResponse(
      new Response(bytes, {
        status: 200,
        headers: {
          "content-type": "application/x-shockwave-flash",
          "cache-control": "no-store",
        },
      }),
      {expectedSha256: "a".repeat(64), expectedBytes: bytes.length},
    ),
    /hash drift/,
  );
});
