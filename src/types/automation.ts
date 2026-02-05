export type AutomationTrigger = 'event_created' | 'event_updated' | 'status_changed';
export type AutomationAction = 'whatsapp_message';

export interface Automation {
  id: string;
  created_at: string;
  name: string;
  trigger_event: AutomationTrigger;
  trigger_conditions: Record<string, any> | null;
  action_type: AutomationAction;
  action_config: {
    message: string;
    target_role?: string; // 'client', 'admin', 'staff'
  };
  active: boolean;
}

export type NewAutomation = Omit<Automation, 'id' | 'created_at'>;
