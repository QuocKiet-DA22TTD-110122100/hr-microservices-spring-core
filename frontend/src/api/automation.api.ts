import apiClient from '@/utils/axios';

export interface AutomationRuleTrigger {
  event: string;
  condition: string;
}

export interface AutomationRuleAction {
  type: string;
  target_status?: string;
  channel?: string;
}

export interface AutomationRule {
  rule_id: string;
  rule_name: string;
  trigger: AutomationRuleTrigger;
  action: AutomationRuleAction;
  is_enabled: boolean;
}

const AUTOMATION_RULES_PATH = '/v1/automation/rules';

export const automationApi = {
  createRule: async (payload: AutomationRule): Promise<AutomationRule> => {
    const response = await apiClient.post<AutomationRule>(AUTOMATION_RULES_PATH, payload);
    return response.data;
  },

  updateRuleState: async (ruleId: string, isEnabled: boolean): Promise<AutomationRule> => {
    const response = await apiClient.patch<AutomationRule>(`${AUTOMATION_RULES_PATH}/${ruleId}`, {
      is_enabled: isEnabled,
    });
    return response.data;
  },
};
