import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function finish(page: Page) {
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await expect(page.getByLabel('Step 5 of 5', { exact: true })).toBeVisible();
}
const finding = (page: Page, title: string) => page.getByRole('button', { name: new RegExp(`^${title}:`) });

test.beforeEach(async ({ page }) => { await page.goto('./'); });

test('starts paused, exposes all source records, and loads locally without runtime requests', async ({ page, baseURL }, testInfo) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await expect(page).toHaveTitle('Retail Operations Lab');
  await expect(page.getByRole('heading', { name: 'AI agents for retail operations.' })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Fulfillment investigation/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('button', { name: 'Previous step', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Play workflow' })).toBeEnabled();
  await expect(page.getByLabel('Computed findings')).toHaveCount(0);
  await expect(page.getByText('SYN-FUL-ORDER-101', { exact: true })).toBeVisible();
  await page.clock.install();
  await page.clock.runFor(1300);
  await expect(page.getByLabel('Step 0 of 5', { exact: true })).toBeVisible();
  await expect(page.getByText('Simulated demonstration · Synthetic data', { exact: true })).toBeInViewport();
  await expect(page.locator('html')).toHaveJSProperty('scrollWidth', await page.locator('html').evaluate(el => el.clientWidth));
  await page.screenshot({ path: testInfo.outputPath('initial.png'), fullPage: true });
  await page.getByRole('button', { name: 'Play workflow' }).click();
  await page.clock.runFor(650 * 6);
  await expect(page.getByRole('button', { name: 'Play workflow' })).toBeDisabled();
  expect(requests.every(url => url.startsWith(new URL(baseURL!).origin))).toBe(true);
  expect(requests.filter(url => /\b(?:api|analytics)\b/.test(url))).toEqual([]);
});

test('fulfillment calculations, null evidence inspection and review survive a rewind', async ({ page }) => {
  await finish(page);
  await expect(finding(page, 'Order 101')).toContainText('Clear');
  await finding(page, 'Order 102').click();
  const detail = page.getByRole('region', { name: 'Order 102 finding details' });
  await expect(detail).toContainText('18 min after deadline');
  await expect(detail).toContainText('28 minutes');
  await expect(detail).toContainText('What explains the handoff delay?');
  await detail.getByRole('button', { name: 'Mark reviewed', exact: true }).click();
  await expect(detail.getByText('Reviewed', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Previous step', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mark reviewed', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await expect(detail.getByText('Reviewed', { exact: true })).toBeVisible();
  await finding(page, 'Order 103').click();
  await page.getByRole('button', { name: /^Inspect evidence: Manifest · completion receipt reference/ }).click();
  await expect(page.locator('[data-highlighted="true"]')).toContainText('Not supplied');
  await expect(page.locator('[data-highlighted="true"]')).toHaveAttribute('id', 'field-SYN-FUL-MANIFEST-01-SYN-ORDER-103.completionReceiptId');
  await page.getByRole('button', { name: 'Request evidence', exact: true }).click();
  await expect(page.getByText('Evidence requested', { exact: true })).toBeVisible();
});

test('investment shows normalized math, actual spend, attribution and separate context', async ({ page }) => {
  await page.getByRole('tab', { name: /Investment evidence/ }).click();
  await finish(page);
  await expect(finding(page, 'Throughput')).toContainText('10% observed increase');
  await expect(page.getByRole('region', { name: 'Throughput finding details' })).toContainText('Not established');
  await page.getByRole('button', { name: 'Mark reconciled', exact: true }).click();
  await finding(page, 'Direct labor cost').click();
  const detail = page.getByRole('region', { name: 'Direct labor cost finding details' });
  await expect(detail).toContainText('$4,400');
  await expect(detail).toContainText('$1,600 increase');
  await expect(detail).toContainText('44,000 × $1.50 = $66,000');
  await expect(finding(page, 'Direct labor cost')).toContainText('$3,600');
  await expect(page.getByRole('button', { name: 'Mark reconciled', exact: true })).toHaveCount(0);
  await detail.getByRole('button', { name: 'Return for revision', exact: true }).click();
  await expect(detail.getByText('Returned for revision', { exact: true })).toBeVisible();
  await expect(page.getByText(/A staffing schedule changed/)).toBeVisible();
  await finding(page, 'Maintenance cost').click();
  await page.getByRole('button', { name: /^Inspect evidence: Manifest · baseline maintenance extract/ }).click();
  await expect(page.locator('[data-highlighted="true"]')).toContainText('Not supplied');
  await expect(page.getByRole('region', { name: 'Maintenance cost finding details' })).toContainText('$2,000');
});

test('handoff keeps approvals local and withholds ownership when proof is absent', async ({ page }) => {
  await page.getByRole('tab', { name: /Case handoff/ }).click();
  await finish(page);
  await finding(page, 'Case 201').click();
  await expect(page.getByRole('button', { name: 'Mark packet reviewed', exact: true })).toBeEnabled();
  await finding(page, 'Case 202').click();
  const detail = page.getByRole('region', { name: 'Case 202 finding details' });
  await expect(detail).toContainText('5 unit shortfall');
  await page.getByRole('button', { name: 'Approve draft handoff', exact: true }).click();
  await expect(detail.getByText('Draft approved', { exact: true })).toBeVisible();
  await expect(detail.getByText('Not sent · Local draft only', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Inspect evidence: Case · current owner/ }).click();
  await expect(page.locator('[data-highlighted="true"]')).toContainText('Marketplace support');
  await finding(page, 'Case 203').click();
  await expect(page.getByRole('region', { name: 'Case 203 finding details' })).toContainText('Withheld · evidence incomplete');
  await expect(page.getByRole('button', { name: 'Approve draft handoff', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /^Inspect evidence: Manifest · delivery proof reference/ }).click();
  await expect(page.locator('[data-highlighted="true"]')).toContainText('Not supplied');
});

test('pause, keyboard tabs, state preservation, reset and discussion focus work', async ({ page }) => {
  await page.clock.install();
  await page.getByRole('button', { name: 'Play workflow' }).click();
  await page.clock.runFor(650);
  await page.getByRole('button', { name: 'Pause workflow' }).click();
  await page.clock.runFor(2000);
  await expect(page.getByLabel('Step 1 of 5', { exact: true })).toBeVisible();
  const firstTab = page.getByRole('tab', { name: /Fulfillment investigation/ });
  await firstTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Investment evidence/ })).toBeFocused();
  await expect(page.getByLabel('Step 0 of 5', { exact: true })).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: /Case handoff/ })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(firstTab).toBeFocused();
  await expect(page.getByLabel('Step 1 of 5', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Play workflow' }).click();
  await page.getByRole('button', { name: 'Let’s discuss' }).click();
  await page.clock.runFor(5000);
  const heading = page.getByRole('heading', { name: 'What would be most useful to solve?' });
  await expect(heading).toBeFocused();
  await expect(page.getByText('Simulated demonstration · Synthetic data', { exact: true })).toBeInViewport();
  await page.getByRole('button', { name: 'Back to demo' }).click();
  await page.clock.runFor(20);
  await expect(page.getByRole('button', { name: 'Let’s discuss' })).toBeFocused();
  await expect(page.getByLabel('Step 1 of 5', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reset active workflow' }).click();
  await expect(page.getByLabel('Step 0 of 5', { exact: true })).toBeVisible();
});

test('contains no restricted names or page overflow in any workflow or discussion', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const name of ['Fulfillment investigation', 'Investment evidence', 'Case handoff']) {
    await page.getByRole('tab', { name: new RegExp(name) }).click();
    await finish(page);
    const exposed = await page.evaluate(() => document.documentElement.innerText + '\n' + [...document.querySelectorAll('[aria-label], [title], meta')].map(el => `${el.getAttribute('aria-label') ?? ''} ${el.getAttribute('title') ?? ''} ${el.getAttribute('content') ?? ''}`).join('\n'));
    expect(exposed).not.toMatch(/\b(?:Brandon|Sid|Soverflow|IBM)\b/i);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.getByRole('button', { name: 'Let’s discuss' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('has accessible contrast, semantics and labels in initial, computed and discussion states', async ({ page }) => {
  const audit = async () => {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }))).toEqual([]);
  };
  await audit();
  for (const name of ['Fulfillment investigation', 'Investment evidence', 'Case handoff']) {
    await page.getByRole('tab', { name: new RegExp(name) }).click();
    await finish(page);
    const findings = page.getByLabel('Computed findings').getByRole('button');
    for (let i = 0; i < await findings.count(); i++) {
      await findings.nth(i).click();
      await audit();
    }
  }
  await page.getByRole('button', { name: 'Let’s discuss' }).click();
  await audit();
});
