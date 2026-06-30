import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AtSign,
  ArrowLeft,
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FolderKanban,
  History,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  Languages,
  MessageSquareText,
  Paperclip,
  PlugZap,
  Plus,
  Settings,
  ShieldCheck,
  Smartphone,
  Upload,
  Users,
  Workflow,
  XCircle,
} from 'lucide-react';
import { projectApi } from '@/api/project.api';
import { taskApi } from '@/api/task.api';
import { aiApi, AiRiskRadarItem, AiSuggestion } from '@/api/ai.api';
import { automationApi, AutomationRule } from '@/api/automation.api';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { Input } from '@/components/UI/Input';
import { resolveWorkspaceRole, WorkspaceRole } from '@/config/roleExperience';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/authStore';
import { Project } from '@/types/project';
import { Task, TaskPriority, TaskRequest, TaskStatus } from '@/types/task';
import { cn } from '@/utils/cn';
import { PERMISSIONS } from '@/utils/permissions';

type WorkView =
  | 'dashboard'
  | 'my-tasks'
  | 'projects'
  | 'board'
  | 'manage'
  | 'approvals'
  | 'notifications'
  | 'discussions'
  | 'files'
  | 'activity'
  | 'settings'
  | 'analytics'
  | 'timeline'
  | 'ai'
  | 'automation'
  | 'integrations'
  | 'mobile'
  | 'admin';
type BoardStatus = TaskStatus | 'REVIEW';

interface ProjectSummary extends Project {
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
  highPriorityTaskCount: number;
}

interface WorkNavItem {
  key: WorkView;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
  roles: WorkspaceRole[];
}

const workNavItems: WorkNavItem[] = [
  {
    key: 'dashboard',
    label: 'My Dashboard',
    description: 'Viec hom nay, viec dang lam va can chu y.',
    icon: LayoutDashboard,
    roles: ['employee', 'manager', 'departmentHead', 'admin'],
  },
  {
    key: 'my-tasks',
    label: 'My Tasks',
    description: 'Tất cả công việc cá nhân theo trạng thái.',
    icon: ListChecks,
    roles: ['employee', 'manager', 'departmentHead'],
  },
  {
    key: 'projects',
    label: 'Projects',
    description: 'Dự án tham gia va bang Kanban.',
    icon: FolderKanban,
    roles: ['employee', 'manager', 'departmentHead', 'admin'],
  },
  {
    key: 'board',
    label: 'Project Board',
    description: 'Kanban board cho task theo du an.',
    icon: Briefcase,
    roles: ['employee', 'manager', 'departmentHead', 'admin'],
  },
  {
    key: 'manage',
    label: 'Task Management',
    description: 'Tao viec, gan nhan vien va dat uu tien.',
    icon: ClipboardCheck,
    roles: ['manager', 'departmentHead', 'admin'],
  },
  {
    key: 'approvals',
    label: 'Phê duyệt',
    description: 'Yêu cầu đang chờ xử lý.',
    icon: CheckCircle2,
    roles: ['manager', 'departmentHead', 'admin'],
  },
  {
    key: 'notifications',
    label: 'Notifications',
    description: 'Thong bao giao viec, tag ten va doi trang thai.',
    icon: Bell,
    roles: ['employee', 'manager', 'departmentHead', 'admin'],
  },
  {
    key: 'discussions',
    label: 'Discussions',
    description: 'Comment, @mention va hoi dap theo task.',
    icon: MessageSquareText,
    roles: ['employee', 'manager', 'departmentHead', 'admin'],
  },
  {
    key: 'files',
    label: 'Files',
    description: 'Tài liệu task va san pham ban giao.',
    icon: Paperclip,
    roles: ['employee', 'manager', 'departmentHead', 'admin'],
  },
  {
    key: 'activity',
    label: 'Activity Log',
    description: 'Đóng thoi gian hanh dong tren task/project.',
    icon: History,
    roles: ['employee', 'manager', 'departmentHead', 'admin'],
  },
  {
    key: 'settings',
    label: 'Profile Settings',
    description: 'Ho so, mat khau, 2FA va ngon ngu.',
    icon: Settings,
    roles: ['employee', 'manager', 'departmentHead', 'admin'],
  },
  {
    key: 'analytics',
    label: 'Analytics',
    description: 'Báo cáo năng suất và tiến độ dự án.',
    icon: BarChart3,
    roles: ['manager', 'departmentHead', 'admin'],
  },
  {
    key: 'timeline',
    label: 'Timeline',
    description: 'Gantt/Burndown shell cho Phase 3.',
    icon: CalendarDays,
    roles: ['manager', 'departmentHead', 'admin'],
  },
  {
    key: 'ai',
    label: 'AI Suggestions',
    description: 'Gợi ý phân công theo tải công việc.',
    icon: Bot,
    roles: ['manager', 'departmentHead', 'admin'],
  },
  {
    key: 'automation',
    label: 'Automation',
    description: 'Quy tac tu dong hoa workflow.',
    icon: Workflow,
    roles: ['manager', 'admin'],
  },
  {
    key: 'integrations',
    label: 'Integrations',
    description: 'Slack, Teams, Calendar placeholders.',
    icon: PlugZap,
    roles: ['manager', 'departmentHead', 'admin'],
  },
  {
    key: 'mobile',
    label: 'I18n & Mobile',
    description: 'Ngon ngu va responsive readiness.',
    icon: Smartphone,
    roles: ['employee', 'manager', 'departmentHead', 'admin'],
  },
  {
    key: 'admin',
    label: 'Identity & Access',
    description: 'Quản lý tài khoản, role và các placeholder admin.',
    icon: ShieldCheck,
    roles: ['admin'],
  },
];

const routeToView: Record<string, WorkView> = {
  '/work': 'dashboard',
  '/work/my-tasks': 'my-tasks',
  '/work/projects': 'projects',
  '/work/board': 'board',
  '/work/manage': 'manage',
  '/work/approvals': 'approvals',
  '/work/notifications': 'notifications',
  '/work/discussions': 'discussions',
  '/work/files': 'files',
  '/work/activity': 'activity',
  '/work/settings': 'settings',
  '/work/analytics': 'analytics',
  '/work/timeline': 'timeline',
  '/work/ai': 'ai',
  '/work/automation': 'automation',
  '/work/integrations': 'integrations',
  '/work/mobile': 'mobile',
  '/work/admin': 'admin',
};

const viewToRoute: Record<WorkView, string> = {
  dashboard: '/work',
  'my-tasks': '/work/my-tasks',
  projects: '/work/projects',
  board: '/work/board',
  manage: '/work/manage',
  approvals: '/work/approvals',
  notifications: '/work/notifications',
  discussions: '/work/discussions',
  files: '/work/files',
  activity: '/work/activity',
  settings: '/work/settings',
  analytics: '/work/analytics',
  timeline: '/work/timeline',
  ai: '/work/ai',
  automation: '/work/automation',
  integrations: '/work/integrations',
  mobile: '/work/mobile',
  admin: '/work/admin',
};

const statusLabels: Record<BoardStatus, string> = {
  OPEN: 'Todo',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  COMPLETED: 'Done',
  CANCELLED: 'Cancelled',
};

const statusTone: Record<BoardStatus, string> = {
  OPEN: 'border-slate-200 bg-slate-50 text-slate-700',
  IN_PROGRESS: 'border-blue-200 bg-blue-50 text-blue-700',
  REVIEW: 'border-amber-200 bg-amber-50 text-amber-700',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CANCELLED: 'border-slate-200 bg-white text-slate-500',
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: 'Thap',
  MEDIUM: 'Trung binh',
  HIGH: 'Cao',
  URGENT: 'Khan cap',
};

const priorityTone: Record<TaskPriority, 'muted' | 'info' | 'warning' | 'danger'> = {
  LOW: 'muted',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
};

const boardColumns: BoardStatus[] = ['OPEN', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'];

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa có');

const getProgress = (project: ProjectSummary) => {
  if (project.taskCount === 0) return 0;
  return Math.round((project.completedTaskCount / project.taskCount) * 100);
};

const isWorkRole = (role: WorkspaceRole) => role !== 'user' && role !== 'payroll' && role !== 'hr';

const getTaskProjectName = (projects: ProjectSummary[], task: Task) =>
  projects.find((project) => project.id === task.projectId)?.name ?? `Project #${task.projectId}`;

export const WorkManagementPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { can } = usePermissions();
  const workspaceRole = resolveWorkspaceRole(user?.roles);
  const currentView = routeToView[location.pathname] ?? 'dashboard';
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'all'>('all');
  const [taskFilter, setTaskFilter] = useState<'all' | 'today' | 'week' | 'overdue'>('all');
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState<TaskRequest>({
    title: '',
    description: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    assigneeId: 1,
    projectId: 1,
  });

  const allowedNav = useMemo(
    () => workNavItems.filter((item) => item.roles.includes(workspaceRole)),
    [workspaceRole]
  );

  const canCreateTask = can(PERMISSIONS.TASK_CREATE);
  const canUpdateTask = can(PERMISSIONS.TASK_UPDATE);

  const loadWorkData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [projectList, taskList] = await Promise.all([projectApi.getAll(), taskApi.getAll()]);
      const projectRows = await Promise.all(
        projectList.map(async (project) => {
          const assignments = await projectApi.getAssignments(project.id);
          const projectTasks = taskList.filter((task) => task.projectId === project.id);

          return {
            ...project,
            memberCount: assignments.filter((assignment) => assignment.active).length,
            taskCount: projectTasks.length,
            completedTaskCount: projectTasks.filter((task) => task.status === 'COMPLETED').length,
            highPriorityTaskCount: projectTasks.filter((task) => task.priority === 'HIGH' || task.priority === 'URGENT').length,
          };
        })
      );

      setProjects(projectRows);
      setTasks(taskList);
      setForm((current) => ({
        ...current,
        projectId: projectRows[0]?.id ?? current.projectId,
      }));
    } catch {
      setError('Không thể tải dữ liệu công việc. Vui lòng kiểm tra gateway, project-service và task-service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkData();
  }, []);

  useEffect(() => {
    if (!allowedNav.some((item) => item.key === currentView)) {
      navigate('/work', { replace: true });
    }
  }, [allowedNav, currentView, navigate]);

  const visibleTasks = useMemo(() => {
    const byProject =
      selectedProjectId === 'all' ? tasks : tasks.filter((task) => task.projectId === selectedProjectId);

    if (taskFilter === 'all') return byProject;

    return byProject.filter((task) => {
      const createdAt = new Date(task.createdAt).getTime();
      const now = Date.now();
      const days = Math.floor((now - createdAt) / 86_400_000);

      if (taskFilter === 'today') return days <= 1;
      if (taskFilter === 'week') return days <= 7;
      return task.status !== 'COMPLETED' && days > 7;
    });
  }, [selectedProjectId, taskFilter, tasks]);

  const stats = useMemo(() => {
    const open = tasks.filter((task) => task.status === 'OPEN').length;
    const doing = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
    const done = tasks.filter((task) => task.status === 'COMPLETED').length;
    const urgent = tasks.filter((task) => task.priority === 'URGENT' || task.priority === 'HIGH').length;

    return [
      { label: 'Viec can nhan', value: open, hint: 'Task dang o Todo', icon: ListChecks, tone: 'bg-slate-100 text-slate-700' },
      { label: 'Dang lam', value: doing, hint: 'Task dang xu ly', icon: Briefcase, tone: 'bg-blue-50 text-blue-700' },
      { label: 'Hoan thanh', value: done, hint: 'Task da dong', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700' },
      { label: 'Uu tien cao', value: urgent, hint: 'Can xu ly som', icon: ClipboardCheck, tone: 'bg-amber-50 text-amber-700' },
    ];
  }, [tasks]);

  const updateTaskStatus = async (task: Task, nextStatus: BoardStatus) => {
    if (nextStatus === 'REVIEW') {
      setNotice('Review la placeholder Phase 1 vi backend chua co trang thai REVIEW/approval endpoint.');
      return;
    }

    if (!canUpdateTask) {
      setNotice('Tài khoản hiện tại chỉ được xem board, chưa có quyền cập nhật trạng thái.');
      return;
    }

    const previous = tasks;
    setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item)));

    try {
      await taskApi.update(task.id, {
        title: task.title,
        description: task.description,
        status: nextStatus,
        priority: task.priority,
        assigneeId: task.assigneeId,
        projectId: task.projectId,
      });
    } catch {
      setTasks(previous);
      setNotice('Không thể cập nhật trạng thái task. Vui lòng thử lại.');
    }
  };

  const handleDrop = (status: BoardStatus) => {
    const task = tasks.find((item) => item.id === draggedTaskId);
    setDraggedTaskId(null);
    if (!task || task.status === status) return;
    void updateTaskStatus(task, status);
  };

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canCreateTask) {
      setNotice('Tài khoản hiện tại chưa có quyền tạo task.');
      return;
    }

    if (!form.title.trim()) {
      setNotice('Vui lòng nhập tên task.');
      return;
    }

    try {
      await taskApi.create({
        ...form,
        title: form.title.trim(),
        description: form.description?.trim() || null,
      });
      setForm((current) => ({ ...current, title: '', description: '' }));
      setNotice('Da tao task moi.');
      await loadWorkData();
    } catch {
      setNotice('Không thể tạo task. Kiểm tra project, assignee và quyền truy cập.');
    }
  };

  if (!isWorkRole(workspaceRole)) {
    return (
      <WorkShell title="Không gian làm việc chưa được cấp" subtitle="Tài khoản cần được duyệt sang EMPLOYEE, MANAGER, DEPARTMENT_HEAD hoặc ADMIN để sử dụng module công việc.">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <LockKeyhole size={24} />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">Đang ở trạng thái giới hạn</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Role hiện tại không nằm trong phạm vi dashboard Member, Manager hoặc Admin. Đây là hành vi đúng cho tài khoản chưa được phê duyệt hoặc role không thuộc module công việc.
              </p>
              <Link to="/" className="mt-4 inline-flex">
                <Button type="button" variant="outline">Ve dashboard tai khoan</Button>
              </Link>
            </div>
          </div>
        </Card>
      </WorkShell>
    );
  }

  return (
    <WorkShell
      title={workspaceRole === 'admin' ? 'Admin / Owner Dashboard' : workspaceRole === 'manager' || workspaceRole === 'departmentHead' ? 'Manager Dashboard' : 'Member Dashboard'}
      subtitle="Phase 3: Mở rộng phân tích dữ liệu, dòng thời gian, gợi ý AI, tự động hóa, tích hợp, i18n và trải nghiệm mobile. Các backend contract chưa có được ghi rõ."
      navItems={allowedNav}
      currentView={currentView}
      onNavigate={(view) => navigate(viewToRoute[view])}
    >
      {notice && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-center justify-between gap-4">
            <span>{notice}</span>
            <button type="button" className="font-semibold" onClick={() => setNotice(null)}>
              Đóng
            </button>
          </div>
        </div>
      )}

      {error && (
        <Card className="border-rose-200 bg-rose-50 p-5 text-rose-800">
          <p className="font-semibold">Không tải được dữ liệu</p>
          <p className="mt-1 text-sm">{error}</p>
          <Button type="button" variant="outline" className="mt-4 bg-white" onClick={() => void loadWorkData()}>
            Tải lại
          </Button>
        </Card>
      )}

      {loading ? (
        <LoadingGrid />
      ) : (
        <>
          {currentView === 'dashboard' && (
            <DashboardView role={workspaceRole} stats={stats} projects={projects} tasks={tasks} />
          )}
          {currentView === 'my-tasks' && (
            <MyTasksView
              tasks={visibleTasks}
              projects={projects}
              taskFilter={taskFilter}
              onFilterChange={setTaskFilter}
            />
          )}
          {currentView === 'projects' && <ProjectsView projects={projects} />}
          {currentView === 'board' && (
            <BoardView
              projects={projects}
              tasks={visibleTasks}
              selectedProjectId={selectedProjectId}
              onProjectChange={setSelectedProjectId}
              draggedTaskId={draggedTaskId}
              onDragStart={setDraggedTaskId}
              onDrop={handleDrop}
            />
          )}
          {currentView === 'manage' && (
            <TaskManagementView
              form={form}
              projects={projects}
              canCreateTask={canCreateTask}
              onChange={setForm}
              onSubmit={handleCreateTask}
            />
          )}
          {currentView === 'approvals' && <ApprovalsView tasks={tasks} projects={projects} onNotice={setNotice} />}
          {currentView === 'notifications' && (
            <NotificationsView tasks={tasks} projects={projects} onNotice={setNotice} />
          )}
          {currentView === 'discussions' && (
            <DiscussionsView tasks={tasks} projects={projects} userName={user?.fullName || user?.username || 'you'} onNotice={setNotice} />
          )}
          {currentView === 'files' && <FilesView tasks={tasks} projects={projects} onNotice={setNotice} />}
          {currentView === 'activity' && <ActivityLogView tasks={tasks} projects={projects} />}
          {currentView === 'settings' && <ProfileSettingsHub userName={user?.fullName || user?.username || 'Nguoi dung'} />}
          {currentView === 'analytics' && <AnalyticsView projects={projects} tasks={tasks} />}
          {currentView === 'timeline' && <TimelineView projects={projects} tasks={tasks} />}
          {currentView === 'ai' && <AISuggestionsView projects={projects} tasks={tasks} onNotice={setNotice} />}
          {currentView === 'automation' && <AutomationView onNotice={setNotice} />}
          {currentView === 'integrations' && <IntegrationsView onNotice={setNotice} />}
          {currentView === 'mobile' && <I18nMobileView />}
          {currentView === 'admin' && <AdminShellView />}
        </>
      )}
    </WorkShell>
  );
};

interface WorkShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  navItems?: WorkNavItem[];
  currentView?: WorkView;
  onNavigate?: (view: WorkView) => void;
}

const WorkShell = ({ title, subtitle, children, navItems = [], currentView, onNavigate }: WorkShellProps) => (
  <div className="space-y-6">
    <div className="surface-panel overflow-hidden rounded-xl">
      <div className="bg-gradient-to-r from-white via-blue-50/60 to-sky-50/50 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-700">Work Management MVP</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-[-0.02em] text-slate-950 text-balance">{title}</h1>
          <p className="mt-2 max-w-[72ch] text-sm leading-6 text-slate-700 text-pretty">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/"
            aria-label="Thoát Work Management về menu chính"
            className="interactive-lift inline-flex h-8 items-center gap-2 rounded-md border border-blue-200 bg-white px-3 text-xs font-bold text-blue-900 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <ArrowLeft size={14} />
            Về menu chính
          </Link>
          <Badge variant="info" className="bg-blue-100 text-blue-950">Phase 3</Badge>
          <Badge variant="muted" className="bg-slate-200 text-slate-900">Kanban</Badge>
          <Badge variant="muted" className="bg-slate-200 text-slate-900">Advanced</Badge>
        </div>
      </div>

      {navItems.length > 0 && (
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => {
            const active = item.key === currentView;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate?.(item.key)}
                className={cn(
                  'interactive-lift flex min-w-[180px] items-center gap-3 rounded-xl border px-3 py-3 text-left',
                  active
                    ? 'border-blue-200 bg-white text-blue-800 shadow-[inset_0_-3px_0_#2563eb,0_8px_18px_rgba(37,99,235,0.08)]'
                    : 'border-slate-200 bg-white/85 text-slate-700 hover:border-blue-200 hover:bg-white hover:text-slate-950'
                )}
              >
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', active ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600')}>
                  <item.icon size={18} />
                </span>
                <span>
                  <span className="block font-display text-sm font-semibold">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-600">{item.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
      </div>
    </div>

    {children}
  </div>
);

const LoadingGrid = () => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200/70" />
    ))}
  </div>
);

interface DashboardViewProps {
  role: WorkspaceRole;
  stats: Array<{ label: string; value: number; hint: string; icon: typeof ListChecks; tone: string }>;
  projects: ProjectSummary[];
  tasks: Task[];
}

const DashboardView = ({ role, stats, projects, tasks }: DashboardViewProps) => {
  const riskyProjects = projects.filter((project) => project.highPriorityTaskCount > 0 || project.status === 'PAUSED');
  const urgentTasks = tasks.filter((task) => task.priority === 'HIGH' || task.priority === 'URGENT').slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="interactive-lift p-5 hover:border-blue-200 hover:shadow-[0_10px_22px_rgba(37,99,235,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                <p className="mt-1 font-display text-3xl font-bold tabular-nums text-slate-950">{stat.value}</p>
                <p className="mt-2 text-sm leading-5 text-slate-600">{stat.hint}</p>
              </div>
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', stat.tone)}>
                <stat.icon size={22} />
              </div>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>{role === 'employee' ? 'Hom nay can lam gi' : 'Suc khoe du an'}</CardTitle>
            <CardDescription>
              {role === 'employee'
                ? 'Danh sach uu tien ca nhan tu cac du an dang tham gia.'
                : 'Theo doi du an dang chay, task uu tien cao va diem co rui ro.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(role === 'employee' ? urgentTasks : riskyProjects).length === 0 ? (
              <EmptyState title="Chưa có việc cần cảnh báo" description="Khi có task ưu tiên cao hoặc dự án rủi ro, khu vực này sẽ hiển thị trước." />
            ) : role === 'employee' ? (
              urgentTasks.map((task) => <TaskRow key={task.id} task={task} projectName={getTaskProjectName(projects, task)} />)
            ) : (
              riskyProjects.map((project) => <ProjectRow key={project.id} project={project} />)
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Phase tiep theo</CardTitle>
            <CardDescription>Chi tao placeholder, khong trien khai that trong MVP.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: MessageSquareText, label: 'Notification va discussion real-time' },
              { icon: FileText, label: 'File storage va tai lieu task' },
              { icon: BarChart3, label: 'Analytics, Gantt va burndown' },
              { icon: CalendarDays, label: 'I18n va mobile support' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                <item.icon size={18} className="text-slate-500" />
                <span>{item.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

interface MyTasksViewProps {
  tasks: Task[];
  projects: ProjectSummary[];
  taskFilter: 'all' | 'today' | 'week' | 'overdue';
  onFilterChange: (value: 'all' | 'today' | 'week' | 'overdue') => void;
}

const MyTasksView = ({ tasks, projects, taskFilter, onFilterChange }: MyTasksViewProps) => (
  <Card>
    <CardHeader>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>My Tasks</CardTitle>
          <CardDescription>Gom task từ mọi project về một nơi. Due date đang là placeholder vì backend chưa có trường này.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ['all', 'Tat ca'],
            ['today', 'Hom nay'],
            ['week', 'Tuan nay'],
            ['overdue', 'Qua han'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onFilterChange(value as 'all' | 'today' | 'week' | 'overdue')}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
                taskFilter === value ? 'bg-cyan-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      {tasks.length === 0 ? (
        <EmptyState title="Chưa có task phù hợp" description="Thử đổi filter hoặc kiểm tra phân công task trong project." />
      ) : (
        tasks.map((task) => <TaskRow key={task.id} task={task} projectName={getTaskProjectName(projects, task)} />)
      )}
    </CardContent>
  </Card>
);

const ProjectsView = ({ projects }: { projects: ProjectSummary[] }) => (
  <section className="grid gap-4 lg:grid-cols-2">
    {projects.map((project) => <ProjectRow key={project.id} project={project} expanded />)}
    {projects.length === 0 && (
      <Card className="p-6">
        <EmptyState title="Chưa có dự án" description="Project sẽ xuất hiện khi backend trả về danh sách dự án được phép xem." />
      </Card>
    )}
  </section>
);

interface BoardViewProps {
  projects: ProjectSummary[];
  tasks: Task[];
  selectedProjectId: number | 'all';
  draggedTaskId: number | null;
  onProjectChange: (value: number | 'all') => void;
  onDragStart: (id: number) => void;
  onDrop: (status: BoardStatus) => void;
}

const BoardView = ({ projects, tasks, selectedProjectId, draggedTaskId, onProjectChange, onDragStart, onDrop }: BoardViewProps) => (
  <div className="space-y-4">
    <Card className="p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_260px] lg:items-end">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-950">Project Board Kanban</h2>
          <p className="mt-1 text-sm text-slate-600">Keo task giua Todo, In Progress va Done. Review la placeholder Phase 1.</p>
        </div>
        <div>
          <label htmlFor="project-board-filter" className="mb-1 block text-sm font-semibold text-slate-700">
            Project
          </label>
          <select
            id="project-board-filter"
            value={selectedProjectId}
            onChange={(event) => onProjectChange(event.target.value === 'all' ? 'all' : Number(event.target.value))}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">Tat ca project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>

    <div className="grid gap-4 xl:grid-cols-4">
      {boardColumns.map((status) => {
        const columnTasks = status === 'REVIEW' ? [] : tasks.filter((task) => task.status === status);
        return (
          <section
            key={status}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => onDrop(status)}
            className={cn(
              'min-h-[420px] rounded-2xl border p-3',
              statusTone[status],
              draggedTaskId !== null && 'ring-2 ring-cyan-300/60'
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display font-bold">{statusLabels[status]}</h3>
              <span className="font-display rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold tabular-nums">{columnTasks.length}</span>
            </div>
            <div className="space-y-3">
              {status === 'REVIEW' && (
                <div className="rounded-xl border border-dashed border-amber-300 bg-white/70 p-4 text-sm text-amber-800">
                  Review/Approval can backend status va endpoint rieng trong Phase 2.
                </div>
              )}
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projectName={getTaskProjectName(projects, task)}
                  onDragStart={onDragStart}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  </div>
);

interface TaskManagementViewProps {
  form: TaskRequest;
  projects: ProjectSummary[];
  canCreateTask: boolean;
  onChange: (value: TaskRequest) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const TaskManagementView = ({ form, projects, canCreateTask, onChange, onSubmit }: TaskManagementViewProps) => (
  <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
    <Card>
      <CardHeader>
        <CardTitle>Tao task moi</CardTitle>
        <CardDescription>Phase 1 gồm giao việc, mô tả, assignee, project và ưu tiên. Due date chưa có API nên được ghi rõ là placeholder.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Ten task"
            value={form.title}
            onChange={(event) => onChange({ ...form, title: event.target.value })}
            placeholder="Vi du: Hoan thien UI Kanban"
          />
          <div>
            <label htmlFor="task-description" className="mb-1 block text-sm font-semibold text-slate-700">
              Mo ta
            </label>
            <textarea
              id="task-description"
              value={form.description ?? ''}
              onChange={(event) => onChange({ ...form, description: event.target.value })}
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Mô tả chi tiết công việc cần làm"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="task-project" className="mb-1 block text-sm font-semibold text-slate-700">
                Project
              </label>
              <select
                id="task-project"
                value={form.projectId}
                onChange={(event) => onChange({ ...form, projectId: Number(event.target.value) })}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Assignee ID"
              type="number"
              min={1}
              value={form.assigneeId}
              onChange={(event) => onChange({ ...form, assigneeId: Number(event.target.value) })}
            />
            <div>
              <label htmlFor="task-priority" className="mb-1 block text-sm font-semibold text-slate-700">
                Priority
              </label>
              <select
                id="task-priority"
                value={form.priority ?? 'MEDIUM'}
                onChange={(event) => onChange({ ...form, priority: event.target.value as TaskPriority })}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Input label="Due date" value="[API endpoint: task due date]" disabled />
          </div>
          <Button type="submit" disabled={!canCreateTask || projects.length === 0}>
            <Plus size={16} />
            Tao task
          </Button>
        </form>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Task Management scope</CardTitle>
        <CardDescription>Nhung phan co tinh phuc tap duoc day sang phase tiep theo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {['Bulk Create', 'Checklist', 'Review workflow', 'Time tracking'].map((item) => (
          <div key={item} className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {item}: placeholder Phase 2
          </div>
        ))}
      </CardContent>
    </Card>
  </section>
);

interface ApprovalRequest {
  id: string;
  personName: string;
  position: string;
  department: string;
  requester: string;
  submittedAt: string;
  status: 'Chờ duyệt';
}

const initialApprovalRequests: ApprovalRequest[] = [
  {
    id: 'APR-2026-014',
    personName: 'Nguyễn Minh Anh',
    position: 'Chuyên viên tuyển dụng',
    department: 'Nhân sự',
    requester: 'Trần Hoài Nam',
    submittedAt: '2026-06-24',
    status: 'Chờ duyệt',
  },
  {
    id: 'APR-2026-015',
    personName: 'Lê Quốc Bảo',
    position: 'Backend Developer',
    department: 'Công nghệ',
    requester: 'Phạm Thu Hà',
    submittedAt: '2026-06-25',
    status: 'Chờ duyệt',
  },
  {
    id: 'APR-2026-016',
    personName: 'Võ Khánh Linh',
    position: 'Kế toán tiền lương',
    department: 'Tài chính',
    requester: 'Đỗ Minh Quân',
    submittedAt: '2026-06-25',
    status: 'Chờ duyệt',
  },
  {
    id: 'APR-2026-017',
    personName: 'Hoàng Gia Huy',
    position: 'Project Coordinator',
    department: 'Vận hành',
    requester: 'Nguyễn Thanh Tâm',
    submittedAt: '2026-06-26',
    status: 'Chờ duyệt',
  },
];

const ApprovalsView = ({ onNotice }: { tasks: Task[]; projects: ProjectSummary[]; onNotice: (value: string) => void }) => {
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(initialApprovalRequests);

  const handleApprovalAction = (request: ApprovalRequest, action: 'approved' | 'rejected') => {
    setApprovalRequests((current) => current.filter((item) => item.id !== request.id));
    onNotice(
      action === 'approved'
        ? `Đã phê duyệt yêu cầu ${request.id} cho ${request.personName}.`
        : `Đã từ chối yêu cầu ${request.id} cho ${request.personName}.`
    );
  };

  return (
    <section className="space-y-4">
      <div className="max-w-[72ch]">
        <h2 className="font-display text-xl font-bold tracking-[-0.01em] text-slate-950">Phê duyệt yêu cầu</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700 text-pretty">
          Hệ thống đang chuẩn bị kết nối các API endpoints submit/review. Phiên bản MVP hiện tại hiển thị danh sách các yêu cầu cần phê duyệt.
        </p>
      </div>

      <div className="space-y-3">
        {approvalRequests.length === 0 ? (
          <EmptyState title="Đã xử lý hết yêu cầu" description="Danh sách sẽ được nạp lại từ endpoint approval riêng khi backend hoàn tất workflow submit/review." />
        ) : (
          approvalRequests.map((request) => (
            <article key={request.id} className="interactive-lift flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-200 hover:shadow-[0_10px_20px_rgba(15,23,42,0.06)] lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800">{request.id}</span>
                      <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-950">{request.status}</span>
                    </div>
                    <h3 className="mt-2 font-display text-lg font-bold tracking-[-0.01em] text-slate-950">{request.personName}</h3>
                    <p className="mt-1 text-sm text-slate-600">{request.position}</p>
                  </div>
                  <div className="text-sm text-slate-700 sm:text-right">
                    <p className="font-semibold text-slate-800">{request.department}</p>
                    <p className="mt-1">Gửi bởi {request.requester}</p>
                  </div>
                </div>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <dt className="text-xs font-semibold text-slate-700">Mã yêu cầu</dt>
                    <dd className="mt-1 font-semibold text-slate-800">{request.id}</dd>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <dt className="text-xs font-semibold text-slate-700">Phòng ban</dt>
                    <dd className="mt-1 font-semibold text-slate-800">{request.department}</dd>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <dt className="text-xs font-semibold text-slate-700">Ngày gửi</dt>
                    <dd className="mt-1 font-semibold text-slate-800">{formatDate(request.submittedAt)}</dd>
                  </div>
                </dl>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  className="font-display"
                  onClick={() => handleApprovalAction(request, 'rejected')}
                >
                  <XCircle size={16} />
                  Từ chối
                </Button>
                <Button type="button" size="sm" variant="success" className="font-display" onClick={() => handleApprovalAction(request, 'approved')}>
                  <CheckCircle2 size={16} />
                  Phê duyệt
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
};

const NotificationsView = ({ tasks, projects, onNotice }: { tasks: Task[]; projects: ProjectSummary[]; onNotice: (value: string) => void }) => {
  const notifications = [
    ...tasks
      .filter((task) => task.priority === 'HIGH' || task.priority === 'URGENT')
      .slice(0, 6)
      .map((task) => ({
        id: `task-${task.id}`,
        title: `Task uu tien cao: ${task.title}`,
        description: `${getTaskProjectName(projects, task)} dang can theo doi.`,
        tone: 'warning' as const,
        icon: Bell,
        time: formatDate(task.updatedAt || task.createdAt),
      })),
    ...tasks
      .filter((task) => task.status === 'COMPLETED')
      .slice(0, 4)
      .map((task) => ({
        id: `done-${task.id}`,
        title: `Task da hoàn thành: ${task.title}`,
        description: `${getTaskProjectName(projects, task)} co thay doi trang thai.`,
        tone: 'success' as const,
        icon: CheckCircle2,
        time: formatDate(task.updatedAt || task.createdAt),
      })),
  ];

  const endpointContracts = [
    '[API endpoint: list notifications]',
    '[API endpoint: mark notification as read]',
    '[Realtime channel: task.assigned]',
    '[Realtime channel: task.mentioned]',
  ];

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <div className="max-w-[72ch]">
          <h2 className="font-display text-xl font-bold tracking-[-0.01em] text-slate-950">Notification Center</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700 text-pretty">
            Phase 2 shell cho thông báo giao viec, @mention va cap nhat trang thai. Realtime can websocket/SSE backend.
          </p>
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <EmptyState title="Chưa có thông báo" description="Thông báo sẽ được tạo từ task ưu tiên cao, task hoàn thành và mention khi backend có event stream." />
          ) : (
            notifications.map((item) => (
              <article key={item.id} className="interactive-lift flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-200 hover:shadow-[0_10px_20px_rgba(15,23,42,0.06)]">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                    item.tone === 'success'
                      ? 'border-emerald-200 bg-emerald-100 text-emerald-900'
                      : 'border-amber-200 bg-amber-100 text-amber-950'
                  )}
                >
                  <item.icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display font-bold text-slate-950">{item.title}</p>
                    <Badge variant={item.tone} className={item.tone === 'success' ? 'text-emerald-900' : 'text-amber-950'}>
                      {item.tone === 'success' ? 'Done' : 'Can chu y'}
                    </Badge>
                  </div>
                  <p className="mt-1 max-w-[68ch] text-sm leading-6 text-slate-700">{item.description}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-600">{item.time}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <aside className="space-y-3">
        <div className="max-w-[60ch]">
          <h2 className="font-display text-lg font-bold text-slate-950">Realtime contract</h2>
          <p className="mt-1 text-sm leading-6 text-slate-700">Cac endpoint/event can bo sung sau frontend shell.</p>
        </div>
        <div className="space-y-2">
          {endpointContracts.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onNotice(`${item} chua co backend trong Phase 2 shell.`)}
              className="interactive-lift w-full rounded-xl border border-blue-900/20 bg-blue-950 px-4 py-3 text-left font-mono text-xs font-semibold leading-5 text-white shadow-sm hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {item}
            </button>
          ))}
        </div>
      </aside>
    </section>
  );
};

const DiscussionsView = ({
  tasks,
  projects,
  userName,
  onNotice,
}: {
  tasks: Task[];
  projects: ProjectSummary[];
  userName: string;
  onNotice: (value: string) => void;
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(tasks[0]?.id ?? null);
  const [draft, setDraft] = useState('');
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0];
  const projectName = selectedTask ? getTaskProjectName(projects, selectedTask) : 'Chua chon task';
  const sampleComments = selectedTask
    ? [
        {
          id: 'c1',
          author: 'manager',
          body: `@${userName} cap nhat tien do cho task nay truoc cuoi ngay.`,
          time: formatDate(selectedTask.updatedAt || selectedTask.createdAt),
        },
        {
          id: 'c2',
          author: userName,
          body: 'Da nhan. Toi se cap nhat checklist va file ban giao khi backend ho tro.',
          time: 'Draft local',
        },
      ]
    : [];

  const submitComment = () => {
    if (!draft.trim()) {
      onNotice('Nhap noi dung comment truoc khi gui.');
      return;
    }

    setDraft('');
    onNotice('[API endpoint: create task comment] chua co backend, comment hien la draft local.');
  };

  return (
    <section className="grid gap-4 xl:grid-cols-[330px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Discussion threads</CardTitle>
          <CardDescription>Chon task de xem luong trao doi va @mention.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {tasks.slice(0, 12).map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => setSelectedTaskId(task.id)}
              className={cn(
                'w-full rounded-xl border px-3 py-3 text-left transition-colors',
                selectedTask?.id === task.id ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-white hover:bg-slate-50'
              )}
            >
              <span className="block truncate text-sm font-bold text-slate-950">{task.title}</span>
              <span className="mt-1 block text-xs text-slate-500">{getTaskProjectName(projects, task)}</span>
            </button>
          ))}
          {tasks.length === 0 && <EmptyState title="Chưa có task" description="Discussion cần task để gắn comment." />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedTask ? selectedTask.title : 'Discussion'}</CardTitle>
          <CardDescription>{projectName}. Comment va @mention dang la Phase 2 frontend shell.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="divide-y divide-slate-100">
            {sampleComments.map((comment) => (
              <div key={comment.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">{comment.author}</Badge>
                  <span className="text-xs text-slate-600">{comment.time}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{comment.body}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-4">
            <label htmlFor="discussion-draft" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <AtSign size={16} />
              Viet comment
            </label>
            <textarea
              id="discussion-draft"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="@dong-nghiep noi dung trao doi..."
            />
            <div className="mt-3 flex justify-end">
              <Button type="button" onClick={submitComment}>Gui comment</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

const FilesView = ({ tasks, projects, onNotice }: { tasks: Task[]; projects: ProjectSummary[]; onNotice: (value: string) => void }) => {
  const fileRows = tasks.slice(0, 8).map((task, index) => ({
    id: task.id,
    name: `${task.title.slice(0, 34)}${task.title.length > 34 ? '...' : ''}`,
    project: getTaskProjectName(projects, task),
    type: index % 2 === 0 ? 'Báo cáo kết quả' : 'Tài liệu task',
    status: task.status === 'COMPLETED' ? 'Sẵn sàng bàn giao' : 'Đang chờ upload',
  }));

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_0.65fr]">
      <Card>
        <CardHeader>
          <CardTitle>File handoff</CardTitle>
          <CardDescription>Quản lý tài liệu và file sản phẩm theo task. Upload/download cần storage backend riêng.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {fileRows.length === 0 ? (
            <EmptyState title="Chưa có file" description="Khi task có attachment, danh sách file sẽ hiển thị ở đây." />
          ) : (
            <div className="divide-y divide-slate-100">
              {fileRows.map((file) => (
                <div key={file.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-950">{file.name}</p>
                      <Badge variant={file.status === 'Sẵn sàng bàn giao' ? 'success' : 'muted'}>{file.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{file.project}</p>
                    <p className="mt-1 text-xs text-slate-600">{file.type}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => onNotice('[API endpoint: download attachment] chua co backend.')}>
                    Tai file
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload contract</CardTitle>
          <CardDescription>UI da san sang nhan storage endpoint trong Phase 2 backend.</CardDescription>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            onClick={() => onNotice('[API endpoint: upload attachment] chua co backend storage/S3.')}
            className="flex min-h-44 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-slate-800 transition hover:border-slate-400 hover:bg-white"
          >
            <Upload size={28} />
            <span className="mt-3 font-bold">Upload file</span>
            <span className="mt-1 text-sm">Placeholder cho S3/local storage adapter</span>
          </button>
        </CardContent>
      </Card>
    </section>
  );
};

const ActivityLogView = ({ tasks, projects }: { tasks: Task[]; projects: ProjectSummary[] }) => {
  const taskEvents = tasks.slice(0, 10).map((task) => ({
    id: `task-${task.id}`,
    title: `Cập nhật task ${task.title}`,
    description: `${getTaskProjectName(projects, task)} đang ở trạng thái ${statusLabels[task.status]}.`,
    time: formatDate(task.updatedAt || task.createdAt),
    icon: ListChecks,
  }));
  const projectEvents = projects.slice(0, 5).map((project) => ({
    id: `project-${project.id}`,
    title: `Dự án ${project.name}`,
    description: `${project.taskCount} task, ${project.memberCount} thành viên, ${getProgress(project)}% hoàn thành.`,
    time: formatDate(project.updatedAt || project.createdAt),
    icon: FolderKanban,
  }));
  const events = [...taskEvents, ...projectEvents];

  return (
    <section className="space-y-4">
      <div className="max-w-[72ch]">
        <h2 className="font-display text-xl font-bold tracking-[-0.01em] text-slate-950">Activity Log</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700 text-pretty">
          Đóng lịch sử đọc từ dữ liệu project/task hiện có. Audit đầy đủ cần endpoint riêng.
        </p>
      </div>

      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <History size={28} />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-slate-950">Chưa có hoạt động</h3>
            <p className="mt-2 max-w-[60ch] text-sm leading-6 text-slate-700">
              Activity log sẽ hiển thị khi có task/project trong hệ thống.
            </p>
          </div>
        ) : (
          events.map((event) => (
            <article key={event.id} className="interactive-lift flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-200 hover:shadow-[0_10px_20px_rgba(15,23,42,0.06)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-800">
                <event.icon size={19} />
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-slate-950">{event.title}</p>
                <p className="mt-1 max-w-[68ch] text-sm leading-6 text-slate-700">{event.description}</p>
                <p className="mt-2 text-xs font-semibold text-slate-600">{event.time}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
};

const ProfileSettingsHub = ({ userName }: { userName: string }) => {
  const settingsItems = [
    {
      title: 'Profile',
      description: `Cập nhật thông tin cá nhân của ${userName}.`,
      href: '/profile',
      icon: Users,
      badge: 'Ready',
    },
    {
      title: 'Password',
      description: 'Doi mat khau bang route bao mat hien co.',
      href: '/change-password',
      icon: LockKeyhole,
      badge: 'Ready',
    },
    {
      title: 'Two-factor authentication',
      description: '[API endpoint: enable 2FA] chưa có trong backend hiện tại.',
      href: undefined,
      icon: ShieldCheck,
      badge: 'Placeholder',
    },
    {
      title: 'Language',
      description: 'Tiếng Việt/Tieng Anh se ket noi khi co i18n dictionary trong Phase 3.',
      href: undefined,
      icon: Settings,
      badge: 'Phase 3',
    },
  ];

  return (
    <section className="space-y-4">
      <div className="max-w-[72ch]">
        <h2 className="font-display text-xl font-bold tracking-[-0.01em] text-slate-950">Profile Settings</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700 text-pretty">
          Quản lý hồ sơ, mật khẩu, xác thực hai lớp và ngôn ngữ từ một khu vực cài đặt gọn.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {settingsItems.map((item) => (
          <Card key={item.title} className="interactive-lift p-5 hover:border-blue-200 hover:shadow-[0_10px_20px_rgba(15,23,42,0.06)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-200 bg-blue-100 text-blue-900">
                <item.icon size={23} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-bold text-slate-950">{item.title}</h2>
                  <Badge
                    variant={item.badge === 'Ready' ? 'success' : 'muted'}
                    className={item.badge === 'Ready' ? 'bg-emerald-100 text-emerald-950' : 'bg-slate-200 text-slate-900'}
                  >
                    {item.badge}
                  </Badge>
                </div>
                <p className="mt-1 max-w-[62ch] text-sm leading-6 text-slate-700">{item.description}</p>
                {item.href && (
                  <Link to={item.href} className="mt-4 inline-flex">
                    <Button type="button" variant="primary" size="sm" className="font-display">Mở cài đặt</Button>
                  </Link>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

const AnalyticsView = ({ projects, tasks }: { projects: ProjectSummary[]; tasks: Task[] }) => {
  const completed = tasks.filter((task) => task.status === 'COMPLETED').length;
  const inProgress = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
  const urgent = tasks.filter((task) => task.priority === 'HIGH' || task.priority === 'URGENT').length;
  const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
  const projectHealth = projects.map((project) => ({
    ...project,
    progress: getProgress(project),
  }));

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Completion rate', value: `${completionRate}%`, hint: 'Task da hoàn thành tren tong task', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700' },
          { label: 'Đang xử lý', value: inProgress, hint: 'Task đang trong cột In Progress', icon: Briefcase, tone: 'bg-blue-50 text-blue-700' },
          { label: 'Rủi ro ưu tiên', value: urgent, hint: 'HIGH hoặc URGENT', icon: Bell, tone: 'bg-amber-50 text-amber-700' },
          { label: 'Dự án active', value: projects.filter((project) => project.status === 'ACTIVE').length, hint: 'Dự án dang van hanh', icon: FolderKanban, tone: 'bg-cyan-50 text-cyan-700' },
        ].map((item) => (
          <Card key={item.label} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-600">{item.label}</p>
                <p className="mt-1 font-display text-3xl font-bold tabular-nums text-slate-950">{item.value}</p>
                <p className="mt-2 text-sm text-slate-600">{item.hint}</p>
              </div>
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', item.tone)}>
                <item.icon size={22} />
              </div>
            </div>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Project analytics</CardTitle>
          <CardDescription>Phase 3 shell cho bao cao nang suat va du doan tien do. Hien tai tinh truc tiep tu project/task.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {projectHealth.length === 0 ? (
            <EmptyState title="Chưa có dữ liệu analytics" description="Cần project/task để hiển thị báo cáo." />
          ) : (
            <div className="divide-y divide-slate-100">
              {projectHealth.map((project) => (
                <div key={project.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-slate-950">{project.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{project.taskCount} task, {project.memberCount} thành viên</p>
                    </div>
                    <Badge variant={project.highPriorityTaskCount > 0 ? 'warning' : 'success'}>
                      {project.highPriorityTaskCount > 0 ? 'Co rui ro' : 'On dinh'}
                    </Badge>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full w-full origin-left rounded-full bg-cyan-600 transition-transform duration-300 ease-out"
                      style={{ transform: `scaleX(${project.progress / 100})` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-600">{project.progress}% hoàn thành, {project.highPriorityTaskCount} task uu tien cao</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const TimelineView = ({ projects, tasks }: { projects: ProjectSummary[]; tasks: Task[] }) => {
  const rows = projects.map((project, index) => {
    const projectTasks = tasks.filter((task) => task.projectId === project.id);
    const laneStart = Math.min(70, index * 9 + 4);
    const laneWidth = Math.max(16, Math.min(84 - laneStart, 20 + projectTasks.length * 6));

    return { project, projectTasks, laneStart, laneWidth };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline / Gantt</CardTitle>
        <CardDescription>Gantt that can startDate/dueDate/dependency backend. Shell nay dung project/task hien co de demo luong timeline.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2 border-b border-slate-100 pb-2 sm:grid-cols-8">
          {['Tuan 1', 'Tuan 2', 'Tuan 3', 'Tuan 4', 'Tuan 5', 'Tuan 6', 'Tuan 7', 'Tuan 8'].map((label) => (
            <span key={label} className="font-display text-xs font-semibold text-slate-600">{label}</span>
          ))}
        </div>
        {rows.length === 0 ? (
          <EmptyState title="Chưa có timeline" description="Cần project/task và due date để vẽ Gantt thật." />
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map(({ project, projectTasks, laneStart, laneWidth }) => (
              <div key={project.id} className="py-4 first:pt-0 last:pb-0">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-bold text-slate-950">{project.name}</p>
                  <p className="text-sm text-slate-600">{projectTasks.length} task, {getProgress(project)}% done</p>
                </div>
                <div className="relative h-9 rounded-lg bg-slate-100">
                  <div
                    className="absolute top-1 h-7 w-full origin-left rounded-md bg-cyan-600 transition-transform duration-300 ease-out"
                    style={{
                      left: `${laneStart}%`,
                      transform: `scaleX(${laneWidth / 100})`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">Backend contract dang cho bo sung</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {['task.startDate', 'task.dueDate', 'task.dependencies', 'project.milestones', 'burndown metrics API'].map((contract) => (
              <span key={contract} className="rounded-full border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-900">
                {contract}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AISuggestionsView = ({ projects, tasks, onNotice }: { projects: ProjectSummary[]; tasks: Task[]; onNotice: (value: string) => void }) => {
  const fallbackSuggestions = useMemo(
    () =>
      Object.entries(
        tasks.reduce<Record<string, number>>((acc, task) => {
          if (task.status !== 'COMPLETED') {
            acc[task.assigneeId] = (acc[task.assigneeId] || 0) + 1;
          }
          return acc;
        }, {})
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([assigneeId, count]): AiSuggestion => ({
          id: `local-${assigneeId}`,
          assigneeId,
          title: `Assignee #${assigneeId}`,
          reason: `${count} task chua hoàn thành. Nen giam task moi hoac tach viec uu tien cao.`,
          workload: count,
          confidence: Math.min(96, 62 + count * 7),
        })),
    [tasks]
  );
  const fallbackRisks = useMemo(
    () =>
      projects
        .filter((project) => project.highPriorityTaskCount > 0)
        .slice(0, 5)
        .map((project): AiRiskRadarItem => ({
          id: `local-project-${project.id}`,
          projectId: project.id,
          projectName: project.name,
          severity: project.highPriorityTaskCount > 2 ? 'danger' : 'warning',
          summary: `${project.highPriorityTaskCount} task uu tien cao, ${getProgress(project)}% done.`,
          highPriorityTaskCount: project.highPriorityTaskCount,
          progress: getProgress(project),
        })),
    [projects]
  );
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>(fallbackSuggestions);
  const [riskRadar, setRiskRadar] = useState<AiRiskRadarItem[]>(fallbackRisks);
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void Promise.all([aiApi.getSuggestions(), aiApi.getRiskRadar()])
      .then(([remoteSuggestions, remoteRisks]) => {
        if (!active) return;
        setSuggestions(remoteSuggestions);
        setRiskRadar(remoteRisks);
      })
      .catch(() => {
        if (!active) return;
        setSuggestions(fallbackSuggestions);
        setRiskRadar(fallbackRisks);
      })
      .finally(() => {
        if (active) setAiLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fallbackRisks, fallbackSuggestions]);

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <div className="max-w-[72ch]">
          <h2 className="font-display text-xl font-bold tracking-[-0.01em] text-slate-950">AI task assignment suggestions</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700 text-pretty">
            Gợi ý dựa trên workload hiện có, sẵn sàng nối skills, calendar và lịch sử hiệu suất qua `/api/v1/ai/suggestions`.
          </p>
        </div>

        <div className="space-y-3">
          {aiLoading ? (
            <LoadingGrid />
          ) : suggestions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <Bot className="mx-auto text-slate-500" size={30} />
              <h3 className="mt-3 font-display text-lg font-bold text-slate-950">Chưa có tín hiệu quá tải</h3>
              <p className="mx-auto mt-2 max-w-[60ch] text-sm leading-6 text-slate-700">
                Khi API hoặc workload phát hiện điểm nghẽn, danh sách gợi ý phân bổ lại sẽ xuất hiện ở đây.
              </p>
            </div>
          ) : (
            suggestions.map((item) => (
              <article key={item.id} className="interactive-lift rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-200 hover:shadow-[0_10px_20px_rgba(15,23,42,0.06)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display font-bold text-slate-950">{item.title}</h3>
                      <Badge variant="info" className="bg-blue-100 text-blue-950">{item.confidence}% confidence</Badge>
                    </div>
                    <p className="mt-1 max-w-[68ch] text-sm leading-6 text-slate-700">{item.reason}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-600">Workload: {item.workload} open task</p>
                  </div>
                  <Button type="button" variant="primary" size="sm" className="font-display" onClick={() => onNotice('GET /api/v1/ai/suggestions da duoc khai bao, backend rule AI chua tra du lieu production.')}>
                    Lấy gợi ý AI
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="max-w-[60ch]">
          <h2 className="font-display text-lg font-bold text-slate-950">Risk radar</h2>
          <p className="mt-1 text-sm leading-6 text-slate-700">Quét `/api/v1/ai/risk-radar` để ưu tiên dự án có HIGH/URGENT task.</p>
        </div>
        <div className="space-y-3">
          {aiLoading ? (
            <div className="h-28 animate-pulse rounded-xl bg-slate-200/70" />
          ) : riskRadar.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center">
              <ShieldCheck className="mx-auto text-slate-600" size={28} />
              <h3 className="mt-3 font-display font-bold text-slate-950">Chưa có rủi ro</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">Không có project nào đang có task HIGH/URGENT.</p>
            </div>
          ) : (
            riskRadar.map((project) => (
              <article
                key={project.id}
                className={cn(
                  'rounded-xl border p-4',
                  project.severity === 'danger'
                    ? 'border-rose-300 bg-rose-50 text-rose-950'
                    : 'border-amber-300 bg-amber-50 text-amber-950'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display font-bold">{project.projectName}</h3>
                  <Badge variant={project.severity === 'danger' ? 'danger' : 'warning'} className={project.severity === 'danger' ? 'bg-rose-100 text-rose-950' : 'bg-amber-100 text-amber-950'}>
                    {project.highPriorityTaskCount} high
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6">{project.summary}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
                  <div className="h-full w-full origin-left rounded-full bg-current transition-transform duration-300 ease-out" style={{ transform: `scaleX(${project.progress / 100})` }} />
                </div>
              </article>
            ))
          )}
        </div>
      </aside>
    </section>
  );
};

const AutomationView = ({ onNotice }: { onNotice: (value: string) => void }) => {
  const initialRules: AutomationRule[] = [
    {
      rule_id: 'auto-done-next-task',
      rule_name: 'Done moves next task',
      trigger: { event: 'task.status_changed', condition: 'COMPLETED' },
      action: { type: 'move_dependent_task', target_status: 'IN_PROGRESS' },
      is_enabled: false,
    },
    {
      rule_id: 'auto-high-priority-notification',
      rule_name: 'High priority notification',
      trigger: { event: 'task.priority_changed', condition: 'HIGH_OR_URGENT' },
      action: { type: 'notify_manager', channel: 'in_app' },
      is_enabled: false,
    },
    {
      rule_id: 'auto-review-reminder',
      rule_name: 'Review reminder',
      trigger: { event: 'task.review_waiting', condition: '24H' },
      action: { type: 'send_approval_reminder', channel: 'email' },
      is_enabled: false,
    },
  ];
  const [rules, setRules] = useState<AutomationRule[]>(initialRules);

  const toggleRule = async (rule: AutomationRule) => {
    const nextRule = { ...rule, is_enabled: !rule.is_enabled };
    setRules((current) => current.map((item) => (item.rule_id === rule.rule_id ? nextRule : item)));

    try {
      await automationApi.createRule(nextRule);
      onNotice(`POST /api/v1/automation/rules: ${nextRule.rule_name} ${nextRule.is_enabled ? 'enabled' : 'disabled'}.`);
    } catch {
      onNotice('POST /api/v1/automation/rules da duoc khai bao, backend rule engine chua san sang.');
    }
  };

  return (
    <section className="space-y-4">
      <div className="max-w-[72ch]">
        <h2 className="font-display text-xl font-bold tracking-[-0.01em] text-slate-950">Workflow Automation</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700 text-pretty">
          Rule builder kết nối contract `POST /api/v1/automation/rules`, sẵn sàng nối rule engine và event bus.
        </p>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <article key={rule.rule_id} className="interactive-lift rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-200 hover:shadow-[0_10px_20px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display font-bold text-slate-950">{rule.rule_name}</h3>
                  <Badge variant={rule.is_enabled ? 'success' : 'muted'} className={rule.is_enabled ? 'bg-emerald-100 text-emerald-950' : 'bg-slate-200 text-slate-900'}>
                    {rule.is_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <p className="mt-2 max-w-[68ch] text-sm leading-6 text-slate-700">
                  Trigger: <span className="font-semibold text-slate-950">{rule.trigger.event}</span> when <span className="font-semibold text-slate-950">{rule.trigger.condition}</span>
                </p>
                <p className="mt-1 max-w-[68ch] text-sm leading-6 text-slate-700">
                  Action: <span className="font-semibold text-slate-950">{rule.action.type}</span>{rule.action.target_status ? ` -> ${rule.action.target_status}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void toggleRule(rule)}
                className={cn(
                  'interactive-lift inline-flex h-8 min-w-28 items-center justify-between gap-2 rounded-full border px-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  rule.is_enabled
                    ? 'border-emerald-700 bg-emerald-600 text-white'
                    : 'border-slate-300 bg-white text-slate-900 hover:border-blue-300 hover:bg-blue-50'
                )}
                aria-pressed={rule.is_enabled}
              >
                <span className="px-2">{rule.is_enabled ? 'Enabled' : 'Enable rule'}</span>
                <span
                  className={cn(
                    'h-5 w-5 rounded-full bg-current opacity-90 transition-transform duration-200',
                    rule.is_enabled ? 'translate-x-0 text-white' : 'text-slate-400'
                  )}
                  aria-hidden="true"
                />
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-3 text-sm text-blue-950">
        <p className="font-display font-bold">Rule JSON schema</p>
        <p className="mt-1 max-w-[72ch] leading-6">
          rule_id, rule_name, trigger.event, trigger.condition, action.type, action.target_status, is_enabled.
        </p>
      </div>
    </section>
  );
};

const IntegrationsView = ({ onNotice }: { onNotice: (value: string) => void }) => (
  <section className="grid gap-4 lg:grid-cols-3">
    {[
      { name: 'Slack', description: 'Đóng bo thông báo task va @mention vao channel du an.' },
      { name: 'Microsoft Teams', description: 'Gui approval reminder va meeting note cho team.' },
      { name: 'Google Calendar', description: 'Đóng bo due date, milestone va lich review.' },
    ].map((integration) => (
      <Card key={integration.name} className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
            <PlugZap size={22} />
          </div>
          <h2 className="font-display text-lg font-bold text-slate-950">{integration.name}</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{integration.description}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => onNotice(`[Integration endpoint: ${integration.name}] chua duoc ket noi.`)}
        >
          Connect
        </Button>
      </Card>
    ))}
  </section>
);

const I18nMobileView = () => (
  <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
    <Card>
      <CardHeader>
        <CardTitle>Localization readiness</CardTitle>
        <CardDescription>Phase 3 chuan bi tieng Viet/Tieng Anh. Hien tai app van dung copy truc tiep trong component.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-slate-100">
          {[
            { key: 'vi', label: 'Tiếng Việt', status: 'Đang dùng trong UI hien tai' },
            { key: 'en', label: 'English', status: 'Cần dictionary và key mapping' },
            { key: 'format', label: 'Date/number format', status: 'Cần locale-aware formatter' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Languages size={18} />
                </div>
                <div>
                  <p className="font-bold text-slate-950">{item.label}</p>
                  <p className="text-sm text-slate-600">{item.status}</p>
                </div>
              </div>
              <Badge variant={item.key === 'vi' ? 'success' : 'muted'}>{item.key === 'vi' ? 'Ready' : 'Planned'}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Mobile support</CardTitle>
        <CardDescription>Web responsive truoc, native app iOS/Android de sau neu can.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-slate-100">
          {[
            'Sidebar da collapse tren mobile',
            'Kanban co the scroll ngang tren man hinh nho',
            'Form dung label ro rang va tap target lon',
            'Native app can API contract on dinh truoc khi tach mobile',
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 py-3 text-sm text-slate-700 first:pt-0 last:pb-0">
              <Smartphone size={18} className="mt-0.5 shrink-0 text-cyan-700" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </section>
);

const AdminShellView = () => (
  <section className="grid gap-4 lg:grid-cols-2">
    {[
      { title: 'Identity & Access', description: 'Quản lý tài khoản, vai trò, quyền truy cập và trạng thái khóa.', href: '/users', icon: ShieldCheck, status: 'Đang dùng' },
      { title: 'Organization Settings', description: 'Điều chỉnh phòng ban, đơn vị và cấu trúc tổ chức.', href: '/departments', icon: Users, status: 'Đang dùng' },
      { title: 'Company Analytics', description: 'Theo dõi năng suất, tổng giờ làm và báo cáo phòng ban.', href: undefined, icon: BarChart3, status: 'Phase 3' },
      { title: 'Billing', description: 'Khu vực cấu hình thanh toán khi triển khai mô hình SaaS.', href: undefined, icon: FileText, status: 'Dự kiến' },
    ].map((item) => (
      <Card key={item.title} className="group p-5 transition duration-150 hover:-translate-y-0.5 hover:bg-slate-50">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50 text-cyan-700 shadow-sm transition group-hover:border-cyan-200 group-hover:bg-white">
            <item.icon size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-slate-950">{item.title}</h2>
              <Badge variant={item.href ? 'success' : 'muted'}>{item.status}</Badge>
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
            {item.href ? (
              <Link to={item.href} className="mt-4 inline-flex">
                <Button type="button" variant="outline" size="sm">Mo trang</Button>
              </Link>
            ) : (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1.5 text-sm font-medium text-slate-600">
                Chưa mở trong phiên bản này
              </p>
            )}
          </div>
        </div>
      </Card>
    ))}
  </section>
);

const TaskCard = ({ task, projectName, onDragStart }: { task: Task; projectName: string; onDragStart: (id: number) => void }) => (
  <article
    draggable
    onDragStart={() => onDragStart(task.id)}
    className="interactive-lift cursor-grab rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm hover:border-blue-200 hover:shadow-[0_10px_20px_rgba(15,23,42,0.07)] active:cursor-grabbing"
  >
    <div className="flex items-start justify-between gap-3">
      <h4 className="font-display min-w-0 text-sm font-bold leading-6 text-slate-950">{task.title}</h4>
      <Badge variant={priorityTone[task.priority]}>{priorityLabels[task.priority]}</Badge>
    </div>
    <p className="mt-2 text-sm leading-6 text-slate-600">{task.description || 'Chưa có mô tả'}</p>
    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
      <span className="rounded-full bg-slate-100 px-2.5 py-1">{projectName}</span>
      <span className="rounded-full bg-slate-100 px-2.5 py-1">Assignee #{task.assigneeId}</span>
      <span className="rounded-full bg-slate-100 px-2.5 py-1">Due date: placeholder</span>
    </div>
  </article>
);

const TaskRow = ({ task, projectName, compact = false }: { task: Task; projectName: string; compact?: boolean }) => (
  <div className={cn('min-w-0', !compact && 'interactive-lift rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-200 hover:shadow-[0_10px_20px_rgba(15,23,42,0.06)]')}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <h3 className="font-display min-w-0 flex-1 font-bold leading-6 text-slate-950">{task.title}</h3>
      <div className="flex flex-wrap gap-2">
      <Badge variant={priorityTone[task.priority]}>{priorityLabels[task.priority]}</Badge>
      <Badge variant={task.status === 'COMPLETED' ? 'success' : task.status === 'IN_PROGRESS' ? 'warning' : 'info'}>
        {statusLabels[task.status]}
      </Badge>
      </div>
    </div>
    <p className="mt-2 text-sm leading-6 text-slate-600">{task.description || 'Chưa có mô tả công việc.'}</p>
    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
      <span className="rounded-full bg-slate-100 px-2.5 py-1">{projectName}</span>
      <span className="rounded-full bg-slate-100 px-2.5 py-1">Assignee #{task.assigneeId}</span>
      <span className="rounded-full bg-slate-100 px-2.5 py-1">Created {formatDate(task.createdAt)}</span>
      <span className="rounded-full bg-slate-100 px-2.5 py-1">Due date placeholder</span>
    </div>
  </div>
);

const ProjectRow = ({ project, expanded = false }: { project: ProjectSummary; expanded?: boolean }) => {
  const progress = getProgress(project);

  return (
    <Card className={cn('interactive-lift p-5 hover:border-blue-200 hover:shadow-[0_10px_22px_rgba(15,23,42,0.06)]', !expanded && 'border-slate-200')}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-bold text-slate-950">{project.name}</h3>
            <Badge variant={project.status === 'ACTIVE' ? 'success' : project.status === 'PAUSED' ? 'warning' : 'muted'}>
              {project.status}
            </Badge>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{project.description || 'Chưa có mô tả du an.'}</p>
        </div>
        <Link to="/work/board">
          <Button type="button" variant="outline" size="sm">Mo board</Button>
        </Link>
      </div>
      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full w-full origin-left rounded-full bg-blue-600 transition-transform duration-300 ease-out"
          style={{ transform: `scaleX(${progress / 100})` }}
        />
      </div>
      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-4">
        <span className="rounded-lg bg-slate-50 px-3 py-2 font-semibold">{progress}% done</span>
        <span className="rounded-lg bg-slate-50 px-3 py-2">{project.taskCount} task</span>
        <span className="rounded-lg bg-slate-50 px-3 py-2">{project.memberCount} thành viên</span>
        <span className="rounded-lg bg-slate-50 px-3 py-2">{project.highPriorityTaskCount} uu tien cao</span>
      </div>
    </Card>
  );
};

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
    <p className="font-display font-bold text-slate-900">{title}</p>
    <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
  </div>
);
