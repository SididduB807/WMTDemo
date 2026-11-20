import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import type { Dispatch } from 'react';
import type { WorkspaceAction } from '../engine/reducer';

export function PlaybackControls({ step, playing, dispatch }: { step: number; playing: boolean; dispatch: Dispatch<WorkspaceAction> }) {
  return <div className="playback-controls" role="group" aria-label="Workflow playback">
    <button className="reset-button icon-button" aria-label="Reset active workflow" title="Reset active workflow" onClick={() => dispatch({ type: 'reset' })}><RotateCcw size={14} /></button><span className="playback-divider" />
    <button className="icon-button" aria-label="Previous step" title="Previous step" disabled={step === 0} onClick={() => dispatch({ type: 'previous' })}><SkipBack size={15} /></button>
    <button className="play-button" aria-label={playing ? 'Pause workflow' : 'Play workflow'} disabled={step === 5} onClick={() => dispatch({ type: playing ? 'pause' : 'play' })}>{playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}</button>
    <button className="icon-button" aria-label="Next step" title="Next step" disabled={step === 5} onClick={() => dispatch({ type: 'next' })}><SkipForward size={15} /></button>
    <span className="step-indicator" aria-label={`Step ${step} of 5`}>{step}<span>/</span>5</span>
  </div>;
}
