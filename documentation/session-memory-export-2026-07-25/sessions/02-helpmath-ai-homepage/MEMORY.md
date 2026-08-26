# Session memory — helpmath.ai

Thread: `019f8132-478c-7871-9769-5f589a1e2326`

## Purpose

Modernize the former HELP Math public website as a bilingual Next.js site,
deploy it through a private GitHub repository and Vercel, protect two JavaScript
demo candidates, and establish release, evidence, accessibility, security, and
rollback gates.

## Repository boundary

Most website implementation occurred in separate local checkouts/worktrees of
the `helpmath-web` repository, not only inside `HELP MATH_Flash_To_JS`. Before
assuming any website change exists in this copied project, inspect the current
website repository and GitHub/Vercel state.

## Durable outcomes and decisions

- `www.helpmath.ai` was built as an English/Spanish modern site with research,
  resources, about/history, responsive navigation, accessibility, SEO, and
  hardened deployment checks.
- Original FLA/SWF evidence and Ruffle assets were kept outside the public
  website deployment.
- Two JavaScript demos were exposed only through a protected Executive Preview;
  anonymous direct demo routes intentionally returned a private 404.
- Private preview, legal publication, contact delivery, demo rights/product
  acceptance, old-domain cutover, and final launch remained separate gates.
- Typography was ultimately standardized around a shipped Nunito Sans Variable
  implementation after Avenir/Fredoka assumptions caused inconsistent visual
  results.
- A later unified candidate reached draft PR #60 with strong local/CI/preview
  evidence, but it was deliberately not merged or promoted while approvals were
  still outstanding.
- The final strategic decision in this session was a product pivot: HELP Math
  should become a learning-first site rather than primarily a marketing/history
  site. Existing Next.js, bilingual, accessibility, security, deployment, and
  migration infrastructure remains useful; navigation, roles, course/player
  architecture, progress, teacher workflows, and student-data governance need
  a new product plan.

## Security memory

- Do not copy or disclose any historical preview passphrase, session secret, or
  production secret value.
- The relevant configuration names may be reverified in the current deployment,
  but only names and verification outcomes belong in documentation.
- A successful preview login never implied public demo release or strict Flash
  acceptance.

## Reverify before reuse

- Current GitHub PR/branch/CI state and account billing limits.
- Current Vercel production and preview deployments.
- Preview expiry and access without exposing the secret.
- Current legal/contact/demo-release/DNS gate states.
- Current student-data, COPPA/FERPA, school authorization, retention, and
  deletion requirements for the learning-first pivot.
- Whether the official product repository should be consolidated with or remain
  separate from this migration workbench.

