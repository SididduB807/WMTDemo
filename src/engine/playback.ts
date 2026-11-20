import { useEffect } from 'react';
import type { Dispatch } from 'react';
import type { WorkspaceAction, WorkspaceState } from './reducer';
import { design } from '../config/design';

export function usePlayback(state: WorkspaceState, dispatch: Dispatch<WorkspaceAction>) {
  const step = state.sessions[state.activeAgent].step;
  useEffect(() => {
    if (!state.playing || state.discussion || step === 5) return;
    const timer = window.setTimeout(() => dispatch({ type: 'tick' }), design.playbackMs);
    return () => window.clearTimeout(timer);
  }, [state.playing, state.discussion, state.activeAgent, step, dispatch]);
}
