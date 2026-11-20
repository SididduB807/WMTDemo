import type { AgentSnapshot, ContextNote, Finding, Step } from './types';

export function snapshot(step: Step, findings: Finding[], labels: [string, string, string, string], context?: ContextNote): AgentSnapshot {
  const visible = findings.filter(finding => finding.visibleAt <= step);
  return {
    step,
    findings: visible,
    counts: visible.length ? [
      { label: labels[0], value: visible.length },
      { label: labels[1], value: visible.filter(f => f.status === 'clear').length, tone: 'clear' },
      { label: labels[2], value: visible.filter(f => f.status === 'exception').length, tone: 'exception' },
      { label: labels[3], value: visible.filter(f => f.status === 'missing').length, tone: 'missing' },
    ] : [],
    context: step >= 3 ? context : undefined,
  };
}
