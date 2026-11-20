# Retail Operations Lab

Site URL: **[wmt.fncai.org](https://wmt.fncai.org/)**

A static, interactive exploration of three narrowly scoped retail agent workflows: fulfillment investigation, investment evidence, and case handoff. Each uses invented records, deterministic calculations, inspectable field-level sources, and local human review.

**Simulated demonstration · Synthetic data**

This is a discussion aid, not finished operational software, an official client product, or evidence of a validated business need. Existing internal tools may already cover these workflows. The account context is omnichannel retail, store fulfillment, marketplace, and fulfillment services. No client assets or actual policies are used.

## Run locally

Use **Node 24 LTS** (the version specified by `.nvmrc` and CI).

```sh
nvm use
npm ci
npm run dev
```

Open the local URL printed by Vite. There are no environment variables, API keys, backend services, or account requirements.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite development server |
| `npm run build` | Strict TypeScript checks, then production output in `dist/` |
| `npm run preview` | Preview the production build |
| `npm test` | Deterministic processing and state transition tests with Vitest |
| `npm run test:e2e` | Build and run Chromium smoke and accessibility tests against actual production files |

Install the test browser once before running the browser suite:

```sh
npx playwright install chromium
npm test
npm run test:e2e
```

On a minimal Linux environment, use `npx playwright install --with-deps chromium`. Browser dependencies are development tooling only; the website makes no runtime requests other than loading its own static assets.

Verification: the production build and 23 unit tests pass. A complete browser run passed all 21 tests; later runs encountered intermittent browser timeouts, with 18 passing in the final rerun. See the [recorded results and qualification](docs/verification.md).

## Explore the demo

The initial state is paused with the first fulfillment order open. Play advances one step every 650 ms; Next advances immediately. Previous reconstructs the earlier visible snapshot. Findings appear after the relevant comparisons and evidence checks, at position 4. Review controls unlock at position 5.

Select a finding to inspect its calculations. Select a linked source to open the corresponding record, expand its group, scroll the exact field into view, and highlight it. Absent evidence links to an actual null reference in a supplied manifest. It never opens a fabricated document.

Agent tabs support Left/Right arrows, Home, and End. Switching pauses playback and preserves that agent’s position, source selection, selected finding, highlights, and review decisions. Reset clears only the active agent. Rewinding hides review decisions; returning to completion restores them.

“Let’s discuss” pauses playback and opens three discovery questions. “Back to demo” restores the workspace and returns keyboard focus to the discussion button. The simulation disclosure stays visible, including on mobile.

All review decisions last only for the current session. “Request evidence” sends nothing. “Approve draft handoff” records **Draft approved / Not sent**, without changing the source queue. Acknowledgement does not establish a root cause, approve returns, authorize funding, or perform an operational action.

## Calculation boundaries

| Workflow | Computed from fixtures | Interpretation boundary |
| --- | --- | --- |
| Fulfillment | Order 102 handoff is 18 minutes late; courier arrival to handoff is 28 minutes. Orders 101 and 103 hand off 10 minutes before their deadlines. Order 103 lacks its required completion receipt. | The event times establish no cause. Missing evidence does not establish failed delivery. |
| Investment | Throughput is 80 → 88 units/hour, a 10% observed increase. Unit labor cost is $1.50 → $1.40. At 44,000 units, the $66,000 benchmark minus $61,600 observed cost gives a $4,400 normalized difference, $3,600 below the submitted $8,000 claim. Actual labor spend increased $1,600. | The $4,400 is not realized savings or automation-attributed value. Attribution is not established. Missing maintenance extracts prevent evaluating the $2,000 claim. |
| Handoff | Quantity shortfalls are 4, 5, and 2 units. Case 202’s owner differs from the fictional rule. Case 203’s missing delivery proof holds the packet. | Ownership is evaluated only after evidence is complete. Quantity difference establishes no fault or reimbursement entitlement. |

Source timestamps are fixed ISO 8601 UTC; the UI explicitly displays UTC. Currency inputs are integer USD cents. Investment calculations use reduced integer rational numbers and compare them without intermediate rounding; formatting rounds only for display. Missing source values display **Not supplied**. No runtime clock, randomness, or fuzzy matching influences results.

Findings distinguish **Observed**, **Inferred**, and **Missing**. The staffing change is a separate context note and a possible confounder, not a fourth claim or a causal finding.

## Structure

```text
src/
  app/                   Shared application and reducer wiring
  components/            Workspace panels, evidence, review, tabs and discussion
  config/                Account copy and timing tokens
  engine/                Typed contracts, reducer, playback, evidence and rational math
  agents/
    fulfillment/         Typed fixtures, source projection, pure processor and tests
    investment/          Typed fixtures, source projection, pure processor and tests
    handoff/             Typed fixtures, source projection, pure processor and tests
  styles/                Tailwind CSS and local design system
tests/e2e/               Playwright behavior, path, responsive and accessibility checks
scripts/serve-dist.mjs    Actual dist files mounted at / and /demo-repo/
docs/                    Research integrity and recorded verification
.github/workflows/       GitHub Pages deployment
```

Processors accept domain fixtures and return stage-specific snapshots; final findings are calculated rather than authored in fixture files. Source projections provide stable field locators. Review decisions are a separate map keyed by finding ID. A single cleaned-up timeout drives playback. All application state stays in memory.

The implementation uses React, TypeScript, Vite, Tailwind CSS, Lucide icons, and system fonts. No remote fonts or images, runtime fetches, model calls, analytics, storage, authentication, or unsafe HTML rendering are present.

## GitHub Pages

No source-code edits or repository-specific settings in code are needed:

1. Push this repository to GitHub.
2. Open **Settings → Pages**.
3. Select **GitHub Actions** as the source.
4. Set **Custom domain** to `wmt.fncai.org` and save.
5. At your DNS provider, point the `wmt` CNAME record to your account or organization’s GitHub Pages hostname, with no repository path. If DNS is already configured, confirm it matches the repository’s Pages hostname.
6. Run or rerun **Deploy to GitHub Pages** from the default branch. Enable **Enforce HTTPS** once GitHub finishes certificate provisioning.

Repository or organization permissions must allow Actions and Pages. The workflow triggers on every push and supports manual dispatch; the deployment job runs only when the pushed or selected branch is the repository’s default branch. It uses Node 24 LTS, `npm ci`, unit tests, the production build, and standard GitHub Pages configuration, artifact, and deployment actions. The `github-pages` environment exposes the deployment URL.

The configured site URL is `https://wmt.fncai.org/`. The `public/CNAME` file contains that hostname and is copied into `dist/CNAME` during the build. The HTML canonical link uses the same HTTPS URL. This domain configuration follows the later request to use that site link.

Vite uses `base: './'`, assets are relative, and navigation uses in-page state. The browser suite serves the **built files** at both a domain root and `/demo-repo/`; it does not substitute a development-server path check.

No remote repository or live deployment is configured by this project. See [verification](docs/verification.md) for executed checks and [research notes](docs/research.md) for source limitations.
