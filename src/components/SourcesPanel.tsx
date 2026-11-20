import { ChevronDown, ChevronRight, FileText, FolderClosed, ListChecks, LockKeyhole, ScrollText } from 'lucide-react';
import type { Dispatch } from 'react';
import type { AgentDefinition, AgentSession } from '../engine/types';
import type { WorkspaceAction } from '../engine/reducer';

export function SourcesPanel({ agent, session, dispatch }: { agent: AgentDefinition; session: AgentSession; dispatch: Dispatch<WorkspaceAction> }) {
  const groups = [...new Map(agent.records.map(record => [record.groupId, { id: record.groupId, label: record.groupLabel }])).values()];
  return <section className="sources-panel panel" aria-labelledby="sources-heading">
    <div className="panel-heading"><h3 id="sources-heading">Sources <span className="count-badge">{agent.records.length}</span></h3><FolderClosed size={15} aria-hidden="true" /></div>
    <div className="source-scroll panel-scroll">
      <p className="panel-overline">SYNTHETIC SOURCE SET</p>
      {groups.map(group => {
        const expanded = session.expandedGroups.includes(group.id);
        const records = agent.records.filter(record => record.groupId === group.id);
        return <div className="source-group" key={group.id}>
          <button className="source-group-toggle" onClick={() => dispatch({ type: 'group', groupId: group.id })} aria-expanded={expanded} aria-controls={`group-${group.id}`}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}<span>{group.label}</span><span className="group-count">{records.length}</span>
          </button>
          <ul id={`group-${group.id}`} hidden={!expanded} className="source-records">
            {records.map(record => {
              const Icon = record.kind === 'policy' ? ScrollText : record.kind === 'manifest' ? ListChecks : FileText;
              return <li key={record.id}><button onClick={() => dispatch({ type: 'record', recordId: record.id })} className={`source-record ${session.selectedRecordId === record.id ? 'selected' : ''}`} aria-current={session.selectedRecordId === record.id ? 'true' : undefined} aria-label={`Open ${group.label}: ${record.title}`}>
                <Icon size={15} /><span>{record.title}</span>{session.selectedRecordId === record.id && <span className="selected-source-dot" />}
              </button></li>;
            })}
          </ul>
        </div>;
      })}
    </div>
    <div className="source-footer"><LockKeyhole size={12} /> Read-only source records</div>
  </section>;
}
