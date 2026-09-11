export type AgentDecision = 'AGENT' | 'DIRECT_OWNER' | 'UNKNOWN';

export interface LeadFilterPolicy {
  ownerOnly: boolean;
  excludeAgents: boolean;
  minimumIntentScore: number;
}

export const DEFAULT_LEAD_FILTER_POLICY: LeadFilterPolicy = {
  ownerOnly: false,
  excludeAgents: true,
  minimumIntentScore: 7,
};

const STRONG_AGENCY_PATTERNS = [
  /\bestate\s+agent\b/i,
  /\bletting\s+agent\b/i,
  /\breal\s+estate\b/i,
  /\bproperty\s+consultant\b/i,
  /\bproperty\s+agency\b/i,
  /\bcommission\b/i,
  /\bagency\s+fee(?:s)?\s+(?:apply|applies|required)/i,
  /\b(?:our|we\s+have)\s+(?:properties|listings)\b/i,
];

export function hasStrongAgencySignal(text: string): boolean {
  return STRONG_AGENCY_PATTERNS.some((pattern) => pattern.test(text));
}

export function shouldStoreLead(
  lead: { lead_type: 'OWNER' | 'CLIENT'; is_agent: boolean; intent_score: number | null },
  agentDecision: AgentDecision,
  policy: LeadFilterPolicy
): { accepted: boolean; reason?: 'CLIENT' | 'AGENT' | 'UNKNOWN_AGENT' | 'LOW_SCORE' } {
  if (policy.ownerOnly && lead.lead_type !== 'OWNER') {
    return { accepted: false, reason: 'CLIENT' };
  }

  if (lead.lead_type === 'OWNER' && policy.excludeAgents) {
    if (lead.is_agent || agentDecision === 'AGENT') {
      return { accepted: false, reason: 'AGENT' };
    }
    if (agentDecision === 'UNKNOWN') {
      return { accepted: false, reason: 'UNKNOWN_AGENT' };
    }
  }

  if (
    lead.lead_type === 'OWNER' &&
    policy.minimumIntentScore > 0 &&
    (lead.intent_score === null || lead.intent_score < policy.minimumIntentScore)
  ) {
    return { accepted: false, reason: 'LOW_SCORE' };
  }

  return { accepted: true };
}

export function policyFromGroup(group: Partial<LeadFilterPolicy>): LeadFilterPolicy {
  return {
    ownerOnly: group.ownerOnly ?? DEFAULT_LEAD_FILTER_POLICY.ownerOnly,
    excludeAgents: group.excludeAgents ?? DEFAULT_LEAD_FILTER_POLICY.excludeAgents,
    minimumIntentScore: Math.min(
      10,
      Math.max(0, group.minimumIntentScore ?? DEFAULT_LEAD_FILTER_POLICY.minimumIntentScore)
    ),
  };
}
