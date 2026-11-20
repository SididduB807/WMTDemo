import { describe, expect, it } from 'vitest';
import { fulfillmentFixtures, fulfillmentRecords } from './fixtures';
import { processFulfillment } from './process';
import { resolveEvidence } from '../../engine/evidence';
import { deepFreeze } from '../../engine/test-helpers';

describe('fulfillment investigation', () => {
  it('calculates lateness and the courier elapsed time from exact joined timestamps', () => {
    const snapshot = processFulfillment(fulfillmentFixtures);
    expect(snapshot.findings.map(f => f.status)).toEqual(['clear', 'exception', 'missing']);
    expect(snapshot.findings.find(f => f.subjectId === 'SYN-ORDER-102')?.values).toMatchObject({ latenessMinutes: 18, arrivalToHandoffMinutes: 28 });
    expect(snapshot.findings.filter(f => f.status !== 'exception').map(f => f.values.minutesBeforeDeadline)).toEqual([10, 10]);
    expect(snapshot.counts.map(c => c.value)).toEqual([3, 1, 1, 1]);
  });
  it('is deterministic, accepts frozen input, and resolves every evidence reference', () => {
    const data = deepFreeze(structuredClone(fulfillmentFixtures));
    const before = JSON.stringify(data);
    const first = processFulfillment(data);
    expect(processFulfillment(data)).toEqual(first);
    expect(JSON.stringify(data)).toBe(before);
    for (const f of first.findings) for (const ref of f.evidence) expect(resolveEvidence(fulfillmentRecords(data), ref)).toBeDefined();
  });
  it('clears the late exception when the handoff moves before the deadline', () => {
    const data = structuredClone(fulfillmentFixtures);
    data.eventRecords.find(e => e.orderId === 'SYN-ORDER-102')!.events.find(e => e.type === 'courier-handoff')!.timestamp = '2026-02-10T10:58:00Z';
    const finding = processFulfillment(data).findings.find(f => f.subjectId === 'SYN-ORDER-102')!;
    expect(finding.values.latenessMinutes).toBe(0);
    expect(finding.status).toBe('clear');
  });
  it('clears the missing-receipt gap only when the linked receipt matches the order', () => {
    const data = structuredClone(fulfillmentFixtures);
    data.manifest.entries.find(e => e.orderId === 'SYN-ORDER-103')!.completionReceiptId = 'SYN-FUL-PROOF-103';
    expect(processFulfillment(data).findings.at(-1)?.status).toBe('missing');
    data.receipts.push({ id: 'SYN-FUL-PROOF-103', orderId: 'SYN-ORDER-103', completedAt: '2026-02-10T12:15:00Z' });
    expect(processFulfillment(data).findings.at(-1)?.status).toBe('clear');
    data.receipts.at(-1)!.orderId = 'SYN-ORDER-101';
    expect(processFulfillment(data).findings.at(-1)?.status).toBe('missing');
  });
  it('links an absent receipt to the real null manifest field and delivered event', () => {
    const finding = processFulfillment(fulfillmentFixtures).findings.at(-1)!;
    const ref = finding.evidence.find(e => e.recordId === fulfillmentFixtures.manifest.id)!;
    expect(resolveEvidence(fulfillmentRecords(fulfillmentFixtures), ref)?.field.value).toBeNull();
    expect(finding.evidence.some(e => e.fieldId === 'delivered-status.timestamp')).toBe(true);
    expect(finding.evidence.some(e => e.recordId === 'SYN-FUL-PROOF-103')).toBe(false);
  });
  it('sorts timestamps without changing source order and withholds findings until evidence checks', () => {
    const data = structuredClone(fulfillmentFixtures);
    data.eventRecords[1].events.reverse();
    expect(processFulfillment(data)).toEqual(processFulfillment(fulfillmentFixtures));
    for (const step of [0, 1, 2, 3] as const) expect(processFulfillment(data, step).findings).toEqual([]);
    expect(processFulfillment(data, 4).findings).toHaveLength(3);
  });
});
