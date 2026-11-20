import type { Finding, Step } from '../../engine/types';
import { evidence } from '../../engine/evidence';
import { snapshot } from '../../engine/snapshot';
import type { HandoffData } from './fixtures';

export function processHandoff(data: HandoffData, step: Step = 5) {
  const findings: Finding[] = data.cases.map(item => {
    const manifest = data.manifest.entries.find(entry => entry.caseId === item.id);
    const shipment = data.shipments.find(record => record.id === manifest?.shipmentId && record.caseId === item.id);
    const receipt = data.receipts.find(record => record.id === manifest?.receiptId && record.caseId === item.id);
    const proof = data.proofs.find(record => record.id === manifest?.deliveryProofId && record.caseId === item.id);
    const complete = !!(shipment && receipt?.complete && proof);
    const suggestedOwner = complete && item.category === data.rule.category ? data.rule.completeOwner : null;
    const mismatch = suggestedOwner !== null && suggestedOwner !== item.currentOwner;
    const shortfallUnits = shipment && receipt ? shipment.declaredUnits - receipt.receivedUnits : undefined;
    const refs = [evidence(item.id, 'currentOwner', 'Case · current owner')];
    if (shipment) refs.push(evidence(shipment.id, 'declaredUnits', 'Shipment · declared units'));
    if (receipt) refs.push(evidence(receipt.id, 'receivedUnits', 'Receipt · received units'), evidence(receipt.id, 'complete', 'Receipt · completion status'));
    if (manifest) refs.push(evidence(data.manifest.id, `${item.id}.deliveryProofId`, 'Manifest · delivery proof reference'));
    if (proof) refs.push(evidence(proof.id, 'deliveredAt', 'Delivery proof · recorded time'));
    refs.push(evidence(data.rule.id, 'requiredEvidence', 'Fictional rule · required evidence'));
    refs.push(evidence(data.rule.id, complete ? 'completeOwner' : 'incomplete', complete ? 'Fictional rule · suggested owner' : 'Fictional rule · hold incomplete packet'));
    return { id: `${item.id}-FINDING`, subjectId: item.id, ruleId: data.rule.id,
      status: !complete ? 'missing' : mismatch ? 'exception' : 'clear', basis: !complete ? 'missing' : mismatch ? 'inferred' : 'observed',
      title: `Case ${item.id.split('-').at(-1)}`, statusLabel: !complete ? 'Hold' : mismatch ? 'Routing mismatch' : 'Ready',
      summary: !complete ? !proof ? 'Delivery proof missing.' : 'Required packet evidence missing.' : mismatch ? 'Owner differs from demo rule.' : 'Ready for review.',
      values: { shortfallUnits, complete, currentOwner: item.currentOwner, suggestedOwner },
      details: [
        { label: 'Quantity comparison', value: shipment && receipt ? `${shipment.declaredUnits} declared − ${receipt.receivedUnits} received = ${shortfallUnits} unit shortfall` : 'Not supplied' },
        { label: 'Packet evidence', value: complete ? 'Complete' : 'Incomplete' },
        { label: 'Current owner', value: item.currentOwner },
        { label: 'Suggested owner', value: suggestedOwner ?? 'Withheld · evidence incomplete' },
      ],
      explanation: !complete ? 'The fictional rule holds incomplete packets. No routing recommendation is issued.' : 'The fictional ownership rule applies only after packet completeness is established. Quantity difference does not establish fault or authorize reimbursement.',
      evidence: refs, reviewActions: !complete ? ['evidence-requested'] : mismatch ? ['draft-approved'] : ['reviewed'], visibleAt: 4,
    };
  });
  return snapshot(step, findings, ['cases', 'ready', 'routing mismatch', 'held']);
}
