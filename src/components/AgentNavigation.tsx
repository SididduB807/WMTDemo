import type { Dispatch, KeyboardEvent } from 'react';
import { Boxes, ChartNoAxesCombined, Route } from 'lucide-react';
import { agents } from '../agents';
import type { AgentId } from '../engine/types';
import type { WorkspaceAction } from '../engine/reducer';

export function AgentNavigation({ activeId, dispatch }: { activeId: AgentId; dispatch: Dispatch<WorkspaceAction> }) {
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number;
    if (event.key === 'ArrowRight') next = (index + 1) % agents.length;
    else if (event.key === 'ArrowLeft') next = (index + agents.length - 1) % agents.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = agents.length - 1;
    else return;
    event.preventDefault();
    dispatch({ type: 'switch', agentId: agents[next].id });
    document.getElementById(`tab-${agents[next].id}`)?.focus();
  };
  return <div className="agent-tabs" role="tablist" aria-label="Agent workflows">{agents.map((agent, index) => {
    const Icon = { fulfillment: Boxes, investment: ChartNoAxesCombined, handoff: Route }[agent.id];
    return <button key={agent.id} role="tab" id={`tab-${agent.id}`} aria-selected={activeId === agent.id} aria-controls={`panel-${agent.id}`} tabIndex={activeId === agent.id ? 0 : -1} className={`agent-tab ${activeId === agent.id ? 'active' : ''}`} onKeyDown={event => onKeyDown(event, index)} onClick={() => dispatch({ type: 'switch', agentId: agent.id })}><span className="agent-number">0{index + 1}</span><Icon size={15} /><span>{agent.name}</span></button>;
  })}</div>;
}
