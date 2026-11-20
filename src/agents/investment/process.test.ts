import { describe, expect, it } from 'vitest';
import { investmentFixtures, investmentRecords } from './fixtures';
import { processInvestment } from './process';
import { resolveEvidence } from '../../engine/evidence';
import { deepFreeze } from '../../engine/test-helpers';

describe('investment evidence', () => {
  it('recalculates throughput, normalized difference, discrepancy and actual spend independently', () => {
    const result = processInvestment(investmentFixtures);
    const throughput = result.findings.find(f => f.subjectId === 'SYN-INV-CLAIM-01')!;
    expect(throughput.values).toMatchObject({ baselineThroughput: 80, observedThroughput: 88, increasePercent: 10 });
    const labor = result.findings.find(f => f.subjectId === 'SYN-INV-CLAIM-02')!;
    expect(labor.values).toMatchObject({ baselineUnitCostCents: 150, observedUnitCostCents: 140, benchmarkCents: 6600000, calculatedCents: 440000, differenceCents: 360000, actualSpendIncreaseCents: 160000 });
    expect(result.findings.map(f => f.status)).toEqual(['clear', 'exception', 'missing']);
    expect(result.counts.map(c => c.value)).toEqual([3, 1, 1, 1]);
  });
  it('is deterministic, immutable, and every evidence link including context resolves', () => {
    const data = deepFreeze(structuredClone(investmentFixtures));
    const before = JSON.stringify(data);
    const result = processInvestment(data);
    expect(processInvestment(data)).toEqual(result);
    expect(JSON.stringify(data)).toBe(before);
    const records = investmentRecords(data);
    for (const finding of result.findings) for (const ref of finding.evidence) expect(resolveEvidence(records, ref)).toBeDefined();
    expect(resolveEvidence(records, result.context!.evidence)).toBeDefined();
  });
  it('reconciles a revised $4,400 labor claim and permits reconciliation only when supported', () => {
    const data = structuredClone(investmentFixtures);
    expect(processInvestment(data).findings[1].reviewActions).toEqual(['revision-requested']);
    data.claims.find(c => c.metric === 'labor')!.claimedCents = 440000;
    const finding = processInvestment(data).findings.find(f => f.subjectId === 'SYN-INV-CLAIM-02')!;
    expect(finding.status).toBe('clear');
    expect(finding.values.differenceCents).toBe(0);
    expect(finding.reviewActions).toEqual(['reconciled']);
  });
  it('evaluates maintenance only after both referenced cost extracts are supplied', () => {
    const data = structuredClone(investmentFixtures);
    expect(processInvestment(data).findings[2].values.calculatedCents).toBeNull();
    data.maintenanceExtracts.push({ id: 'SYN-INV-MAINT-BASE', period: 'baseline', costCents: 500000 }, { id: 'SYN-INV-MAINT-OBS', period: 'observation', costCents: 300000 });
    data.manifest.baselineMaintenanceExtractId = 'SYN-INV-MAINT-BASE';
    expect(processInvestment(data).findings[2].status).toBe('missing');
    data.manifest.observationMaintenanceExtractId = 'SYN-INV-MAINT-OBS';
    const result = processInvestment(data).findings[2];
    expect(result.status).toBe('clear');
    expect(result.values.calculatedCents).toBe(200000);
    for (const ref of result.evidence) expect(resolveEvidence(investmentRecords(data), ref)).toBeDefined();
  });
  it('reacts to changed throughput inputs and flags incompatible period scope', () => {
    const data = structuredClone(investmentFixtures);
    data.observation.units = 48000;
    expect(processInvestment(data).findings[0].values.increasePercent).toBe(20);
    expect(processInvestment(data).findings[0].status).toBe('exception');
    data.observation = { ...investmentFixtures.observation, siteId: 'SYN-SITE-OTHER' };
    expect(processInvestment(data).findings[0].reviewActions).not.toContain('reconciled');
  });
  it('keeps the staffing note separate from the three claims and does not expose findings early', () => {
    expect(processInvestment(investmentFixtures).findings).toHaveLength(3);
    expect(processInvestment(investmentFixtures).context?.text).toContain('Possible confounder');
    for (const step of [0, 1, 2, 3] as const) expect(processInvestment(investmentFixtures, step).findings).toHaveLength(0);
  });
});
