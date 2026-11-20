import type { EvidenceRef, SourceRecord, SourceField } from './types';

export function resolveEvidence(records: SourceRecord[], ref: EvidenceRef): { record: SourceRecord; field: SourceField } | undefined {
  const record = records.find(item => item.id === ref.recordId);
  const field = record?.fields.find(item => item.id === ref.fieldId);
  return record && field ? { record, field } : undefined;
}
export const evidence = (recordId: string, fieldId: string, label: string): EvidenceRef => ({ recordId, fieldId, label });
export const fieldDomId = (recordId: string, fieldId: string) => `field-${recordId}-${fieldId}`;
export const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
export const number = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
export const utc = (value: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hourCycle: 'h23' }).format(new Date(value)) + ' UTC';
