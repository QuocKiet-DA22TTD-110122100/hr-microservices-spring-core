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
} from 'lucide-react';
import { projectApi } from '@/api/project.api';
import { taskApi } from '@/api/task.api';
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
    description: 'Tat ca cong viec ca nhan theo trang thai.',
    icon: ListChecks,
    roles: ['employee', 'manager', 'departmentHead'],
  },
  {
    key: 'projects',
    label: 'Projects',
    description: 'Du an tham gia va bang Kanban.',
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
    label: 'Approvals',
    description: 'Task dang cho duyet, placeholder Phase 1.',
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
    description: 'Tai lieu task va san pham ban giao.',
    icon: Paperclip,
    roles: ['employee', 'manager', 'departmentHead', 'admin'],
  },
  {
    key: 'activity',
    label: 'Activity Log',
    description: 'Dong thoi gian hanh dong tren task/project.',
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
    description: 'Bao cao nang suat va tien do du an.',
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
    description: 'Goi y phan cong theo tai cong viec.',
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
    description: 'Quan ly tai khoan, role va cac placeholder admin.',
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

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString('vi-VN') : 'Chua co');

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
      setError('Khong the tai du lieu cong viec. Vui long kiem tra gateway, project-service va task-service.');
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
      setNotice('Tai khoan hien tai chi duoc xem board, chua co quyen cap nhat trang thai.');
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
      setNotice('Khong the cap nhat trang thai task. Vui long thu lai.');
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
      setNotice('Tai khoan hien tai chua co quyen tao task.');
      return;
    }

    if (!form.title.trim()) {
      setNotice('Vui long nhap ten task.');
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
      setNotice('Khong the tao task. Kiem tra project, assignee va quyen truy cap.');
    }
  };

  if (!isWorkRole(workspaceRole)) {
    return (
      <WorkShell title="Khong gian lam viec chua duoc cap" subtitle="Tai khoan can duoc duyet sang EMPLOYEE, MANAGER, DEPARTMENT_HEAD hoac ADMIN de su dung module cong viec.">
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <LockKeyhole size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Dang o trang thai gioi han</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Role hien tai khong nam trong pham vi dashboard Member, Manager hoac Admin. Day la hanh vi dung cho tai khoan chua duoc phe duyet hoac role khong thuoc module cong viec.
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
      subtitle="Phase 3 mo rong analytics, timeline, AI suggestion, automation, integrations, i18n va mobile readiness. Cac backend contract chua co duoc ghi ro."
      navItems={allowedNav}
      currentView={currentView}
      onNavigate={(view) => navigate(viewToRoute[view])}
    >
      {notice && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-center justify-between gap-4">
            <span>{notice}</span>
            <button type="button" className="font-semibold" onClick={() => setNotice(null)}>
              Dong
            </button>
          </div>
        </div>
      )}

      {error && (
        <Card className="border-rose-200 bg-rose-50 p-5 text-rose-800">
          <p className="font-semibold">Khong tai duoc du lieu</p>
          <p className="mt-1 text-sm">{error}</p>
          <Button type="button" variant="outline" className="mt-4 bg-white" onClick={() => void loadWorkData()}>
            Tai lai
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
          <h1 className="mt-1 text-2xl font-bold tracking-[-0.02em] text-slate-950">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/"
            aria-label="Thoat Work Management ve menu chinh"
            className="interactive-lift inline-flex h-8 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <ArrowLeft size={14} />
            Ve menu chinh
          </Link>
          <Badge variant="info">Phase 3</Badge>
          <Badge variant="muted">Kanban</Badge>
          <Badge variant="muted">Advanced</Badge>
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
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', active ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500')}>
                  <item.icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{item.description}</span>
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
                <p className="mt-1 text-3xl font-bold text-slate-950">{stat.value}</p>
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
              <EmptyState title="Chua co viec can canh bao" description="Khi co task uu tien cao hoac du an rui ro, khu vuc nay se hien thi truoc." />
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
          <CardDescription>Gom task tu moi project ve mot noi. Due date dang la placeholder vi backend chua co truong nay.</CardDescription>
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
        <EmptyState title="Chua co task phu hop" description="Thu doi filter hoac kiem tra phan cong task trong project." />
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
        <EmptyState title="Chua co du an" description="Project se xuat hien khi backend tra ve danh sach du an duoc phep xem." />
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
          <h2 className="text-lg font-bold text-slate-950">Project Board Kanban</h2>
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
              <h3 className="font-bold">{statusLabels[status]}</h3>
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold">{columnTasks.length}</span>
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
        <CardDescription>Phase 1 gom giao viec, mo ta, assignee, project va uu tien. Due date chua co API nen duoc ghi ro la placeholder.</CardDescription>
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
              placeholder="Mo ta chi tiet cong viec can lam"
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

const ApprovalsView = ({ tasks, projects, onNotice }: { tasks: Task[]; projects: ProjectSummary[]; onNotice: (value: string) => void }) => {
  const reviewLikeTasks = tasks.filter((task) => task.status === 'IN_PROGRESS' || task.priority === 'HIGH' || task.priority === 'URGENT').slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approvals</CardTitle>
        <CardDescription>Backend chua co endpoint submit/review. MVP hien danh sach ung vien can duyet va nut placeholder.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {reviewLikeTasks.length === 0 ? (
          <EmptyState title="Chua co task cho duyet" description="Khi co workflow submit/review, danh sach nay se lay tu endpoint approval rieng." />
        ) : (
          reviewLikeTasks.map((task) => (
            <div key={task.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
              <TaskRow task={task} projectName={getTaskProjectName(projects, task)} compact />
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={() => onNotice('[API endpoint: approve task] chua duoc ket noi trong Phase 1.')}>
                  Approve
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => onNotice('[API endpoint: request changes] chua duoc ket noi trong Phase 1.')}>
                  Request changes
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
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
        title: `Task da hoan thanh: ${task.title}`,
        description: `${getTaskProjectName(projects, task)} co thay doi trang thai.`,
        tone: 'success' as const,
        icon: CheckCircle2,
        time: formatDate(task.updatedAt || task.createdAt),
      })),
  ];

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_0.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>Notification Center</CardTitle>
          <CardDescription>Phase 2 shell cho thong bao giao viec, @mention va cap nhat trang thai. Realtime can websocket/SSE backend.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.length === 0 ? (
            <EmptyState title="Chua co thong bao" description="Thong bao se duoc tao tu task uu tien cao, task hoan thanh va mention khi backend co event stream." />
          ) : (
            notifications.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    item.tone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  )}
                >
                  <item.icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-950">{item.title}</p>
                    <Badge variant={item.tone}>{item.tone === 'success' ? 'Done' : 'Can chu y'}</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                  <p className="mt-2 text-xs text-slate-500">{item.time}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Realtime contract</CardTitle>
          <CardDescription>Cac endpoint/event can bo sung sau frontend shell.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            '[API endpoint: list notifications]',
            '[API endpoint: mark notification as read]',
            '[Realtime channel: task.assigned]',
            '[Realtime channel: task.mentioned]',
          ].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onNotice(`${item} chua co backend trong Phase 2 shell.`)}
              className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {item}
            </button>
          ))}
        </CardContent>
      </Card>
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
          {tasks.length === 0 && <EmptyState title="Chua co task" description="Discussion can task de gan comment." />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedTask ? selectedTask.title : 'Discussion'}</CardTitle>
          <CardDescription>{projectName}. Comment va @mention dang la Phase 2 frontend shell.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {sampleComments.map((comment) => (
              <div key={comment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">{comment.author}</Badge>
                  <span className="text-xs text-slate-500">{comment.time}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{comment.body}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
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
    type: index % 2 === 0 ? 'Bao cao ket qua' : 'Tai lieu task',
    status: task.status === 'COMPLETED' ? 'San sang ban giao' : 'Dang cho upload',
  }));

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_0.65fr]">
      <Card>
        <CardHeader>
          <CardTitle>File handoff</CardTitle>
          <CardDescription>Quan ly tai lieu va file san pham theo task. Upload/download can storage backend rieng.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {fileRows.length === 0 ? (
            <EmptyState title="Chua co file" description="Khi task co attachment, danh sach file se hien thi o day." />
          ) : (
            fileRows.map((file) => (
              <div key={file.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-950">{file.name}</p>
                    <Badge variant={file.status === 'San sang ban giao' ? 'success' : 'muted'}>{file.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{file.project}</p>
                  <p className="mt-1 text-xs text-slate-500">{file.type}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => onNotice('[API endpoint: download attachment] chua co backend.')}>
                  Tai file
                </Button>
              </div>
            ))
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
    title: `Cap nhat task ${task.title}`,
    description: `${getTaskProjectName(projects, task)} dang o trang thai ${statusLabels[task.status]}.`,
    time: formatDate(task.updatedAt || task.createdAt),
    icon: ListChecks,
  }));
  const projectEvents = projects.slice(0, 5).map((project) => ({
    id: `project-${project.id}`,
    title: `Du an ${project.name}`,
    description: `${project.taskCount} task, ${project.memberCount} thanh vien, ${getProgress(project)}% hoan thanh.`,
    time: formatDate(project.updatedAt || project.createdAt),
    icon: FolderKanban,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>Dong lich su doc tu du lieu project/task hien co. Audit day du can endpoint rieng.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {[...taskEvents, ...projectEvents].length === 0 ? (
          <EmptyState title="Chua co hoat dong" description="Activity log se hien thi khi co task/project trong he thong." />
        ) : (
          [...taskEvents, ...projectEvents].map((event) => (
            <div key={event.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <event.icon size={19} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-950">{event.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{event.description}</p>
                <p className="mt-2 text-xs text-slate-500">{event.time}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

const ProfileSettingsHub = ({ userName }: { userName: string }) => (
  <section className="grid gap-4 lg:grid-cols-2">
    {[
      {
        title: 'Profile',
        description: `Cap nhat thong tin ca nhan cua ${userName}.`,
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
        description: '[API endpoint: enable 2FA] chua co trong backend hien tai.',
        href: undefined,
        icon: ShieldCheck,
        badge: 'Placeholder',
      },
      {
        title: 'Language',
        description: 'Tieng Viet/Tieng Anh se ket noi khi co i18n dictionary trong Phase 3.',
        href: undefined,
        icon: Settings,
        badge: 'Phase 3',
      },
    ].map((item) => (
      <Card key={item.title} className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
            <item.icon size={23} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-950">{item.title}</h2>
              <Badge variant={item.badge === 'Ready' ? 'success' : 'muted'}>{item.badge}</Badge>
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
            {item.href && (
              <Link to={item.href} className="mt-4 inline-flex">
                <Button type="button" variant="outline" size="sm">Mo cai dat</Button>
              </Link>
            )}
          </div>
        </div>
      </Card>
    ))}
  </section>
);

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
          { label: 'Completion rate', value: `${completionRate}%`, hint: 'Task da hoan thanh tren tong task', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700' },
          { label: 'Dang xu ly', value: inProgress, hint: 'Task dang trong cot In Progress', icon: Briefcase, tone: 'bg-blue-50 text-blue-700' },
          { label: 'Rui ro uu tien', value: urgent, hint: 'HIGH hoac URGENT', icon: Bell, tone: 'bg-amber-50 text-amber-700' },
          { label: 'Du an active', value: projects.filter((project) => project.status === 'ACTIVE').length, hint: 'Du an dang van hanh', icon: FolderKanban, tone: 'bg-cyan-50 text-cyan-700' },
        ].map((item) => (
          <Card key={item.label} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                <p className="mt-1 text-3xl font-bold text-slate-950">{item.value}</p>
                <p className="mt-2 text-sm text-slate-500">{item.hint}</p>
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
            <EmptyState title="Chua co du lieu analytics" description="Can project/task de hien thi bao cao." />
          ) : (
            projectHealth.map((project) => (
              <div key={project.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-slate-950">{project.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{project.taskCount} task, {project.memberCount} thanh vien</p>
                  </div>
                  <Badge variant={project.highPriorityTaskCount > 0 ? 'warning' : 'success'}>
                    {project.highPriorityTaskCount > 0 ? 'Co rui ro' : 'On dinh'}
                  </Badge>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-cyan-600" style={{ width: `${project.progress}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-500">{project.progress}% hoan thanh, {project.highPriorityTaskCount} task uu tien cao</p>
              </div>
            ))
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
        <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-slate-500 sm:grid-cols-8">
          {['Tuan 1', 'Tuan 2', 'Tuan 3', 'Tuan 4', 'Tuan 5', 'Tuan 6', 'Tuan 7', 'Tuan 8'].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        {rows.length === 0 ? (
          <EmptyState title="Chua co timeline" description="Can project/task va due date de ve Gantt that." />
        ) : (
          rows.map(({ project, projectTasks, laneStart, laneWidth }) => (
            <div key={project.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-bold text-slate-950">{project.name}</p>
                <p className="text-sm text-slate-500">{projectTasks.length} task, {getProgress(project)}% done</p>
              </div>
              <div className="relative h-9 rounded-lg bg-slate-100">
                <div
                  className="absolute top-1 h-7 rounded-md bg-cyan-600"
                  style={{ left: `${laneStart}%`, width: `${laneWidth}%` }}
                />
              </div>
            </div>
          ))
        )}
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Backend contract dang cho bo sung</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['task.startDate', 'task.dueDate', 'task.dependencies', 'project.milestones', 'burndown metrics API'].map((contract) => (
              <span key={contract} className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-xs font-semibold text-amber-800">
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
  const overloadedAssignees = Object.entries(
    tasks.reduce<Record<string, number>>((acc, task) => {
      if (task.status !== 'COMPLETED') {
        acc[task.assigneeId] = (acc[task.assigneeId] || 0) + 1;
      }
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const riskyProjects = projects.filter((project) => project.highPriorityTaskCount > 0).slice(0, 5);

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
      <Card>
        <CardHeader>
          <CardTitle>AI task assignment suggestions</CardTitle>
          <CardDescription>Shell goi y dua tren workload hien co. AI that can skills, calendar va lich su performance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {overloadedAssignees.length === 0 ? (
            <EmptyState title="Chua co tin hieu qua tai" description="Khi co task dang mo, AI shell se hien goi y phan bo lai." />
          ) : (
            overloadedAssignees.map(([assigneeId, count]) => (
              <div key={assigneeId} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-slate-950">Assignee #{assigneeId}</p>
                    <p className="mt-1 text-sm text-slate-600">{count} task chua hoan thanh. Nen giam task moi hoac tach viec uu tien cao.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => onNotice('[AI endpoint: suggest assignee] chua duoc ket noi.')}>
                    Lay goi y AI
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk radar</CardTitle>
          <CardDescription>Du an co task uu tien cao de AI uu tien phan tich.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {riskyProjects.length === 0 ? (
            <EmptyState title="Chua co rui ro" description="Khong co project nao dang co task HIGH/URGENT." />
          ) : (
            riskyProjects.map((project) => (
              <div key={project.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <p className="font-bold">{project.name}</p>
                <p className="mt-1 text-sm">{project.highPriorityTaskCount} task uu tien cao, {getProgress(project)}% done.</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
};

const AutomationView = ({ onNotice }: { onNotice: (value: string) => void }) => {
  const rules = [
    {
      name: 'Done moves next task',
      trigger: 'When task.status = COMPLETED',
      action: 'Move dependent task to IN_PROGRESS',
    },
    {
      name: 'High priority notification',
      trigger: 'When task.priority = HIGH or URGENT',
      action: 'Notify manager and assignee',
    },
    {
      name: 'Review reminder',
      trigger: 'When task enters REVIEW for 24h',
      action: 'Send approval reminder',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Automation</CardTitle>
        <CardDescription>Phase 3 shell cho rule builder. Backend can rule engine va event bus.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rules.map((rule) => (
          <div key={rule.name} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-bold text-slate-950">{rule.name}</p>
                <p className="mt-1 text-sm text-slate-600">Trigger: {rule.trigger}</p>
                <p className="mt-1 text-sm text-slate-600">Action: {rule.action}</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => onNotice('[API endpoint: save workflow rule] chua co backend.')}>
                Enable rule
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const IntegrationsView = ({ onNotice }: { onNotice: (value: string) => void }) => (
  <section className="grid gap-4 lg:grid-cols-3">
    {[
      { name: 'Slack', description: 'Dong bo thong bao task va @mention vao channel du an.' },
      { name: 'Microsoft Teams', description: 'Gui approval reminder va meeting note cho team.' },
      { name: 'Google Calendar', description: 'Dong bo due date, milestone va lich review.' },
    ].map((integration) => (
      <Card key={integration.name} className="p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
          <PlugZap size={24} />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-950">{integration.name}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{integration.description}</p>
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
      <CardContent className="space-y-3">
        {[
          { key: 'vi', label: 'Tieng Viet', status: 'Dang dung trong UI hien tai' },
          { key: 'en', label: 'English', status: 'Can dictionary va key mapping' },
          { key: 'format', label: 'Date/number format', status: 'Can locale-aware formatter' },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Languages size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-950">{item.label}</p>
                <p className="text-sm text-slate-600">{item.status}</p>
              </div>
            </div>
            <Badge variant={item.key === 'vi' ? 'success' : 'muted'}>{item.key === 'vi' ? 'Ready' : 'Planned'}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Mobile support</CardTitle>
        <CardDescription>Web responsive truoc, native app iOS/Android de sau neu can.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {[
          'Sidebar da collapse tren mobile',
          'Kanban co the scroll ngang tren man hinh nho',
          'Form dung label ro rang va tap target lon',
          'Native app can API contract on dinh truoc khi tach mobile',
        ].map((item) => (
          <div key={item} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <Smartphone size={18} className="mt-0.5 shrink-0 text-cyan-700" />
            <span>{item}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  </section>
);

const AdminShellView = () => (
  <section className="grid gap-4 lg:grid-cols-2">
    {[
      { title: 'Identity & Access', description: 'Quan ly tai khoan, vai tro, quyen truy cap va trang thai khoa.', href: '/users', icon: ShieldCheck, status: 'Dang dung' },
      { title: 'Organization Settings', description: 'Dieu chinh phong ban, don vi va cau truc to chuc.', href: '/departments', icon: Users, status: 'Dang dung' },
      { title: 'Company Analytics', description: 'Theo doi nang suat, tong gio lam va bao cao phong ban.', href: undefined, icon: BarChart3, status: 'Phase 3' },
      { title: 'Billing', description: 'Khu vuc cau hinh thanh toan khi trien khai mo hinh SaaS.', href: undefined, icon: FileText, status: 'Du kien' },
    ].map((item) => (
      <Card key={item.title} className="group p-5 transition duration-150 hover:-translate-y-0.5 hover:bg-slate-50">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50 text-cyan-700 shadow-sm transition group-hover:border-cyan-200 group-hover:bg-white">
            <item.icon size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-950">{item.title}</h2>
              <Badge variant={item.href ? 'success' : 'muted'}>{item.status}</Badge>
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
            {item.href ? (
              <Link to={item.href} className="mt-4 inline-flex">
                <Button type="button" variant="outline" size="sm">Mo trang</Button>
              </Link>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-500">
                Chua mo trong phien ban nay
              </div>
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
      <h4 className="min-w-0 text-sm font-bold leading-6 text-slate-950">{task.title}</h4>
      <Badge variant={priorityTone[task.priority]}>{priorityLabels[task.priority]}</Badge>
    </div>
    <p className="mt-2 text-sm leading-6 text-slate-600">{task.description || 'Chua co mo ta'}</p>
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
      <h3 className="min-w-0 flex-1 font-bold leading-6 text-slate-950">{task.title}</h3>
      <div className="flex flex-wrap gap-2">
      <Badge variant={priorityTone[task.priority]}>{priorityLabels[task.priority]}</Badge>
      <Badge variant={task.status === 'COMPLETED' ? 'success' : task.status === 'IN_PROGRESS' ? 'warning' : 'info'}>
        {statusLabels[task.status]}
      </Badge>
      </div>
    </div>
    <p className="mt-2 text-sm leading-6 text-slate-600">{task.description || 'Chua co mo ta cong viec.'}</p>
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
            <h3 className="text-lg font-bold text-slate-950">{project.name}</h3>
            <Badge variant={project.status === 'ACTIVE' ? 'success' : project.status === 'PAUSED' ? 'warning' : 'muted'}>
              {project.status}
            </Badge>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{project.description || 'Chua co mo ta du an.'}</p>
        </div>
        <Link to="/work/board">
          <Button type="button" variant="outline" size="sm">Mo board</Button>
        </Link>
      </div>
      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600 transition-[width] duration-300 ease-out" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-4">
        <span className="rounded-lg bg-slate-50 px-3 py-2 font-semibold">{progress}% done</span>
        <span className="rounded-lg bg-slate-50 px-3 py-2">{project.taskCount} task</span>
        <span className="rounded-lg bg-slate-50 px-3 py-2">{project.memberCount} thanh vien</span>
        <span className="rounded-lg bg-slate-50 px-3 py-2">{project.highPriorityTaskCount} uu tien cao</span>
      </div>
    </Card>
  );
};

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
    <p className="font-bold text-slate-900">{title}</p>
    <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
  </div>
);
