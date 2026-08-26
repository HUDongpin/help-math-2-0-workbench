import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import test from "node:test";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFileAsync = promisify(execFile);
const swfmill = fileURLToPath(new URL("../migrations/shell-course-g04-l03-index-local/audit/machine/swfmill.xml.gz", import.meta.url));
const parser = fileURLToPath(new URL("./parse-swfmill-shell-placement-selectors.py", import.meta.url));

test("shell selector parser resolves named and exact unnamed-depth edges", async () => {
  const {stdout} = await execFileAsync("python3", [parser, "--swfmill", swfmill,
    "--edge", "root:709:m_c", "--edge", "sprite-709:88:#29", "--edge", "root:169:#494"]);
  const result = JSON.parse(stdout);
  assert.deepEqual(
    result.edges.map(({parentTimelineId, sourceObjectId, frame, depth, selector, instanceName}) => ({parentTimelineId, sourceObjectId, frame, depth, selector, instanceName})),
    [
      {parentTimelineId: "root", sourceObjectId: 709, frame: 50, depth: 80, selector: "m_c", instanceName: "m_c"},
      {parentTimelineId: "sprite-709", sourceObjectId: 88, frame: 2, depth: 29, selector: "#29", instanceName: null},
      {parentTimelineId: "root", sourceObjectId: 169, frame: 1, depth: 494, selector: "#494", instanceName: null},
    ],
  );
});

test("shell selector parser rejects a depth selector that is not exact", async () => {
  await assert.rejects(
    execFileAsync("python3", [parser, "--swfmill", swfmill, "--edge", "root:169:#495"]),
    /expected exactly one/,
  );
});
