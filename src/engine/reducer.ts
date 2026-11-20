import { agentById, agents } from '../agents';
import type { AgentId, AgentSession, EvidenceRef, ReviewAction, Step } from './types';

export interface WorkspaceState {
  activeAgent: AgentId;
  playing: boolean;
  discussion: boolean;
  sessions: Record<AgentId, AgentSession>;
  announcement: string;
}
export type WorkspaceAction =
  | { type: 'switch'; agentId: AgentId }
  | { type: 'play' | 'pause' | 'tick' | 'previous' | 'next' | 'reset' | 'discuss' | 'back' }
  | { type: 'record'; recordId: string }
  | { type: 'group'; groupId: string }
  | { type: 'finding'; findingId: string }
  | { type: 'evidence'; ref: EvidenceRef }
  | { type: 'review'; findingId: string; action: ReviewAction };

export function initialSession(id: AgentId): AgentSession {
  const agent = agentById[id];
  return { step: 0, selectedRecordId: agent.initialRecordId, expandedGroups: [agent.initialGroupId], selectedFindingId: null, highlight: null, decisions: {} };
}
export function initialState(): WorkspaceState {
  return { activeAgent: 'fulfillment', playing: false, discussion: false, sessions: Object.fromEntries(agents.map(agent => [agent.id, initialSession(agent.id)])) as Record<AgentId, AgentSession>, announcement: '' };
}
export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  const id = state.activeAgent;
  const session = state.sessions[id];
  const agent = agentById[id];
  const update = (changes: Partial<AgentSession>, other: Partial<WorkspaceState> = {}): WorkspaceState => ({ ...state, ...other, sessions: { ...state.sessions, [id]: { ...session, ...changes } } });
  switch (action.type) {
    case 'switch': return { ...state, activeAgent: action.agentId, playing: false, announcement: `${agentById[action.agentId].name} selected.` };
    case 'play': return { ...state, playing: session.step < 5 && !state.discussion };
    case 'pause': return { ...state, playing: false };
    case 'tick': if (!state.playing || state.discussion) return state; return update({ step: Math.min(5, session.step + 1) as Step }, { playing: session.step < 4, announcement: session.step >= 4 ? 'Review packet ready.' : state.announcement });
    case 'next': return update({ step: Math.min(5, session.step + 1) as Step }, { playing: false, announcement: session.step < 5 ? `${agent.steps.at(session.step)} complete.` : state.announcement });
    case 'previous': return update({ step: Math.max(0, session.step - 1) as Step }, { playing: false, announcement: `Returned to step ${Math.max(0, session.step - 1)} of 5.` });
    case 'reset': return { ...state, playing: false, sessions: { ...state.sessions, [id]: initialSession(id) }, announcement: `${agent.name} reset.` };
    case 'discuss': return { ...state, discussion: true, playing: false, announcement: '' };
    case 'back': return { ...state, discussion: false, playing: false };
    case 'record': {
      const record = agent.records.find(record => record.id === action.recordId);
      if (!record) return state;
      return update({ selectedRecordId: record.id, highlight: null, expandedGroups: [...new Set([...session.expandedGroups, record.groupId])] });
    }
    case 'group': return update({ expandedGroups: session.expandedGroups.includes(action.groupId) ? session.expandedGroups.filter(group => group !== action.groupId) : [...session.expandedGroups, action.groupId] });
    case 'finding': return agent.snapshot(session.step).findings.some(finding => finding.id === action.findingId) ? update({ selectedFindingId: action.findingId }) : state;
    case 'evidence': {
      const record = agent.records.find(record => record.id === action.ref.recordId);
      if (!record?.fields.some(field => field.id === action.ref.fieldId)) return state;
      return update({ selectedRecordId: record.id, highlight: { ...action.ref }, expandedGroups: [...new Set([...session.expandedGroups, record.groupId])] }, { announcement: `Evidence opened: ${action.ref.label}. ${record.id}. Referenced field highlighted.` });
    }
    case 'review': {
      const finding = agent.snapshot(session.step).findings.find(finding => finding.id === action.findingId);
      if (session.step !== 5 || !finding?.reviewActions.includes(action.action)) return state;
      return update({ decisions: { ...session.decisions, [finding.id]: { action: action.action } } }, { announcement: action.action === 'draft-approved' ? 'Draft approved. Not sent.' : action.action === 'evidence-requested' ? 'Evidence requested. Local review state only; nothing sent.' : 'Review decision recorded locally.' });
    }
  }
}
