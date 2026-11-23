# Verification

Initial implementation and verification: 19–20 November 2026, using **Node 24.22.3 LTS**, npm 11.18.0, and Chromium 159 via Playwright 1.65.1. GitHub Pages publication and live verification followed on 23 November 2026; see the publication results below.

The browser harness builds the application and uses `scripts/serve-dist.mjs` to mount the actual `dist/` directory at `/` and `/demo-repo/`. Projects cover desktop 1440 × 900, nested-path desktop 1280 × 800, and mobile 375 × 812 with reduced motion.

| Check | Actual result |
| --- | --- |
| `npm ci --offline` using the populated dependency cache | Successful clean lockfile installation |
| `npm test` | 23 tests passed across 4 files |
| `npm run build` | TypeScript checks passed; Vite generated `dist/` successfully |
| `npm run test:e2e` | A complete run passed all 21 tests on 19 November. The final 20 November rerun passed 18 tests and timed out in 3; see the qualification below. |
| axe WCAG A/AA checks | The completed 21-test run reported no violations in initial, all nine selected-finding, or discussion states across the three viewport projects. A later nested-desktop audit timed out. |
| Restricted names | None found in rendered text, accessible labels, titles, metadata, application source, public assets, or production output |
| 375px layout | No horizontal page overflow in any workflow or discussion state |
| Dependency audit during final dependency installation | Zero reported vulnerabilities |

The browser suite covers:

- No initial autoplay; immediate Next/Previous; timer pause/resume; stop at completion.
- Actual production assets loading from both `/` and `/demo-repo/`.
- Fulfillment’s 18-minute lateness, 28-minute elapsed time, acknowledgement, and missing receipt inspection.
- Investment’s 10% throughput comparison, $4,400 normalized difference, $3,600 discrepancy, $1,600 actual spend increase, missing maintenance evidence, and separate context note.
- Handoff’s local draft approval, unchanged source owner, and withheld routing for missing delivery proof.
- Real null manifest fields opened and highlighted by evidence buttons.
- Review decisions restored after rewinding; per-agent state preserved; active-agent reset.
- Arrow/Home/End tab navigation and predictable discussion focus.
- Persistent simulation disclosure and no operational network requests.

Processing tests cover deterministic IDs and replay, frozen fixture immutability, exact calculations, resolution of every evidence link, missing and dangling references, and all six requested input mutations. Reducer tests reject premature or invalid review actions and preserve isolated agent sessions.

Desktop and mobile initial-state screenshots were generated and visually inspected. The omitted visual reference could not be compared. Accessibility checks are automated checks, not a certification or a substitute for assistive-technology testing.

The initial environment required permission to bind a local server port and launch the test browser. That permission was granted, and those checks were run against static built output. No deployment, partner communication, or external operational action occurred during that initial verification.

## Browser rerun qualification

After a successful 21-test run, a clean `npm ci --offline`, unit tests, and production build passed. Subsequent browser reruns experienced intermittent startup, interaction, audit, and context-teardown timeouts. Changing to a single worker and bundled Chromium did not eliminate the interruptions. Some 30-second timeouts reported elapsed durations of many minutes; the cause of these system/browser stalls was not independently established.

The final rerun passed 18 of 21 tests. The nested-desktop investment test and mobile initial-state test timed out during browser-context teardown; the nested-desktop accessibility test timed out during axe evaluation. All three had passed in earlier runs. This is **not a clean final browser-suite pass**. Traces and failure context remain in the ignored `test-results/` directory. The checked-in browser configuration uses one worker and the Chromium channel provided by `npx playwright install chromium`.

Re-run `npm run test:e2e` on an uninterrupted local or CI browser host before treating the final revision as fully browser-verified. Unit checks, the production build, source calculations, and static root/subpath loading were verified at that stage. The later live smoke check below does not replace a complete browser-suite rerun.

## Requested site URL

The follow-up request sets the site URL to `https://wmt.fncai.org/`, superseding the original no-custom-domain requirement. `public/CNAME` configures the hostname for the deployment artifact, and the HTML canonical link uses that HTTPS URL. The README includes the corresponding Pages and DNS setup. This initial URL update only prepared the files; publication was completed separately on 23 November.

The production build passed after this update. Assertions confirmed that `dist/CNAME` contains exactly `wmt.fncai.org` and `dist/index.html` contains the matching HTTPS canonical link. Live domain availability was not checked at that stage.

## Publication — 23 November 2026

The latest interface changes place the workflow navigation below the introduction, expand the desktop workspace to at least 680px, and add the requested blue-and-yellow palette. All 23 unit tests and the production build passed again before publication.

The repository was published to GitHub and GitHub Pages was configured for `wmt.fncai.org`. [Deployment run 45212186469](https://github.com/SididduB807/WMTDemo/actions/runs/45212186469) successfully installed dependencies, ran unit tests, built source commit `885b06c71454f07162f8cd7b2ecc81ff56c5fcb6`, and deployed the Pages artifact.

- `https://wmt.fncai.org/` returned HTTP 200 over HTTPS from GitHub Pages.
- The Pages API reported the custom domain, an approved certificate, and HTTPS enforcement enabled.
- A live Chromium smoke check against the public HTTPS site passed: title and headline, all three workflows, fulfillment elapsed time, investment calculations, missing handoff evidence and field highlighting, discussion and return, mobile layout, and no browser errors.

The live smoke check passed on the published interface. The historical full-browser-suite timeouts documented above remain a qualification; the complete suite was not rerun for publication.
