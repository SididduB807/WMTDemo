import { useMemo, useReducer, useRef } from 'react';
import { agentById } from '../agents';
import { initialState, workspaceReducer } from '../engine/reducer';
import { usePlayback } from '../engine/playback';
import { AppHeader } from '../components/AppHeader';
import { DemoIntroduction } from '../components/DemoIntroduction';
import { DemoWorkspace } from '../components/DemoWorkspace';
import { AgentNavigation } from '../components/AgentNavigation';
import { PlaybackControls } from '../components/PlaybackControls';
import { DiscussionState } from '../components/DiscussionState';
import { SimulationDisclosure } from '../components/SimulationDisclosure';

export function App() {
  const [state, dispatch] = useReducer(workspaceReducer, undefined, initialState);
  const discussRef = useRef<HTMLButtonElement>(null);
  const agent = agentById[state.activeAgent];
  const session = state.sessions[state.activeAgent];
  const snapshot = useMemo(() => agent.snapshot(session.step), [agent, session.step]);
  usePlayback(state, dispatch);
  const onBack = () => { dispatch({ type: 'back' }); window.requestAnimationFrame(() => discussRef.current?.focus()); };
  return <div className="app-shell">
    <a href="#main" className="skip-link">Skip to workspace</a>
    <AppHeader onDiscuss={() => dispatch({ type: 'discuss' })} discussRef={discussRef} />
    <main id="main">{state.discussion ? <DiscussionState onBack={onBack} /> : <>
      <DemoIntroduction />
      <div className="workflow-control-rail">
        <AgentNavigation activeId={state.activeAgent} dispatch={dispatch} />
        <PlaybackControls step={session.step} playing={state.playing} dispatch={dispatch} />
      </div>
      <DemoWorkspace agent={agent} session={session} snapshot={snapshot} playing={state.playing} dispatch={dispatch} />
      <p className="workspace-scope">{agent.scope}</p>
    </>}</main>
    <SimulationDisclosure />
    <div className="sr-only" aria-live="polite" aria-atomic="true">{state.announcement}</div>
  </div>;
}
