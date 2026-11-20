import { Boxes, ChartNoAxesCombined, Route } from 'lucide-react';
import type { Dispatch } from 'react';
import type { AgentDefinition, AgentSession, AgentSnapshot } from '../engine/types';
import type { WorkspaceAction } from '../engine/reducer';
import { SourcesPanel } from './SourcesPanel';
import { RecordViewer } from './RecordViewer';
import { AnalysisPanel } from './AnalysisPanel';

export function WorkspaceHeader({ agent, session, playing }: { agent: AgentDefinition; session: AgentSession; playing: boolean }) {
  const Icon = { fulfillment: Boxes, investment: ChartNoAxesCombined, handoff: Route }[agent.id];
  return <div className="workspace-header"><div className="workspace-heading"><span className="workflow-icon"><Icon size={18} strokeWidth={1.7} /></span><div><h2>{agent.name}</h2><p>{agent.description}</p></div></div><span className={`workspace-status ${session.step === 5 ? 'ready' : ''}`}><span />{playing ? 'Running workflow' : session.step === 5 ? 'Ready for review' : session.step === 0 ? 'Ready to explore' : 'Paused'}<span className="sr-only"> · Step {session.step} of 5</span></span></div>;
}
export function DemoWorkspace({ agent, session, snapshot, playing, dispatch }: { agent: AgentDefinition; session: AgentSession; snapshot: AgentSnapshot; playing: boolean; dispatch: Dispatch<WorkspaceAction> }) {
  return <div className="workspace-frame"><div className="workspace" role="tabpanel" id={`panel-${agent.id}`} aria-labelledby={`tab-${agent.id}`}>
    <WorkspaceHeader agent={agent} session={session} playing={playing} />
    <div className="workspace-panels"><SourcesPanel agent={agent} session={session} dispatch={dispatch} /><RecordViewer agent={agent} session={session} dispatch={dispatch} /><AnalysisPanel agent={agent} session={session} snapshot={snapshot} playing={playing} dispatch={dispatch} /></div>
  </div></div>;
}
