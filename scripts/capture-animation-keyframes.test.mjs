import assert from "node:assert/strict";
import test from "node:test";

import {isExpectedRscAbort} from "./capture-animation-keyframes.mjs";

test("classifies only same-origin Next RSC navigation aborts as expected", () => {
  const origin = "http://127.0.0.1:3000";
  assert.equal(
    isExpectedRscAbort(`${origin}/en/animations/example?_rsc=opaque-token`, "net::ERR_ABORTED", origin),
    true,
  );
  assert.equal(
    isExpectedRscAbort(`${origin}/en/animations/example`, "net::ERR_ABORTED", origin),
    false,
  );
  assert.equal(
    isExpectedRscAbort("http://localhost:3000/en/animations/example?_rsc=opaque-token", "net::ERR_ABORTED", origin),
    false,
  );
  assert.equal(
    isExpectedRscAbort(`${origin}/en/animations/example?_rsc=opaque-token`, "net::ECONNRESET", origin),
    false,
  );
  assert.equal(
    isExpectedRscAbort("not a URL", "net::ERR_ABORTED", origin),
    false,
  );
});
