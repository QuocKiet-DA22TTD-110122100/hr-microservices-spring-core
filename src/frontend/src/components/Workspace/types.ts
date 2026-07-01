import { LucideIcon } from 'lucide-react';
import { WorkspaceRole } from '@/config/roleExperience';

export type WorkspaceStatus = 'pending' | 'approved' | 'inProgress' | 'blocked';
export type WorkspacePriority = 'high' | 'medium' | 'normal';

export interface WorkspaceMetric {
  label: string;
  value: string;
  hint: string;
}

export interface WorkspaceAssignee {
  name: string;
  initial: string;
  color: string;
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
  /** 0-100 completion %, shown as a progress bar for inProgress items */
  progress?: number;
  /** Specific member responsible for this item */
  assignee?: WorkspaceAssignee;
  /** ISO date (yyyy-MM-dd) used by calendar-style views, e.g. leave requests */
  date?: string;
  /** Marks an item that needs attention before approval (missing check-out, unconfirmed OT, ...) */
  isException?: boolean;
  /** Employee ids attached to a focused HR workflow item. */
  relatedEmployeeIds?: string[];
  /** Count of incomplete employee records represented by this item. */
  missingDataCount?: number;
  /** Route ID for deep-link review pages, e.g. 'task_bhxh_11' */
  reviewId?: string;
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
