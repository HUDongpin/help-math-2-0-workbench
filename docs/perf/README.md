# Lesson page performance baseline

`scripts/perf/lighthouse-mobile.mjs` runs Lighthouse 12.8.2 (mobile form factor, simulated throttling, performance only) against each route, repeats each run, and reports the median.

```sh
node scripts/perf/lighthouse-mobile.mjs --base https://www.helpmath.ai --runs 3 --out docs/perf/<name>.json
```

It needs Chrome (`CHROME_PATH` if not on the default path). Set `LIGHTHOUSE_BIN` to use a local Lighthouse install instead of `npx`; the JSON records the version each run actually used. For a protected Vercel preview, set `VERCEL_AUTOMATION_BYPASS_SECRET` and the script sends it as `x-vercel-protection-bypass`. A run with a missing metric fails the script rather than shrinking the sample.

## Baseline: production `cff09fae`, 2026-10-18, median of 3 runs

| Route | Perf | LCP | TBT | TTI | Unused JS |
|---|---|---|---|---|---|
| `/` | 97 | 2.4 s | 100 ms | 2.4 s | 109 KiB |
| `/courses/3/2` | 69 | 3.8 s | 916 ms | 8.2 s | 149 KiB |
| `/es/courses/4/3` | 56 | 8.2 s | 852 ms | 8.2 s | 174 KiB |

Raw runs: `lesson-baseline-cff09fae.json`. Measured from one Linux host in Hong Kong, so compare later runs from the same host and treat single-point differences under about 5 score points as noise. Each later perf PR should rerun this script against its preview and production and report before and after.
