import type { SourceRecord } from '../../engine/types';

export interface MetricPeriod {
  id: string; projectId: string; siteId: string; definitionId: string; currency: 'USD';
  start: string; end: string; units: number; staffedHours: number; laborCostCents: number;
}
export interface InvestmentClaim { id: string; metric: 'throughput' | 'labor' | 'maintenance'; claimedPercent?: number; claimedCents?: number }
export interface MaintenanceExtract { id: string; period: 'baseline' | 'observation'; costCents: number }
export interface InvestmentData {
  definitions: { id: string; throughput: string; labor: string; maintenance: string };
  baseline: MetricPeriod;
  observation: MetricPeriod;
  claimsRecordId: string;
  claims: InvestmentClaim[];
  change: { id: string; effectiveAt: string; description: string };
  manifest: { id: string; baselineMaintenanceExtractId: string | null; observationMaintenanceExtractId: string | null };
  maintenanceExtracts: MaintenanceExtract[];
}
export const investmentFixtures: InvestmentData = {
  definitions: { id: 'SYN-INV-DEF-01', throughput: 'Processed units ÷ staffed operating hours.', labor: 'Direct labor cost ÷ processed units. Compare at the observed volume.', maintenance: 'Maintenance cost change requires baseline and observation maintenance-cost extracts.' },
  baseline: { id: 'SYN-INV-BASE-01', projectId: 'SYN-PROJECT-A', siteId: 'SYN-SITE-C', definitionId: 'SYN-INV-DEF-01', currency: 'USD', start: '2026-01-05T00:00:00Z', end: '2026-01-11T23:59:59Z', units: 40000, staffedHours: 500, laborCostCents: 6000000 },
  observation: { id: 'SYN-INV-OBS-01', projectId: 'SYN-PROJECT-A', siteId: 'SYN-SITE-C', definitionId: 'SYN-INV-DEF-01', currency: 'USD', start: '2026-02-02T00:00:00Z', end: '2026-02-08T23:59:59Z', units: 44000, staffedHours: 500, laborCostCents: 6160000 },
  claimsRecordId: 'SYN-INV-CLAIMS-01',
  claims: [
    { id: 'SYN-INV-CLAIM-01', metric: 'throughput', claimedPercent: 10 },
    { id: 'SYN-INV-CLAIM-02', metric: 'labor', claimedCents: 800000 },
    { id: 'SYN-INV-CLAIM-03', metric: 'maintenance', claimedCents: 200000 },
  ],
  change: { id: 'SYN-INV-CHANGE-01', effectiveAt: '2026-02-02T00:00:00Z', description: 'A revised staffing schedule began on 2026-02-02. Possible confounder; no causal explanation established.' },
  manifest: { id: 'SYN-INV-MANIFEST-01', baselineMaintenanceExtractId: null, observationMaintenanceExtractId: null },
  maintenanceExtracts: [],
};
export function investmentRecords(data: InvestmentData): SourceRecord[] {
  const group = (groupId: string, groupLabel: string) => ({ groupId, groupLabel, subjectId: 'SYN-PROJECT-A' });
  const records: SourceRecord[] = [
    { ...group('SYN-INV-PERIODS', 'Period extracts'), id: data.baseline.id, title: 'Baseline period', description: '05–11 January 2026 · Seven days · USD', kind: 'metrics', fields: periodFields(data.baseline) },
    { ...group('SYN-INV-PERIODS', 'Period extracts'), id: data.observation.id, title: 'Observation period', description: '02–08 February 2026 · Seven days · USD', kind: 'metrics', fields: periodFields(data.observation) },
    { ...group('SYN-INV-CLAIMS', 'Claims & context'), id: data.claimsRecordId, title: 'Benefit claims', description: 'Three fictional claims for review', kind: 'metrics', fields: data.claims.map(claim => ({ id: `${claim.id}.claimedValue`, label: claim.metric === 'throughput' ? 'Throughput increase (%)' : claim.metric === 'labor' ? 'Normalized labor cost decrease' : 'Maintenance cost decrease', value: claim.claimedPercent ?? claim.claimedCents ?? null, format: claim.metric === 'throughput' ? 'number' : 'cents', note: claim.id })) },
    { ...group('SYN-INV-CLAIMS', 'Claims & context'), id: data.change.id, title: 'Change log', description: 'Observation-period context', kind: 'record', fields: [
      { id: 'effectiveAt', label: 'Effective from', value: data.change.effectiveAt, format: 'utc' },
      { id: 'description', label: 'Staffing schedule change', value: data.change.description },
    ] },
    { ...group('SYN-INV-REFERENCE', 'Definitions & evidence'), id: data.definitions.id, title: 'Metric definitions', description: 'Fictional demo rule', kind: 'policy', fields: [
      { id: 'throughput', label: '01 · Throughput', value: data.definitions.throughput },
      { id: 'labor', label: '02 · Labor cost per unit', value: data.definitions.labor },
      { id: 'maintenance', label: '03 · Maintenance cost', value: data.definitions.maintenance },
    ] },
    { ...group('SYN-INV-REFERENCE', 'Definitions & evidence'), id: data.manifest.id, title: 'Evidence manifest', description: 'Required maintenance-cost extracts', kind: 'manifest', fields: [
      { id: 'baselineMaintenanceExtractId', label: 'Baseline maintenance extract', value: data.manifest.baselineMaintenanceExtractId },
      { id: 'observationMaintenanceExtractId', label: 'Observation maintenance extract', value: data.manifest.observationMaintenanceExtractId },
    ] },
  ];
  for (const extract of data.maintenanceExtracts) records.push({ ...group('SYN-INV-REFERENCE', 'Definitions & evidence'), id: extract.id, title: `${extract.period} maintenance`, description: 'Supplied maintenance-cost extract · USD', kind: 'metrics', fields: [{ id: 'costCents', label: 'Maintenance cost', value: extract.costCents, format: 'cents' }] });
  return records;
}
function periodFields(period: MetricPeriod): SourceRecord['fields'] {
  return [
    { id: 'projectId', label: 'Project', value: period.projectId },
    { id: 'siteId', label: 'Site scope', value: period.siteId },
    { id: 'definitionId', label: 'Metric definitions', value: period.definitionId },
    { id: 'currency', label: 'Currency', value: period.currency },
    { id: 'start', label: 'Period start', value: period.start, format: 'utc' },
    { id: 'end', label: 'Period end', value: period.end, format: 'utc' },
    { id: 'units', label: 'Processed units', value: period.units, format: 'number' },
    { id: 'staffedHours', label: 'Staffed operating hours', value: period.staffedHours, format: 'number' },
    { id: 'laborCostCents', label: 'Direct labor cost', value: period.laborCostCents, format: 'cents' },
    { id: 'maintenanceCostCents', label: 'Maintenance cost', value: null },
  ];
}
