import assert from "node:assert/strict";
import test from "node:test";

import {classifyBrowserRequest} from "./probe-g4-l10-vb003-original-host-ruffle.mjs";

const origin = "http://127.0.0.1:43123";
const allowed = new Set(["/", "/ruffle/ruffle.js", "/runtime/HELP_COURSES/ELMGR4/L10/index_local.swf"]);

test("allows only exact query-free loopback GET paths plus non-network memory URLs", () => {
  assert.deepEqual(classifyBrowserRequest(`${origin}/`, "GET", origin, allowed), {allowed: true, disposition: "allowed-exact-loopback-get"});
  assert.deepEqual(classifyBrowserRequest(`${origin}/ruffle/ruffle.js`, "GET", origin, allowed), {allowed: true, disposition: "allowed-exact-loopback-get"});
  assert.deepEqual(classifyBrowserRequest("blob:http://127.0.0.1:43123/id", "GET", origin, allowed), {allowed: true, disposition: "in-memory-non-network"});
  assert.deepEqual(classifyBrowserRequest("data:text/plain,local", "GET", origin, allowed), {allowed: true, disposition: "in-memory-non-network"});
});

test("blocks external origins, non-GET methods, queries, and unallowlisted loopback paths", () => {
  assert.deepEqual(classifyBrowserRequest("https://legacy.example.invalid/report", "GET", origin, allowed), {allowed: false, disposition: "blocked-non-loopback-or-external"});
  assert.deepEqual(classifyBrowserRequest(`${origin}/runtime/HELP_COURSES/ELMGR4/L10/index_local.swf`, "POST", origin, allowed), {allowed: false, disposition: "blocked-loopback-non-get"});
  assert.deepEqual(classifyBrowserRequest(`${origin}/ruffle/ruffle.js?v=1`, "GET", origin, allowed), {allowed: false, disposition: "blocked-loopback-unallowlisted"});
  assert.deepEqual(classifyBrowserRequest(`${origin}/favicon.ico`, "GET", origin, allowed), {allowed: false, disposition: "blocked-loopback-unallowlisted"});
});

