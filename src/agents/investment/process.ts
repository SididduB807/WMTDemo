import type { EvidenceRef, Finding, Step } from '../../engine/types';
import { evidence, money, number } from '../../engine/evidence';
import { snapshot } from '../../engine/snapshot';
import { divide, equal, multiply, rational, subtract, valueOf } from '../../engine/rational';
import type { InvestmentData } from './fixtures';

export function processInvestment(data: InvestmentData, step: Step = 5) {
  const b = data.baseline;
  const o = data.observation;
  const baseThroughput = rational(b.units, b.staffedHours);
  const obsThroughput = rational(o.units, o.staffedHours);
  const increase = multiply(divide(subtract(obsThroughput, baseThroughput), baseThroughput), rational(100));
  const baseUnit = rational(b.laborCostCents, b.units);
  const obsUnit = rational(o.laborCostCents, o.units);
  const benchmark = multiply(rational(o.units), baseUnit);
  const normalizedDifference = subtract(benchmark, rational(o.laborCostCents));
  const comparable = b.projectId === o.projectId && b.siteId === o.siteId && b.definitionId === o.definitionId && b.definitionId === data.definitions.id && b.currency === o.currency && Date.parse(b.end) - Date.parse(b.start) === Date.parse(o.end) - Date.parse(o.start);
  const metricRefs = (fields: string[]): EvidenceRef[] => [b, o].flatMap(period => fields.map(field => evidence(period.id, field, `${period === b ? 'Baseline' : 'Observation'} · ${{ units: 'processed units', staffedHours: 'staffed hours', laborCostCents: 'direct labor cost' }[field] ?? field}`)));
  const findings: Finding[] = data.claims.map(claim => {
    const common = { id: `${claim.id}-FINDING`, subjectId: claim.id, ruleId: data.definitions.id, visibleAt: 4 as Step };
    const claimRef = evidence(data.claimsRecordId, `${claim.id}.claimedValue`, 'Claim · submitted value');
    const definitionRef = evidence(data.definitions.id, claim.metric, 'Fictional metric definition');
    if (claim.metric === 'throughput') {
      const matches = comparable && equal(increase, rational(claim.claimedPercent ?? 0));
      return { ...common, title: 'Throughput', status: matches ? 'clear' : 'exception', basis: 'observed', statusLabel: matches ? 'Reconciled' : 'Discrepancy',
        summary: matches ? `${number(valueOf(increase))}% observed increase.` : 'Claim differs from the period comparison.',
        values: { baselineThroughput: valueOf(baseThroughput), observedThroughput: valueOf(obsThroughput), increasePercent: valueOf(increase) },
        details: [ { label: 'Baseline throughput', value: `${number(b.units)} ÷ ${number(b.staffedHours)} = ${number(valueOf(baseThroughput))} units/hour` }, { label: 'Observed throughput', value: `${number(o.units)} ÷ ${number(o.staffedHours)} = ${number(valueOf(obsThroughput))} units/hour` }, { label: 'Relative increase', value: `(${number(valueOf(obsThroughput))} − ${number(valueOf(baseThroughput))}) ÷ ${number(valueOf(baseThroughput))} × 100 = ${number(valueOf(increase))}%` }, { label: 'Attribution', value: 'Not established' } ],
        explanation: comparable ? 'Equal seven-day periods use the same fictional site scope, metric definitions, and currency. The observed change does not establish causation.' : 'Period scope or definitions differ; comparison requires review.',
        evidence: [claimRef, ...metricRefs(['units', 'staffedHours']), definitionRef, evidence(b.id, 'definitionId', 'Baseline · definition reference'), evidence(o.id, 'definitionId', 'Observation · definition reference')],
        reviewActions: matches ? ['reconciled'] : ['revision-requested'],
      };
    }
    if (claim.metric === 'labor') {
      const difference = subtract(rational(claim.claimedCents ?? 0), normalizedDifference);
      const matches = comparable && difference.numerator === 0;
      return { ...common, title: 'Direct labor cost', status: matches ? 'clear' : 'exception', basis: 'observed', statusLabel: matches ? 'Reconciled' : 'Discrepancy',
        summary: matches ? 'Claim matches the normalized comparison.' : `Claim ${difference.numerator >= 0 ? 'exceeds' : 'falls below'} calculation by ${money(Math.abs(valueOf(difference)))}.`,
        values: { claimedCents: claim.claimedCents, calculatedCents: valueOf(normalizedDifference), differenceCents: valueOf(difference), actualSpendIncreaseCents: o.laborCostCents - b.laborCostCents, baselineUnitCostCents: valueOf(baseUnit), observedUnitCostCents: valueOf(obsUnit), benchmarkCents: valueOf(benchmark) },
        details: [
          { label: 'Claimed normalized difference', value: money(claim.claimedCents ?? 0) },
          { label: 'Baseline cost per unit', value: `${money(b.laborCostCents)} ÷ ${number(b.units)} = ${money(valueOf(baseUnit))}` },
          { label: 'Observed cost per unit', value: `${money(o.laborCostCents)} ÷ ${number(o.units)} = ${money(valueOf(obsUnit))}` },
          { label: 'Constant-volume benchmark', value: `${number(o.units)} × ${money(valueOf(baseUnit))} = ${money(valueOf(benchmark))}` },
          { label: 'Calculated normalized difference', value: `${money(valueOf(benchmark))} − ${money(o.laborCostCents)} = ${money(valueOf(normalizedDifference))}` },
          { label: 'Actual total labor spend', value: `${money(o.laborCostCents - b.laborCostCents)} increase` },
        ],
        explanation: 'The normalized difference is a comparison at observed volume, not realized savings or automation-attributed value. Attribution is not established.',
        evidence: [claimRef, ...metricRefs(['units', 'laborCostCents']), definitionRef], reviewActions: matches ? ['reconciled'] : ['revision-requested'],
      };
    }
    const baseExtract = data.maintenanceExtracts.find(e => e.id === data.manifest.baselineMaintenanceExtractId && e.period === 'baseline');
    const obsExtract = data.maintenanceExtracts.find(e => e.id === data.manifest.observationMaintenanceExtractId && e.period === 'observation');
    const calculated = baseExtract && obsExtract ? baseExtract.costCents - obsExtract.costCents : null;
    const matches = calculated !== null && calculated === claim.claimedCents;
    const refs = [claimRef, evidence(data.manifest.id, 'baselineMaintenanceExtractId', 'Manifest · baseline maintenance extract'), evidence(data.manifest.id, 'observationMaintenanceExtractId', 'Manifest · observation maintenance extract'), definitionRef];
    if (baseExtract) refs.push(evidence(baseExtract.id, 'costCents', 'Baseline · maintenance cost'));
    if (obsExtract) refs.push(evidence(obsExtract.id, 'costCents', 'Observation · maintenance cost'));
    return { ...common, title: 'Maintenance cost', status: calculated === null ? 'missing' : matches ? 'clear' : 'exception', basis: calculated === null ? 'missing' : 'observed', statusLabel: calculated === null ? 'Missing evidence' : matches ? 'Reconciled' : 'Discrepancy',
      summary: calculated === null ? 'Maintenance cost extracts missing.' : matches ? 'Claim matches the supplied cost extracts.' : 'Claim differs from the supplied cost extracts.',
      values: { claimedCents: claim.claimedCents, calculatedCents: calculated, differenceCents: calculated === null ? null : (claim.claimedCents ?? 0) - calculated },
      details: [ { label: 'Claimed decrease', value: money(claim.claimedCents ?? 0) }, { label: 'Baseline maintenance extract', value: baseExtract ? money(baseExtract.costCents) : 'Not supplied' }, { label: 'Observation maintenance extract', value: obsExtract ? money(obsExtract.costCents) : 'Not supplied' }, { label: 'Calculated decrease', value: calculated === null ? 'Not supplied' : money(calculated) } ],
      explanation: calculated === null ? 'Both cost extracts are required. Missing amounts cannot be treated as zero; this claim cannot yet be validated.' : 'The supplied extracts support a cost comparison. Attribution remains unestablished.',
      evidence: refs, reviewActions: calculated === null ? ['evidence-requested'] : matches ? ['reconciled'] : ['revision-requested'],
    };
  });
  return snapshot(step, findings, ['claims', 'reconciled', 'discrepancy', 'evidence gap'], { text: 'A staffing schedule changed during observation. Possible confounder; attribution is not established.', evidence: evidence(data.change.id, 'description', 'Inspect change log') });
}
