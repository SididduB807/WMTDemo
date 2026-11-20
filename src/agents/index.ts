import { fulfillmentAgent } from './fulfillment/config';
import { investmentAgent } from './investment/config';
import { handoffAgent } from './handoff/config';
import type { AgentId, AgentDefinition } from '../engine/types';

export const agents: AgentDefinition[] = [fulfillmentAgent, investmentAgent, handoffAgent];
export const agentById = Object.fromEntries(agents.map(agent => [agent.id, agent])) as Record<AgentId, AgentDefinition>;
