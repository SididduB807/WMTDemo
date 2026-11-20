import type { AgentDefinition } from '../../engine/types';
import { investmentFixtures, investmentRecords } from './fixtures';
import { processInvestment } from './process';

export const investmentAgent: AgentDefinition = {
  id: 'investment', name: 'Investment evidence', shortName: 'Investment',
  description: 'Recalculate the claim. Separate change from cause.',
  scope: 'Fictional benefit claims for SYN-PROJECT-A. Observed differences do not establish investment returns.',
  steps: ['Match definitions', 'Compare periods', 'Recalculate claims', 'Check supporting evidence', 'Prepare review'],
  initialRecordId: 'SYN-INV-BASE-01', initialGroupId: 'SYN-INV-PERIODS',
  records: investmentRecords(investmentFixtures), snapshot: step => processInvestment(investmentFixtures, step),
};
