import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSessionScopedBrowserType,
  parseMode,
  privateSessionTransportDescriptor,
} from "./run-g4-l3-g5-l4-private-preview-captures-2026-08-07-r2.mjs";

const SESSION = `v1.1786120000.${"a".repeat(43)}`;

test("CLI is explicit and has no credential argument", () => {
  assert.equal(parseMode(["--run"]), "run");
  assert.equal(parseMode(["--help"]), "help");
  assert.throws(() => parseMode([]));
  assert.throws(() => parseMode(["--run", "secret"]));
});

test("transport is exact-loopback, session-based, and records no credential", () => {
  assert.deepEqual(privateSessionTransportDescriptor("http://127.0.0.1:3219"), {
    mode: "existing-private-preview-session-cookie",
    exactOrigin: "http://127.0.0.1:3219",
    cookieName: "helpmath_executive_preview",
    credentialSource: "ephemeral-in-process-login-response",
    credentialRecorded: false,
    cookieInstalledForExactOriginAndStrippedFromOtherOrigins: true,
    publicBypassCreated: false,
  });
  for (const origin of [
    "https://127.0.0.1:3219",
    "http://localhost:3219",
    "http://127.0.0.1:3219/path",
    "http://user@127.0.0.1:3219",
  ]) assert.throws(() => privateSessionTransportDescriptor(origin));
});

test("browser wrapper injects the private cookie only for the exact origin", async () => {
  const continued = [];
  const installedCookies = [];
  const context = {
    async addCookies(cookies) {
      installedCookies.push(...cookies);
    },
    async route(_pattern, handler) {
      for (const url of [
        "http://127.0.0.1:3219/en/animations/example",
        "http://127.0.0.1:3220/other",
        "https://example.test/asset",
      ]) {
        await handler({
          request: () => ({
            url: () => url,
            headers: () => ({accept: "text/html", cookie: "foreign=value"}),
          }),
          continue: async (options) => continued.push({url, options}),
        });
      }
    },
  };
  const browser = {
    version: () => "fixture",
    newContext: async () => context,
    close: async () => {},
  };
  const wrappedType = buildSessionScopedBrowserType({
    session: SESSION,
    exactOrigin: "http://127.0.0.1:3219",
    browserType: {launch: async () => browser},
  });
  const wrappedBrowser = await wrappedType.launch({headless: true});
  assert.equal(wrappedBrowser.version(), "fixture");
  assert.equal(await wrappedBrowser.newContext({}), context);
  assert.deepEqual(installedCookies, [{
    name: "helpmath_executive_preview",
    value: SESSION,
    url: "http://127.0.0.1:3219",
    httpOnly: true,
    sameSite: "Lax",
  }]);
  assert.equal(continued[0].options.headers.cookie, "foreign=value");
  assert.equal(continued[1].options.headers.cookie, undefined);
  assert.equal(continued[2].options.headers.cookie, undefined);
});
