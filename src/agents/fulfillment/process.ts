import type { Finding, Step } from '../../engine/types';
import { evidence } from '../../engine/evidence';
import { snapshot } from '../../engine/snapshot';
import type { FulfillmentData } from './fixtures';

export function processFulfillment(data: FulfillmentData, step: Step = 5) {
  const findings: Finding[] = data.orders.map(order => {
    const eventRecord = data.eventRecords.find(record => record.orderId === order.id);
    const events = [...(eventRecord?.events ?? [])].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const handoff = events.find(event => event.type === 'courier-handoff');
    const arrival = events.find(event => event.type === 'courier-arrival');
    const delivered = events.find(event => event.type === 'delivered-status');
    const manifestEntry = data.manifest.entries.find(entry => entry.orderId === order.id);
    const receipt = data.receipts.find(record => record.id === manifestEntry?.completionReceiptId && record.orderId === order.id);
    const elapsed = handoff ? (Date.parse(handoff.timestamp) - Date.parse(order.handoffDeadline)) / 60000 : 0;
    const latenessMinutes = Math.max(0, elapsed);
    const minutesBeforeDeadline = Math.max(0, -elapsed);
    const arrivalToHandoffMinutes = arrival && handoff ? (Date.parse(handoff.timestamp) - Date.parse(arrival.timestamp)) / 60000 : null;
    const missing = !handoff || (!!delivered && !receipt);
    const status = missing ? 'missing' : latenessMinutes > 0 ? 'exception' : 'clear';
    const refs = [evidence(order.recordId, 'handoffDeadline', 'Order · handoff deadline')];
    if (handoff && eventRecord) refs.push(evidence(eventRecord.id, 'courier-handoff.timestamp', 'Timeline · courier handoff'));
    if (arrival && eventRecord) refs.push(evidence(eventRecord.id, 'courier-arrival.timestamp', 'Timeline · courier arrival'));
    if (delivered && eventRecord) refs.push(evidence(eventRecord.id, 'delivered-status.timestamp', 'Timeline · delivered status'));
    if (manifestEntry) refs.push(evidence(data.manifest.id, `${order.id}.completionReceiptId`, 'Manifest · completion receipt reference'));
    if (receipt) refs.push(evidence(receipt.id, 'completedAt', 'Receipt · completion time'));
    refs.push(evidence(data.rule.id, missing ? 'completion' : 'handoff', 'Fictional demo rule'));
    return {
      id: `${order.id}-FINDING`, subjectId: order.id, ruleId: data.rule.id, status,
      basis: missing ? 'missing' : 'observed', title: `Order ${order.id.split('-').at(-1)}`,
      statusLabel: missing ? 'Missing evidence' : latenessMinutes ? 'Late handoff' : 'Clear',
      summary: !handoff ? 'Handoff event not supplied.' : missing ? 'Completion receipt missing.' : latenessMinutes ? `Handoff ${latenessMinutes} min late.` : 'Handoff on time. Receipt supplied.',
      values: { latenessMinutes, minutesBeforeDeadline, arrivalToHandoffMinutes, receiptSupplied: !!receipt },
      details: [
        { label: 'Handoff timing', value: !handoff ? 'Not supplied' : latenessMinutes ? `${latenessMinutes} min after deadline` : `${minutesBeforeDeadline} min before deadline` },
        { label: 'Arrival → handoff', value: arrivalToHandoffMinutes === null ? 'Not supplied' : `${arrivalToHandoffMinutes} minutes` },
        { label: 'Completion receipt', value: receipt ? 'Supplied' : 'Not supplied' },
      ],
      explanation: missing ? 'The supplied evidence is incomplete. This does not establish failed delivery.' : latenessMinutes ? 'Recorded times establish a late handoff. Courier arrival and staging do not establish the cause.' : 'The handoff meets the fictional deadline rule and a completion receipt is supplied.',
      question: latenessMinutes ? 'What explains the handoff delay?' : missing ? 'Can the completion receipt be supplied?' : undefined,
      evidence: refs, reviewActions: ['reviewed', 'evidence-requested'], visibleAt: 4,
    };
  });
  return snapshot(step, findings, ['cases', 'clear', 'exception', 'evidence gap']);
}
