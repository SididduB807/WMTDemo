import { describe, expect, it } from 'vitest';
import { handoffFixtures, handoffRecords } from './fixtures';
import { processHandoff } from './process';
import { resolveEvidence } from '../../engine/evidence';
import { deepFreeze } from '../../engine/test-helpers';

describe('case handoff', () => {
  it('calculates quantity differences and checks completeness before suggesting ownership', () => {
    const result = processHandoff(handoffFixtures);
    expect(result.findings.map(f => f.values.shortfallUnits)).toEqual([4, 5, 2]);
    expect(result.findings.map(f => f.status)).toEqual(['clear', 'exception', 'missing']);
    expect(result.findings.map(f => f.values.suggestedOwner)).toEqual(['Fulfillment review', 'Fulfillment review', null]);
    expect(result.counts.map(c => c.value)).toEqual([3, 1, 1, 1]);
  });
  it('is deterministic, accepts immutable sources, and resolves all evidence', () => {
    const data = deepFreeze(structuredClone(handoffFixtures));
    const before = JSON.stringify(data);
    const first = processHandoff(data);
    expect(processHandoff(data)).toEqual(first);
    expect(JSON.stringify(data)).toBe(before);
    for (const finding of first.findings) for (const ref of finding.evidence) expect(resolveEvidence(handoffRecords(data), ref)).toBeDefined();
  });
  it('clears a routing mismatch when the recorded owner matches the fictional rule', () => {
    const data = structuredClone(handoffFixtures);
    data.cases.find(c => c.id === 'SYN-HND-CASE-202')!.currentOwner = 'Fulfillment review';
    const result = processHandoff(data).findings.find(f => f.subjectId === 'SYN-HND-CASE-202')!;
    expect(result.status).toBe('clear');
    expect(result.reviewActions).toEqual(['reviewed']);
  });
  it('enables ownership evaluation only when missing delivery proof is linked and supplied', () => {
    const data = structuredClone(handoffFixtures);
    data.manifest.entries.find(e => e.caseId === 'SYN-HND-CASE-203')!.deliveryProofId = 'SYN-HND-POD-203';
    expect(processHandoff(data).findings[2].values.suggestedOwner).toBeNull();
    data.proofs.push({ id: 'SYN-HND-POD-203', caseId: 'SYN-HND-CASE-203', deliveredAt: '2026-02-12T11:00:00Z' });
    const result = processHandoff(data).findings[2];
    expect(result.values.suggestedOwner).toBe('Fulfillment review');
    expect(result.status).toBe('exception');
    for (const ref of result.evidence) expect(resolveEvidence(handoffRecords(data), ref)).toBeDefined();
  });
  it('holds a packet if its receipt is not complete, even if other evidence exists', () => {
    const data = structuredClone(handoffFixtures);
    data.receipts[0].complete = false;
    expect(processHandoff(data).findings[0].values.suggestedOwner).toBeNull();
    expect(processHandoff(data).findings[0].status).toBe('missing');
  });
  it('has an ordered, fixed UTC chronology for every case', () => {
    for (const item of handoffFixtures.cases) {
      const timestamps = Object.values(item.chronology);
      expect(timestamps).toEqual([...timestamps].sort());
      expect(timestamps.every(value => value.startsWith('2026-02-12T') && value.endsWith('Z'))).toBe(true);
    }
  });
});
