import { describe, expect, it } from 'vitest';
import { agents } from '../agents';
import { initialState, workspaceReducer as reduce } from './reducer';
import type { WorkspaceState } from './reducer';

const complete = (state: WorkspaceState) => Array.from({ length: 5 }).reduce<WorkspaceState>(s => reduce(s, { type: 'next' }), state);
describe('workspace transitions', () => {
  it('starts paused, clamps steps, and stops playback at completion', () => {
    let state = initialState();
    expect(state.playing).toBe(false);
    expect(reduce(state, { type: 'previous' }).sessions.fulfillment.step).toBe(0);
    state = reduce(state, { type: 'play' });
    for (let i = 0; i < 8; i++) state = reduce(state, { type: 'tick' });
    expect(state.sessions.fulfillment.step).toBe(5);
    expect(state.playing).toBe(false);
    expect(reduce(state, { type: 'play' }).playing).toBe(false);
  });
  it('rejects premature or impermissible review decisions', () => {
    const finding = agents[0].snapshot(5).findings[0];
    const action = { type: 'review' as const, findingId: finding.id, action: 'reviewed' as const };
    expect(reduce(initialState(), action).sessions.fulfillment.decisions).toEqual({});
    const state = complete(initialState());
    expect(reduce(state, { ...action, action: 'draft-approved' }).sessions.fulfillment.decisions).toEqual({});
    expect(reduce(state, action).sessions.fulfillment.decisions[finding.id].action).toBe('reviewed');
  });
  it('preserves selections and decisions through rewind, agent switches, and discussion', () => {
    let state = complete(initialState());
    const finding = agents[0].snapshot(5).findings[1];
    const ref = finding.evidence[0];
    state = reduce(state, { type: 'finding', findingId: finding.id });
    state = reduce(state, { type: 'review', findingId: finding.id, action: 'reviewed' });
    state = reduce(state, { type: 'evidence', ref });
    const saved = structuredClone(state.sessions.fulfillment);
    state = reduce(state, { type: 'previous' });
    state = reduce(state, { type: 'next' });
    expect(state.sessions.fulfillment).toEqual(saved);
    state = reduce(state, { type: 'switch', agentId: 'investment' });
    state = reduce(state, { type: 'play' });
    state = reduce(state, { type: 'switch', agentId: 'fulfillment' });
    expect(state.playing).toBe(false);
    expect(state.sessions.fulfillment).toEqual(saved);
    state = reduce(state, { type: 'discuss' });
    expect(state.playing).toBe(false);
    state = reduce(state, { type: 'back' });
    expect(state.sessions.fulfillment).toEqual(saved);
  });
  it('resets only the active workflow', () => {
    let state = complete(initialState());
    const saved = structuredClone(state.sessions.fulfillment);
    state = reduce(state, { type: 'switch', agentId: 'handoff' });
    state = complete(state);
    state = reduce(state, { type: 'reset' });
    expect(state.sessions.fulfillment).toEqual(saved);
    expect(state.sessions.handoff.step).toBe(0);
    expect(state.sessions.handoff.decisions).toEqual({});
    expect(state.sessions.handoff.highlight).toBeNull();
  });
  it('expands the referenced source group, highlights a real field and ignores invalid references', () => {
    const agent = agents[0];
    const ref = agent.snapshot(5).findings[2].evidence.find(e => e.recordId === 'SYN-FUL-MANIFEST-01')!;
    const state = reduce(initialState(), { type: 'evidence', ref });
    expect(state.sessions.fulfillment.expandedGroups).toContain('SYN-FUL-REFERENCE');
    expect(state.sessions.fulfillment.highlight).toEqual(ref);
    expect(state.sessions.fulfillment.selectedRecordId).toBe(ref.recordId);
    expect(reduce(state, { type: 'evidence', ref: { ...ref, fieldId: 'nonexistent' } })).toBe(state);
  });
});
