import type { SourceRecord } from '../../engine/types';

export type Queue = 'Fulfillment review' | 'Marketplace support';
export interface HandoffCase {
  id: string; siteId: string; sellerId: string; category: 'inbound-receipt-discrepancy';
  currentOwner: Queue;
  chronology: { declaredAt: string; deliveredAt: string; receiptCompletedAt: string; openedAt: string };
}
export interface ShipmentDeclaration { id: string; caseId: string; declaredUnits: number }
export interface CompletedReceipt { id: string; caseId: string; receivedUnits: number; complete: boolean }
export interface DeliveryProof { id: string; caseId: string; deliveredAt: string }
export interface HandoffData {
  rule: { id: string; category: string; requiredEvidence: string; completeOwner: Queue; incomplete: string; boundary: string };
  cases: HandoffCase[];
  shipments: ShipmentDeclaration[];
  receipts: CompletedReceipt[];
  proofs: DeliveryProof[];
  manifest: { id: string; entries: { caseId: string; shipmentId: string | null; receiptId: string | null; deliveryProofId: string | null }[] };
}
const at = (time: string) => `2026-02-12T${time}:00Z`;
export const handoffFixtures: HandoffData = {
  rule: { id: 'SYN-HND-RULE-01', category: 'inbound-receipt-discrepancy', requiredEvidence: 'A shipment declaration, completed receipt, and delivery proof are required for a complete packet.', completeOwner: 'Fulfillment review', incomplete: 'Hold the handoff and request evidence. Do not issue a routing recommendation.', boundary: 'Quantity difference alone does not prove fault or authorize reimbursement.' },
  cases: [
    { id: 'SYN-HND-CASE-201', siteId: 'SYN-FC-A', sellerId: 'SYN-SELLER-A', category: 'inbound-receipt-discrepancy', currentOwner: 'Fulfillment review', chronology: { declaredAt: at('08:00'), deliveredAt: at('09:10'), receiptCompletedAt: at('09:40'), openedAt: at('10:00') } },
    { id: 'SYN-HND-CASE-202', siteId: 'SYN-FC-B', sellerId: 'SYN-SELLER-B', category: 'inbound-receipt-discrepancy', currentOwner: 'Marketplace support', chronology: { declaredAt: at('08:30'), deliveredAt: at('10:00'), receiptCompletedAt: at('10:35'), openedAt: at('11:00') } },
    { id: 'SYN-HND-CASE-203', siteId: 'SYN-FC-C', sellerId: 'SYN-SELLER-C', category: 'inbound-receipt-discrepancy', currentOwner: 'Marketplace support', chronology: { declaredAt: at('09:00'), deliveredAt: at('11:00'), receiptCompletedAt: at('11:25'), openedAt: at('11:45') } },
  ],
  shipments: [ { id: 'SYN-HND-SHIP-201', caseId: 'SYN-HND-CASE-201', declaredUnits: 100 }, { id: 'SYN-HND-SHIP-202', caseId: 'SYN-HND-CASE-202', declaredUnits: 60 }, { id: 'SYN-HND-SHIP-203', caseId: 'SYN-HND-CASE-203', declaredUnits: 80 } ],
  receipts: [ { id: 'SYN-HND-RECEIPT-201', caseId: 'SYN-HND-CASE-201', receivedUnits: 96, complete: true }, { id: 'SYN-HND-RECEIPT-202', caseId: 'SYN-HND-CASE-202', receivedUnits: 55, complete: true }, { id: 'SYN-HND-RECEIPT-203', caseId: 'SYN-HND-CASE-203', receivedUnits: 78, complete: true } ],
  proofs: [ { id: 'SYN-HND-POD-201', caseId: 'SYN-HND-CASE-201', deliveredAt: at('09:10') }, { id: 'SYN-HND-POD-202', caseId: 'SYN-HND-CASE-202', deliveredAt: at('10:00') } ],
  manifest: { id: 'SYN-HND-MANIFEST-01', entries: [
    { caseId: 'SYN-HND-CASE-201', shipmentId: 'SYN-HND-SHIP-201', receiptId: 'SYN-HND-RECEIPT-201', deliveryProofId: 'SYN-HND-POD-201' },
    { caseId: 'SYN-HND-CASE-202', shipmentId: 'SYN-HND-SHIP-202', receiptId: 'SYN-HND-RECEIPT-202', deliveryProofId: 'SYN-HND-POD-202' },
    { caseId: 'SYN-HND-CASE-203', shipmentId: 'SYN-HND-SHIP-203', receiptId: 'SYN-HND-RECEIPT-203', deliveryProofId: null },
  ] },
};
export function handoffRecords(data: HandoffData): SourceRecord[] {
  const records: SourceRecord[] = [];
  for (const item of data.cases) {
    const group = { subjectId: item.id, groupId: item.id, groupLabel: `Case ${item.id.split('-').at(-1)}` };
    records.push({ ...group, id: item.id, title: 'Case details', description: 'Inbound receipt discrepancy · Fictional case', kind: 'record', fields: [
      { id: 'siteId', label: 'Fulfillment site', value: item.siteId },
      { id: 'sellerId', label: 'Seller', value: item.sellerId },
      { id: 'category', label: 'Category', value: item.category },
      { id: 'currentOwner', label: 'Current owner', value: item.currentOwner },
      ...Object.entries(item.chronology).sort(([, a], [, b]) => a.localeCompare(b)).map(([key, value]) => ({ id: `chronology.${key}`, label: ({ declaredAt: 'Shipment declared', deliveredAt: 'Carrier-delivery event', receiptCompletedAt: 'Receipt completed', openedAt: 'Case opened' } as Record<string, string>)[key], value, format: 'utc' as const })),
    ] });
    for (const shipment of data.shipments.filter(s => s.caseId === item.id)) records.push({ ...group, id: shipment.id, title: 'Shipment declaration', description: 'Declared inbound quantity', kind: 'metrics', fields: [{ id: 'declaredUnits', label: 'Declared units', value: shipment.declaredUnits, format: 'number' }] });
    for (const receipt of data.receipts.filter(r => r.caseId === item.id)) records.push({ ...group, id: receipt.id, title: 'Completed receipt', description: 'Recorded receiving quantity', kind: 'metrics', fields: [{ id: 'receivedUnits', label: 'Received units', value: receipt.receivedUnits, format: 'number' }, { id: 'complete', label: 'Receipt status', value: receipt.complete ? 'Complete' : 'Incomplete' }] });
    for (const proof of data.proofs.filter(p => p.caseId === item.id)) records.push({ ...group, id: proof.id, title: 'Delivery proof', description: 'Supplied delivery evidence', kind: 'record', fields: [{ id: 'deliveredAt', label: 'Carrier delivery time', value: proof.deliveredAt, format: 'utc' }] });
  }
  const group = { subjectId: 'SYN-HND-REFERENCE', groupId: 'SYN-HND-REFERENCE', groupLabel: 'Rules & manifest' };
  records.push({ ...group, id: data.rule.id, title: 'Ownership & evidence rule', description: 'Fictional demo rule', kind: 'policy', fields: [
    { id: 'category', label: 'Applicable category', value: data.rule.category },
    { id: 'requiredEvidence', label: '01 · Complete packet', value: data.rule.requiredEvidence },
    { id: 'completeOwner', label: '02 · Suggested owner when complete', value: data.rule.completeOwner },
    { id: 'incomplete', label: '03 · Incomplete packet', value: data.rule.incomplete },
    { id: 'boundary', label: '04 · Interpretation boundary', value: data.rule.boundary },
  ] });
  records.push({ ...group, id: data.manifest.id, title: 'Evidence manifest', description: 'Supporting evidence references by case', kind: 'manifest', fields: data.manifest.entries.flatMap(entry => (['shipmentId', 'receiptId', 'deliveryProofId'] as const).map(key => ({ id: `${entry.caseId}.${key}`, label: `${entry.caseId} · ${key}`, value: entry[key] }))) });
  return records;
}
