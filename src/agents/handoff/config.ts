import type { AgentDefinition } from '../../engine/types';
import { handoffFixtures, handoffRecords } from './fixtures';
import { processHandoff } from './process';

export const handoffAgent: AgentDefinition = {
  id: 'handoff', name: 'Case handoff', shortName: 'Handoff',
  description: 'Assemble the packet. Review the next owner.',
  scope: 'Fictional marketplace-to-fulfillment cases. Approved handoffs remain local drafts and are not sent.',
  steps: ['Assemble chronology', 'Compare quantities', 'Check packet completeness', 'Apply ownership rule', 'Prepare handoff'],
  initialRecordId: 'SYN-HND-CASE-201', initialGroupId: 'SYN-HND-CASE-201',
  records: handoffRecords(handoffFixtures), snapshot: step => processHandoff(handoffFixtures, step),
};
