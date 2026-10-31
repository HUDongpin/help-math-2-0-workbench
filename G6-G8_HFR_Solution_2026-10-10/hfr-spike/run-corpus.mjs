// Parallel corpus runner: node run-corpus.mjs <manifest.json> <registry.json> <srcRoot> <out.jsonl> [workers]
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { fork } from "node:child_process";
import { runPage } from "./run-page.mjs";
import { fileURLToPath } from "node:url";
if (process.argv[2] === "--worker") {
  process.on("message", (m) => { if (m === "done") process.exit(0); const r = runPage(m.path, { maxClicks: 30 }); process.send({ ...m, result: r }); });
} else {
  const [manifestPath, registryPath, srcRoot, outPath, nw = "10"] = process.argv.slice(2);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const reg = JSON.parse(readFileSync(registryPath, "utf8"));
  const regKeys = new Set(reg.calibrations.flatMap((c) => c.entries.map((e) => e.key)));
  const jobs = [];
  for (const rel of manifest.releases) for (const m of rel.members) jobs.push({ id: m.animationId, section: m.sectionCode, registered: regKeys.has(m.animationId), path: srcRoot + "/" + m.source.path.replace(/^HELP_COURSES\//, "") });
  writeFileSync(outPath, "");
  let next = 0, done = 0; const t0 = Date.now();
  const workers = Array.from({ length: +nw }, () => fork(fileURLToPath(import.meta.url), ["--worker"]));
  for (const w of workers) {
    w.on("message", (m) => {
      appendFileSync(outPath, JSON.stringify({ id: m.id, section: m.section, registered: m.registered, ...m.result }) + "\n");
      if (++done % 100 === 0) console.error(`${done}/${jobs.length} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      if (next < jobs.length) w.send(jobs[next++]); else w.send("done");
    });
    if (next < jobs.length) w.send(jobs[next++]);
  }
  process.on("exit", () => console.error(`finished ${done} in ${((Date.now() - t0) / 1000).toFixed(0)}s`));
}
