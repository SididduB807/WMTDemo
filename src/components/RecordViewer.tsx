import { useEffect } from 'react';
import type { Dispatch } from 'react';
import { ArrowRight, Check, FileText, ListChecks, ScrollText } from 'lucide-react';
import type { AgentDefinition, AgentSession, SourceField, SourceRecord } from '../engine/types';
import type { WorkspaceAction } from '../engine/reducer';
import { fieldDomId, money, number, utc } from '../engine/evidence';

function display(field: SourceField) {
  if (field.value === null) return <span className="not-supplied">Not supplied</span>;
  if (field.format === 'utc') return utc(String(field.value));
  if (field.format === 'cents') return money(Number(field.value));
  if (field.format === 'number') return number(Number(field.value));
  return String(field.value);
}
interface FieldsProps { record: SourceRecord; fields: SourceField[]; highlighted: string | null }
function rowClass(field: SourceField, highlighted: string | null) { return `record-field ${highlighted === field.id ? 'evidence-highlight' : ''}`; }

export function StructuredRecord({ record, fields, highlighted }: FieldsProps) {
  return <dl className="structured-record">{fields.map(field => <div key={field.id} id={fieldDomId(record.id, field.id)} className={rowClass(field, highlighted)} data-highlighted={highlighted === field.id || undefined}>
    <dt>{field.label}</dt><dd>{display(field)}</dd>{field.note && <p className="field-note">{field.note}</p>}
  </div>)}</dl>;
}
export function EventTimeline({ record, fields, highlighted }: FieldsProps) {
  return <ol className="event-timeline">{fields.map(field => <li key={field.id} id={fieldDomId(record.id, field.id)} className={rowClass(field, highlighted)} data-highlighted={highlighted === field.id || undefined}>
    <span className="timeline-point" /><div><span className="timeline-label">{field.label}</span><time dateTime={String(field.value)}>{display(field)}</time></div>
  </li>)}</ol>;
}
export function MetricTable({ record, fields, highlighted }: FieldsProps) {
  return <div className="metric-table-wrap"><table className="metric-table"><caption className="sr-only">Fields in {record.id}</caption><thead><tr><th scope="col">Field</th><th scope="col">Recorded value</th></tr></thead><tbody>{fields.map(field => <tr key={field.id} id={fieldDomId(record.id, field.id)} className={rowClass(field, highlighted)} data-highlighted={highlighted === field.id || undefined}>
    <th scope="row">{field.label}{field.note && <span className="field-note">{field.note}</span>}</th><td>{display(field)}</td>
  </tr>)}</tbody></table></div>;
}
export function PolicyExcerpt({ record, fields, highlighted }: FieldsProps) {
  return <div className="policy-excerpt"><div className="fictional-rule-label"><ScrollText size={14} /> Fictional demo rule</div>{fields.map(field => <div key={field.id} id={fieldDomId(record.id, field.id)} className={rowClass(field, highlighted)} data-highlighted={highlighted === field.id || undefined}><h5>{field.label}</h5><p>{display(field)}</p></div>)}</div>;
}
export function RecordViewer({ agent, session, dispatch }: { agent: AgentDefinition; session: AgentSession; dispatch: Dispatch<WorkspaceAction> }) {
  const record = agent.records.find(record => record.id === session.selectedRecordId) ?? agent.records[0];
  const highlight = session.highlight?.recordId === record.id ? session.highlight.fieldId : null;
  useEffect(() => {
    if (!session.highlight) return;
    const target = document.getElementById(fieldDomId(session.highlight.recordId, session.highlight.fieldId));
    target?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, [session.highlight]);
  useEffect(() => {
    if (!session.highlight) document.getElementById('record-scroll')?.scrollTo({ top: 0 });
  }, [record.id, session.highlight]);
  const chronologyFields = record.fields.filter(field => field.id.startsWith('chronology.'));
  const standardFields = record.fields.filter(field => !field.id.startsWith('chronology.'));
  const related = agent.records.filter(item => item.groupId === record.groupId && item.id !== record.id);
  const Icon = record.kind === 'policy' ? ScrollText : record.kind === 'manifest' ? ListChecks : FileText;
  return <section className="record-panel panel" aria-labelledby="record-heading">
    <div className="panel-heading"><h3 id="record-heading">Record viewer</h3><span className="utc-label">UTC</span></div>
    <div className="record-scroll panel-scroll" id="record-scroll" tabIndex={0} aria-label="Selected source record">
      <div className="record-breadcrumb">{record.groupLabel}<span>/</span>{record.title}</div>
      <div className="record-document">
        <div className="document-top"><span className="document-icon"><Icon size={20} strokeWidth={1.6} /></span><span className="synthetic-label"><span />Synthetic record</span></div>
        <p className="record-id">{record.id}</p><h4>{record.title}</h4><p className="record-description">{record.description}</p>
        {record.kind === 'policy' ? <PolicyExcerpt record={record} fields={standardFields} highlighted={highlight} /> : record.kind === 'timeline' ? <EventTimeline record={record} fields={standardFields} highlighted={highlight} /> : record.kind === 'metrics' || record.kind === 'manifest' ? <MetricTable record={record} fields={standardFields} highlighted={highlight} /> : <StructuredRecord record={record} fields={standardFields} highlighted={highlight} />}
        {!!chronologyFields.length && <><h5 className="chronology-heading">Case chronology</h5><EventTimeline record={record} fields={chronologyFields} highlighted={highlight} /></>}
        <div className="record-provenance"><Check size={13} /><span>Fixed demonstration fixture · Original values</span></div>
      </div>
      {!!related.length && <div className="related-records"><h5>IN THIS SOURCE GROUP</h5>{related.map(item => <button key={item.id} onClick={() => dispatch({ type: 'record', recordId: item.id })}><FileText size={14} /><span>{item.title}</span><ArrowRight size={14} /></button>)}</div>}
      <p className="record-footnote">Invented records for a narrow, retrospective review.</p>
    </div>
  </section>;
}
