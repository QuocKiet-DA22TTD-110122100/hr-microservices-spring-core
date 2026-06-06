import { LucideIcon } from 'lucide-react';
import { WorkspaceRole } from '@/config/roleExperience';

export type WorkspaceStatus = 'pending' | 'approved' | 'inProgress' | 'blocked';
export type WorkspacePriority = 'high' | 'medium' | 'normal';

export interface WorkspaceMetric {
  label: string;
  value: string;
  hint: string;
}

export interface WorkspaceItem {
  title: string;
  description: string;
  owner: string;
  meta: string;
  status: WorkspaceStatus;
  priority: WorkspacePriority;
  due: string;
  nextStep: string;
}

export interface WorkspaceDefinition {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  allowedRoles: WorkspaceRole[];
  primaryAction: string;
  secondaryAction: string;
  metrics: WorkspaceMetric[];
  items: WorkspaceItem[];
  processNotes: string[];
}
