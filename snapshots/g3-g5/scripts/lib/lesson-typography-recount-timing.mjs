// Per-invocation measurement only. This is not an evidence or result cache.
import assert from 'node:assert/strict';

export const STAGES = Object.freeze([
  'scan', 'hydrate', 'references', 'g678', 'final-verify', 'serialize', 'output-io',
]);

export function createRecountTiming() {
  const startedAt = new Date().toISOString();
  const start = process.hrtime.bigint(), cpu = process.cpuUsage();
  const stages = Object.fromEntries(STAGES.map(name => [name, {
    calls: 0, wallMs: 0, processUserMicros: 0, processSystemMicros: 0,
  }]));
  const counters = {};
  return {
    start(name) {
      assert(Object.hasOwn(stages, name), `Unknown timing stage: ${name}`);
      return {name, wall: process.hrtime.bigint(), cpu: process.cpuUsage()};
    },
    end(token) {
      const elapsed = process.hrtime.bigint() - token.wall;
      const elapsedCpu = process.cpuUsage(token.cpu), stage = stages[token.name];
      stage.calls++;
      stage.wallMs += Number(elapsed) / 1e6;
      stage.processUserMicros += elapsedCpu.user;
      stage.processSystemMicros += elapsedCpu.system;
    },
    count(name, value) {
      assert(Number.isSafeInteger(value) && value >= 0, 'Invalid timing counter');
      counters[name] = (counters[name] ?? 0) + value;
    },
    snapshot() {
      const wallMs = Number(process.hrtime.bigint() - start) / 1e6;
      const totalCpu = process.cpuUsage(cpu);
      const measuredStageWallMs = Object.values(stages).reduce((sum, stage) => sum + stage.wallMs, 0);
      return {
        kind: 'typography-recount-stage-timing-v1', startedAt,
        finishedAt: new Date().toISOString(), wallMs,
        processUserMicros: totalCpu.user, processSystemMicros: totalCpu.system,
        stages: structuredClone(stages), counters: {...counters},
        unmeasuredWallMs: wallMs - measuredStageWallMs,
        scope: 'One buildLessonTypographyProgress invocation; scan is the parallel scan envelope; hydrate excludes consumer work after yield; G678 retains its full existing computation.',
        limits: 'Process CPU includes any concurrent work in this process; unmeasured time is not idle. Counters describe reader work, not physical disk I/O. Telemetry grants no page or acceptance credit.',
      };
    },
  };
}

export const startStage = (timing, name) => timing?.start(name);
export const endStage = (timing, token) => { if (token) timing.end(token); };
