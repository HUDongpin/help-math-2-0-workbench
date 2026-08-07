import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {fileURLToPath} from "node:url";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));

const functionalDonorModules = [
  "course-g04-l03-in-004",
  "course-g04-l03-in-005",
  "course-g04-l03-in-012",
] as const;

test("functional donor state stays referentially stable across canvas status renders", async () => {
  for (const animationId of functionalDonorModules) {
    const source = await readFile(
      `${repositoryRoot}packages/demos/src/modules/${animationId}.tsx`,
      "utf8",
    );

    assert.match(
      source,
      /const interactiveSourceVisualState = useMemo\(/,
      `${animationId} must memoize its clean donor state`,
    );
    assert.match(
      source,
      /const sourceVisualState = interactionEnabled\s+\? interactiveSourceVisualState\s+: props\.state;/,
      `${animationId} must reuse the memoized donor only in functional mode`,
    );
    assert.match(
      source,
      /<SourceStaticRenderer[\s\S]*?state=\{sourceVisualState\}/,
      `${animationId} must pass the stable state to the source canvas`,
    );
  }
});
