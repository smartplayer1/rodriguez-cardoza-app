import { Paging } from '@/app/type/incentive';

export interface AgentNearGoalRecord {
  clientCode: string;
  clientName: string;
  phoneNumber: string | null;
  clientType: string;
  promoterCode: string | null;
  promoterName: string | null;
  incentiveRuleId: number;
  incentiveRuleName: string;
  ruleType: string;
  amountTarget: number | null;
  amountProgress: number | null;
  amountProgressPercentage: number | null;
  amountRemaining: number | null;
  productVolumeTargetQuantity: number | null;
  productVolumeProgress: number | null;
  productVolumeProgressPercentage: number | null;
  productVolumeRemaining: number | null;
  overallProgressPercentage: number;
  winsCount: number;
  maxWinsPerClient: number | null;
  isGoalReached: boolean;
  isMaxWinsReached: boolean;
  ruleStartDate: string;
  ruleEndDate: string;
}

export interface AgentsNearGoalsSummary {
  participantCount: number;
  recordCount: number;
  averageOverallProgressPercentage: number;
}

export interface AgentsNearGoalsRecords {
  records: AgentNearGoalRecord[];
  paging: Paging;
}

export interface AgentsNearGoalsResponse {
  summary: AgentsNearGoalsSummary;
  records: AgentsNearGoalsRecords;
}

export type AgentsNearGoalsFilters = {
  activeOnFrom?: string;
  activeOnTo?: string;
  incentiveRuleId?: number;
  incentiveRuleName?: string;
  ruleType?: string;
  participantClientType?: string;
  clientCode?: string;
  clientName?: string;
  clientType?: string;
  promoterCode?: string;
  branchCode?: string;
  page?: number;
  perPage?: number;
};
