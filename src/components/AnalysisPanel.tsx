import { ArrowDown, ArrowRight, Check, CheckCheck, ChevronDown, CircleCheck, CircleDashed, ClipboardCheck, FileSearch, Info, Link2, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { Dispatch } from 'react';
import type { AgentDefinition, AgentSession, AgentSnapshot, EvidenceRef, Finding, ReviewAction, ReviewDecision } from '../engine/types';
import type { WorkspaceAction } from '../engine/reducer';

const statusIcons = { clear: CircleCheck, exception: TriangleAlert, missing: CircleDashed };
const actionLabels: Record<ReviewAction, string> = { reviewed: 'Mark reviewed', 'evidence-requested': 'Request evidence', reconciled: 'Mark reconciled', 'revision-requested': 'Return for revision', 'draft-approved': 'Approve draft handoff' };
const decisionLabels: Record<ReviewAction, string> = { reviewed: 'Reviewed', 'evidence-requested': 'Evidence requested', reconciled: 'Reconciled', 'revision-requested': 'Returned for revision', 'draft-approved': 'Draft approved' };

export function ProcessingSteps({ agent, step, playing }: { agent: AgentDefinition; step: number; playing: boolean }) {
  return <ol className="processing-steps">{agent.steps.map((label, index) => <li key={label} className={`${step > index ? 'step-complete' : ''} ${step === index && playing ? 'step-running' : ''}`} aria-current={step === index && playing ? 'step' : undefined}>
    <span className="step-node">{step > index ? <Check size={12} strokeWidth={2.5} /> : String(index + 1).padStart(2, '0')}</span><span>{label}</span>{step > index && <span className="sr-only">Complete</span>}{step === index && playing && <span className="running-dot" />}
  </li>)}</ol>;
}
export function EvidenceLinks({ refs, dispatch }: { refs: EvidenceRef[]; dispatch: Dispatch<WorkspaceAction> }) {
  return <div className="evidence-links"><h5>LINKED EVIDENCE <span>{refs.length}</span></h5>{refs.map(ref => <button key={`${ref.recordId}-${ref.fieldId}`} onClick={() => dispatch({ type: 'evidence', ref })} aria-label={`Inspect evidence: ${ref.label}; ${ref.recordId}; ${ref.fieldId}`}><Link2 size={12} /><span>{ref.label}</span><ArrowRight size={12} /></button>)}</div>;
}
export function ReviewControls({ agent, finding, decision, dispatch }: { agent: AgentDefinition; finding: Finding; decision?: ReviewDecision; dispatch: Dispatch<WorkspaceAction> }) {
  return <div className="review-controls">
    <h5><ShieldCheck size={14} /> HUMAN REVIEW</h5>
    {decision && <div className="review-decision" role="status"><CheckCheck size={15} /><div><strong>{decisionLabels[decision.action]}</strong><span>{decision.action === 'draft-approved' ? 'Not sent · Local draft only' : 'Local review state · Nothing sent'}</span></div></div>}
    <div className="review-actions">{finding.reviewActions.map((action, index) => <button key={action} className={index === 0 ? 'button-primary' : 'button-secondary'} disabled={decision?.action === action} onClick={() => dispatch({ type: 'review', findingId: finding.id, action })}>{action === 'reviewed' && agent.id === 'handoff' ? 'Mark packet reviewed' : actionLabels[action]}</button>)}</div>
    <p>{agent.id === 'fulfillment' ? 'Acknowledgement does not establish a root cause.' : agent.id === 'investment' ? 'Review does not approve returns or funding.' : 'Source queues remain unchanged.'}</p>
  </div>;
}
export function FindingsList({ findings, selectedId, dispatch }: { findings: Finding[]; selectedId?: string; dispatch: Dispatch<WorkspaceAction> }) {
  return <ul className="findings-list" aria-label="Computed findings">{findings.map(finding => {
    const Icon = statusIcons[finding.status];
    return <li key={finding.id}><button className={`finding-card ${selectedId === finding.id ? 'finding-selected' : ''}`} onClick={() => dispatch({ type: 'finding', findingId: finding.id })} aria-pressed={selectedId === finding.id} aria-label={`${finding.title}: ${finding.statusLabel}. ${finding.summary}`}>
      <span className={`finding-icon tone-${finding.status}`}><Icon size={16} /></span><span className="finding-copy"><span className="finding-title">{finding.title}<span className={`finding-status tone-${finding.status}`}>{finding.statusLabel}</span></span><span className="finding-summary">{finding.summary}</span></span>
    </button></li>;
  })}</ul>;
}
export function FindingDetail({ agent, finding, session, dispatch }: { agent: AgentDefinition; finding: Finding; session: AgentSession; dispatch: Dispatch<WorkspaceAction> }) {
  return <section className="finding-detail" aria-label={`${finding.title} finding details`}>
    <div className="detail-title"><h4>{finding.title} <span>evidence</span></h4><span className={`basis-tag ${finding.basis}`}>{finding.basis === 'missing' ? 'Missing' : finding.basis === 'inferred' ? 'Inferred' : 'Observed'}</span></div>
    <dl className="finding-values">{finding.details.map(detail => <div key={detail.label}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}</dl>
    <p className="finding-explanation">{finding.explanation}</p>
    {finding.question && <p className="open-question"><Info size={13} /><span>{finding.question}</span></p>}
    <EvidenceLinks refs={finding.evidence} dispatch={dispatch} />
    {session.step === 5 ? <ReviewControls agent={agent} finding={finding} decision={session.decisions[finding.id]} dispatch={dispatch} /> : <div className="review-pending"><ClipboardCheck size={14} /> Review unlocks at step 5.</div>}
  </section>;
}
export function AnalysisPanel({ agent, session, snapshot, playing, dispatch }: { agent: AgentDefinition; session: AgentSession; snapshot: AgentSnapshot; playing: boolean; dispatch: Dispatch<WorkspaceAction> }) {
  const finding = snapshot.findings.find(f => f.id === session.selectedFindingId) ?? snapshot.findings[0];
  const hasFindings = snapshot.findings.length > 0;
  return <section className="analysis-panel panel" aria-labelledby="analysis-heading">
    <div className="panel-heading"><h3 id="analysis-heading">Analysis</h3><span className="analysis-step">{session.step} / 5</span></div>
    <div className="analysis-scroll panel-scroll" tabIndex={0} aria-label="Analysis details">
      {hasFindings ? <details className="completed-steps"><summary><span><CheckCheck size={14} />{session.step} of 5 steps complete</span><ChevronDown size={13} /></summary><ProcessingSteps agent={agent} step={session.step} playing={playing} /></details> : <><div className="analysis-intro"><span className="panel-overline">THE REVIEW PROCESS</span><p>From source records to a reviewable finding.</p></div><ProcessingSteps agent={agent} step={session.step} playing={playing} /></>}
      {!hasFindings && <div className="analysis-empty"><div className="empty-illustration"><span><FileSearch size={21} strokeWidth={1.5} /></span><span className="empty-connector" /><span><ClipboardCheck size={21} strokeWidth={1.5} /></span></div><h4>{session.step === 0 ? 'Ready when you are.' : 'Building the evidence trail.'}</h4><p>{session.step === 0 ? 'Play the workflow, or move through each step at your own pace.' : 'Findings appear after the relevant comparisons and evidence checks.'}</p><span className="empty-hint">Use the controls below <ArrowDown size={12} /></span></div>}
      {hasFindings && <><div className="summary-counts" aria-label="Computed summary">{snapshot.counts.map(count => <div key={count.label}><strong className={count.tone ? `tone-${count.tone}` : ''}>{count.value}</strong><span>{count.label}</span></div>)}</div><FindingsList findings={snapshot.findings} selectedId={finding?.id} dispatch={dispatch} />
        {snapshot.context && <div className="context-note"><Info size={14} /><div><p>{snapshot.context.text}</p><button onClick={() => dispatch({ type: 'evidence', ref: snapshot.context!.evidence })}>Inspect change log <ArrowRight size={12} /></button></div></div>}
        {finding && <FindingDetail agent={agent} finding={finding} session={session} dispatch={dispatch} />}
      </>}
    </div>
    {!hasFindings && <div className="analysis-footer"><ShieldCheck size={13} /> Evidence first. You make the call.</div>}
  </section>;
}
