export type AgentId = 'fulfillment' | 'investment' | 'handoff';
export type Step = 0 | 1 | 2 | 3 | 4 | 5;
export type SourceValue = string | number | null;
export interface SourceField {
  id: string;
  label: string;
  value: SourceValue;
  format?: 'utc' | 'cents' | 'number';
  note?: string;
}
export interface SourceRecord {
  id: string;
  subjectId: string;
  groupId: string;
  groupLabel: string;
  title: string;
  description: string;
  kind: 'record' | 'timeline' | 'metrics' | 'policy' | 'manifest';
  fields: SourceField[];
}
export interface EvidenceRef { recordId: string; fieldId: string; label: string }
export type ReviewAction = 'reviewed' | 'evidence-requested' | 'reconciled' | 'revision-requested' | 'draft-approved';
export interface ReviewDecision { action: ReviewAction }
export interface FindingValues {
  latenessMinutes?: number;
  minutesBeforeDeadline?: number;
  arrivalToHandoffMinutes?: number | null;
  receiptSupplied?: boolean;
  baselineThroughput?: number;
  observedThroughput?: number;
  increasePercent?: number;
  claimedCents?: number;
  calculatedCents?: number | null;
  differenceCents?: number | null;
  actualSpendIncreaseCents?: number;
  baselineUnitCostCents?: number;
  observedUnitCostCents?: number;
  benchmarkCents?: number;
  shortfallUnits?: number;
  complete?: boolean;
  currentOwner?: string;
  suggestedOwner?: string | null;
}
export interface Finding {
  id: string;
  subjectId: string;
  ruleId: string;
  status: 'clear' | 'exception' | 'missing';
  basis: 'observed' | 'inferred' | 'missing';
  title: string;
  summary: string;
  statusLabel: string;
  values: FindingValues;
  details: { label: string; value: string }[];
  explanation: string;
  question?: string;
  evidence: EvidenceRef[];
  reviewActions: ReviewAction[];
  visibleAt: Step;
}
export interface ContextNote { text: string; evidence: EvidenceRef }
export interface AgentSnapshot {
  step: Step;
  findings: Finding[];
  counts: { label: string; value: number; tone?: Finding['status'] }[];
  context?: ContextNote;
}
export interface AgentSession {
  step: Step;
  selectedRecordId: string;
  expandedGroups: string[];
  selectedFindingId: string | null;
  highlight: EvidenceRef | null;
  decisions: Record<string, ReviewDecision>;
}
export interface AgentDefinition {
  id: AgentId;
  name: string;
  shortName: string;
  description: string;
  scope: string;
  steps: [string, string, string, string, string];
  initialRecordId: string;
  initialGroupId: string;
  records: SourceRecord[];
  snapshot: (step: Step) => AgentSnapshot;
}
