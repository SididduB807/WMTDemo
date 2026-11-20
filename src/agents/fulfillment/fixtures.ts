import type { SourceRecord } from '../../engine/types';

export interface FulfillmentOrder { id: string; recordId: string; siteId: string; handoffDeadline: string }
export interface FulfillmentEvent { type: 'pick-complete' | 'staged' | 'courier-arrival' | 'courier-handoff' | 'delivered-status'; timestamp: string }
export interface FulfillmentEventRecord { id: string; orderId: string; events: FulfillmentEvent[] }
export interface CompletionReceipt { id: string; orderId: string; completedAt: string }
export interface FulfillmentData {
  rule: { id: string; handoff: string; completion: string; interpretation: string };
  orders: FulfillmentOrder[];
  eventRecords: FulfillmentEventRecord[];
  receipts: CompletionReceipt[];
  manifest: { id: string; entries: { orderId: string; completionReceiptId: string | null }[] };
}
const timestamp = (time: string) => `2026-02-10T${time}:00Z`;
const events = (values: [FulfillmentEvent['type'], string][]): FulfillmentEvent[] => values.map(([type, time]) => ({ type, timestamp: timestamp(time) }));

export const fulfillmentFixtures: FulfillmentData = {
  rule: {
    id: 'SYN-FUL-RULE-01',
    handoff: 'Courier handoff must occur no later than the handoff deadline.',
    completion: 'A delivered-status event requires a completion receipt.',
    interpretation: 'Missing evidence is not proof of failed delivery. A late handoff does not establish its cause.',
  },
  orders: [
    { id: 'SYN-ORDER-101', recordId: 'SYN-FUL-ORDER-101', siteId: 'SYN-SITE-A', handoffDeadline: timestamp('10:00') },
    { id: 'SYN-ORDER-102', recordId: 'SYN-FUL-ORDER-102', siteId: 'SYN-SITE-A', handoffDeadline: timestamp('11:00') },
    { id: 'SYN-ORDER-103', recordId: 'SYN-FUL-ORDER-103', siteId: 'SYN-SITE-B', handoffDeadline: timestamp('12:00') },
  ],
  eventRecords: [
    { id: 'SYN-FUL-EVENTS-101', orderId: 'SYN-ORDER-101', events: events([['pick-complete', '09:35'], ['staged', '09:42'], ['courier-handoff', '09:50'], ['delivered-status', '10:20']]) },
    { id: 'SYN-FUL-EVENTS-102', orderId: 'SYN-ORDER-102', events: events([['pick-complete', '10:35'], ['staged', '10:45'], ['courier-arrival', '10:50'], ['courier-handoff', '11:18'], ['delivered-status', '11:45']]) },
    { id: 'SYN-FUL-EVENTS-103', orderId: 'SYN-ORDER-103', events: events([['pick-complete', '11:35'], ['staged', '11:40'], ['courier-handoff', '11:50'], ['delivered-status', '12:15']]) },
  ],
  receipts: [
    { id: 'SYN-FUL-PROOF-101', orderId: 'SYN-ORDER-101', completedAt: timestamp('10:20') },
    { id: 'SYN-FUL-PROOF-102', orderId: 'SYN-ORDER-102', completedAt: timestamp('11:45') },
  ],
  manifest: { id: 'SYN-FUL-MANIFEST-01', entries: [
    { orderId: 'SYN-ORDER-101', completionReceiptId: 'SYN-FUL-PROOF-101' },
    { orderId: 'SYN-ORDER-102', completionReceiptId: 'SYN-FUL-PROOF-102' },
    { orderId: 'SYN-ORDER-103', completionReceiptId: null },
  ] },
};
export const eventLabels: Record<FulfillmentEvent['type'], string> = { 'pick-complete': 'Pick complete', staged: 'Staged', 'courier-arrival': 'Courier arrival', 'courier-handoff': 'Courier handoff', 'delivered-status': 'Delivered-status event' };

export function fulfillmentRecords(data: FulfillmentData): SourceRecord[] {
  const records: SourceRecord[] = [];
  for (const order of data.orders) {
    const groupLabel = `Order ${order.id.split('-').at(-1)}`;
    const group = { subjectId: order.id, groupId: order.id, groupLabel };
    records.push({ ...group, id: order.recordId, title: 'Order details', description: 'Store delivery · Fictional order', kind: 'record', fields: [
      { id: 'orderId', label: 'Order ID', value: order.id },
      { id: 'siteId', label: 'Fulfillment site', value: order.siteId },
      { id: 'handoffDeadline', label: 'Handoff deadline', value: order.handoffDeadline, format: 'utc' },
    ] });
    const eventRecord = data.eventRecords.find(record => record.orderId === order.id);
    if (eventRecord) records.push({ ...group, id: eventRecord.id, title: 'Event timeline', description: 'Recorded event times · 10 February 2026', kind: 'timeline', fields: [...eventRecord.events].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).map(event => ({ id: `${event.type}.timestamp`, label: eventLabels[event.type], value: event.timestamp, format: 'utc' })) });
    for (const receipt of data.receipts.filter(r => r.orderId === order.id)) records.push({ ...group, id: receipt.id, title: 'Completion receipt', description: 'Supplied completion evidence', kind: 'record', fields: [
      { id: 'orderId', label: 'Order ID', value: receipt.orderId }, { id: 'completedAt', label: 'Completion receipt time', value: receipt.completedAt, format: 'utc' },
    ] });
  }
  const group = { subjectId: 'SYN-FUL-REFERENCE', groupId: 'SYN-FUL-REFERENCE', groupLabel: 'Rules & manifest' };
  records.push({ ...group, id: data.rule.id, title: 'Handoff & evidence rule', description: 'Fictional demo rule', kind: 'policy', fields: [
    { id: 'handoff', label: '01 · Handoff timing', value: data.rule.handoff },
    { id: 'completion', label: '02 · Completion evidence', value: data.rule.completion },
    { id: 'interpretation', label: '03 · Interpretation boundary', value: data.rule.interpretation },
  ] });
  records.push({ ...group, id: data.manifest.id, title: 'Evidence manifest', description: 'Completion receipt references by order', kind: 'manifest', fields: data.manifest.entries.map(entry => ({ id: `${entry.orderId}.completionReceiptId`, label: `${entry.orderId} · completionReceiptId`, value: entry.completionReceiptId })) });
  return records;
}
