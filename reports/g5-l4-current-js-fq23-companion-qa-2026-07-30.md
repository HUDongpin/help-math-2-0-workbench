# G5 L4 FQ002/FQ003 current-JS companion QA receipt

> Scope: local, private controlled CEO-preview browser regression for the
> current-JavaScript FQ002/FQ003 candidate only. This receipt is not original
> runtime evidence, a Flash/Animate comparison, independent human review,
> Owner fidelity acceptance, strict completion, deployment approval, or
> publication approval.

## Result

The post-portal current-JavaScript flow passed in the existing loopback G5 L4
preview at `http://127.0.0.1:3231/en/courses/5/4` with Playwright CLI 0.1.17.
The separate G4 L3 service on port 3216 was not opened, modified, or stopped.

- FQ002: the shell companion host contained exactly one visible interaction
  companion; the page remained vertically scrollable; seed 0 produced the
  deterministic 10-question order `5, 1, 6, 4, 11, 13, 14, 15, 9, 12`; all
  ten source-bound correct choices produced `Score: 10 / 10` and `Advanced`.
  Review advanced Q5 to Q1 and returned; Replay restored Question 1 of 10,
  cleared the selected radio, and restored Q5 as the seed-bound first item.
- FQ003: the shell companion host contained exactly one visible interaction
  companion; the page remained vertically scrollable; browser interaction
  traversed Q1 through Q18 in exact sequential order; all eighteen
  source-bound correct choices produced `Score: 18 / 18` and `Advanced`.
  Review advanced Q1 to Q2 and returned; Replay restored Question 1 of 18,
  cleared the selected radio, and restored Q1.
- Console: 0 errors and 0 warnings after the two complete flows.
- Network inventory: all 75 recorded local requests returned HTTP 200; no
  non-loopback request was observed in this session inventory.
- Focused contract tests: demos 10/10 passed; web 2/2 passed.

## Bound screenshots

| Role | Path | SHA-256 |
| --- | --- | --- |
| FQ002 companion visible below the fixed stage | `output/playwright/g5-l4-current-js-product-qa/en-desktop-fq002-question-flow.png` | `af3b99cf1d3186d3ddba9d46dae2faead6326edc44bcc7749d6710497031a511` |
| FQ002 score | `output/playwright/g5-l4-current-js-product-qa/en-desktop-fq002-results-post-portal.png` | `c288bc5ab8b52ccce87484f2edb80044d38676bdd8814bccefc2ee1a143aeb3d` |
| FQ002 Replay/reset | `output/playwright/g5-l4-current-js-product-qa/en-desktop-fq002-replay-reset-post-portal.png` | `ca284c8a24a07e36cf3ef810845f927aa7baf7639ed9df13d0a92fb831b9c72f` |
| FQ003 score | `output/playwright/g5-l4-current-js-product-qa/en-desktop-fq003-results-post-portal.png` | `eb55e182acfabcdc8a960f700b4d873e0c5619b233458dd2f0fab6cc77d9dcb4` |
| FQ003 Replay/reset | `output/playwright/g5-l4-current-js-product-qa/en-desktop-fq003-replay-reset-post-portal.png` | `f47898085700083cb82f1b51a11e93520119fae6d4244cd88ecf16af7319b668` |

## Machine check

Run:

```bash
node scripts/check-g5-l4-current-js-fq23-companion-qa.mjs
node --test scripts/check-g5-l4-current-js-fq23-companion-qa.test.mjs
```

The checker re-hashes all source, test, authorization, Markdown, and screenshot
bindings; validates PNG dimensions; validates the exact FQ002/FQ003 observed
orders and outcomes; and rejects any promotion of original-runtime, human,
Owner-fidelity, strict-completion, deployment, or publication gates.

## Evidence boundary

The passed result is narrowly named
`currentJavascriptFq23CompanionQaPassed`. The strict/product acceptance field
`productQaComplete` remains false because the complete lesson fidelity and
acceptance protocol is not satisfied. AVM1 random-order parity for FQ002,
source review-screen visual parity, Spanish question parity, audio, timer,
reporting, original-runtime baselines, RMSE comparison, independent human
review, Owner fidelity acceptance, strict validation, deployment, and
publication all remain false or unperformed.
