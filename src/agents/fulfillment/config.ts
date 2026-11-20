import type { AgentDefinition } from '../../engine/types';
import { fulfillmentFixtures, fulfillmentRecords } from './fixtures';
import { processFulfillment } from './process';

export const fulfillmentAgent: AgentDefinition = {
  id: 'fulfillment', name: 'Fulfillment investigation', shortName: 'Fulfillment',
  description: 'Reconstruct the timeline. Find the evidence.',
  scope: 'Retrospective review of fictional store deliveries. Source records remain unchanged.',
  steps: ['Match records', 'Rebuild timelines', 'Check deadlines', 'Check evidence', 'Prepare review'],
  initialRecordId: 'SYN-FUL-ORDER-101', initialGroupId: 'SYN-ORDER-101',
  records: fulfillmentRecords(fulfillmentFixtures), snapshot: step => processFulfillment(fulfillmentFixtures, step),
};
