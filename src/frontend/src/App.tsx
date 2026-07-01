import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GlobalErrorUI } from './components/UI/GlobalErrorUI';
import { ProtectedRoute, UnauthorizedPage } from './components/Auth/ProtectedRoute';
import { PERMISSIONS } from './utils/permissions';

// Loading fallback component
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
    <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 text-center shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <div className="mx-auto mb-4 h-2 w-32 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-16 animate-shimmer rounded-full bg-gradient-to-r from-cyan-700 via-cyan-400 to-cyan-700 bg-[length:200%_100%]" />
      </div>
      <p className="text-sm font-semibold text-slate-800">Đang tải workspace</p>
      <p className="mt-1 text-sm text-slate-500">Chuẩn bị dữ liệu và quyền truy cập.</p>
    </div>
  </div>
);

// Lazy load pages - improves initial bundle size and load time
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const EmployeeListPage = lazy(() => import('./pages/EmployeeListPage').then(m => ({ default: m.EmployeeListPage })));
const EmployeeFormPage = lazy(() => import('./pages/EmployeeFormPage').then(m => ({ default: m.EmployeeFormPage })));
const EmployeeDetailPage = lazy(() => import('./pages/EmployeeDetailPage').then(m => ({ default: m.EmployeeDetailPage })));
const DepartmentListPage = lazy(() => import('./pages/DepartmentListPage').then(m => ({ default: m.DepartmentListPage })));
const DepartmentFormPage = lazy(() => import('./pages/DepartmentFormPage').then(m => ({ default: m.DepartmentFormPage })));
const OrganizationListPage = lazy(() => import('./pages/OrganizationListPage').then(m => ({ default: m.OrganizationListPage })));
const OrganizationFormPage = lazy(() => import('./pages/OrganizationFormPage').then(m => ({ default: m.OrganizationFormPage })));
const ProjectListPage = lazy(() => import('./pages/ProjectListPage').then(m => ({ default: m.ProjectListPage })));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));
const ProjectFormPage = lazy(() => import('./pages/ProjectFormPage').then(m => ({ default: m.ProjectFormPage })));
const TaskListPage = lazy(() => import('./pages/TaskListPage').then(m => ({ default: m.TaskListPage })));
const TaskDetailPage = lazy(() => import('./pages/TaskDetailPage').then(m => ({ default: m.TaskDetailPage })));
const TaskFormPage = lazy(() => import('./pages/TaskFormPage').then(m => ({ default: m.TaskFormPage })));
const PayrollPage = lazy(() => import('./pages/PayrollPage').then(m => ({ default: m.PayrollPage })));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage').then(m => ({ default: m.UserManagementPage })));
const RoleManagementPage = lazy(() => import('./pages/RoleManagementPage').then(m => ({ default: m.RoleManagementPage })));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage').then(m => ({ default: m.ChangePasswordPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const RoleWorkspacePage = lazy(() => import('./pages/RoleWorkspacePage').then(m => ({ default: m.RoleWorkspacePage })));
const WorkManagementPage = lazy(() => import('./pages/WorkManagementPage').then(m => ({ default: m.WorkManagementPage })));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage').then(m => ({ default: m.DocumentsPage })));
const BenefitsReviewPage = lazy(() => import('./pages/BenefitsReviewPage').then(m => ({ default: m.BenefitsReviewPage })));

function App() {
  return (
    <BrowserRouter>
      {/* Global Error UI - Toast Notifications & Error Modal */}
      <GlobalErrorUI />

      <Suspense fallback={<PageLoader />}>
        <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        
        {/* Dashboard - Authenticated users only */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        
        {/* Employee Routes - Requires employee:view permission */}
        <Route
          path="/employees"
          element={
            <ProtectedRoute permission={PERMISSIONS.EMPLOYEE_VIEW}>
              <EmployeeListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/add"
          element={
            <ProtectedRoute permission={PERMISSIONS.EMPLOYEE_CREATE}>
              <EmployeeFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/edit/:id"
          element={
            <ProtectedRoute permission={PERMISSIONS.EMPLOYEE_UPDATE}>
              <EmployeeFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/:id"
          element={
            <ProtectedRoute permission={PERMISSIONS.EMPLOYEE_VIEW}>
              <EmployeeDetailPage />
            </ProtectedRoute>
          }
        />
        
        {/* Department Routes - Requires department:view permission */}
        <Route
          path="/departments"
          element={
            <ProtectedRoute permission={PERMISSIONS.DEPARTMENT_VIEW}>
              <DepartmentListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/departments/add"
          element={
            <ProtectedRoute permission={PERMISSIONS.DEPARTMENT_CREATE}>
              <DepartmentFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/departments/edit/:id"
          element={
            <ProtectedRoute permission={PERMISSIONS.DEPARTMENT_UPDATE}>
              <DepartmentFormPage />
            </ProtectedRoute>
          }
        />
        
        {/* Organization Routes - Requires organization:view permission */}
        <Route
          path="/organizations"
          element={
            <ProtectedRoute permission={PERMISSIONS.ORGANIZATION_VIEW}>
              <OrganizationListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizations/add"
          element={
            <ProtectedRoute permission={PERMISSIONS.ORGANIZATION_CREATE}>
              <OrganizationFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizations/edit/:id"
          element={
            <ProtectedRoute permission={PERMISSIONS.ORGANIZATION_UPDATE}>
              <OrganizationFormPage />
            </ProtectedRoute>
          }
        />

        {/* Project Routes */}
        <Route
          path="/projects"
          element={
            <ProtectedRoute permission={PERMISSIONS.PROJECT_VIEW}>
              <ProjectListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/add"
          element={
            <ProtectedRoute permission={PERMISSIONS.PROJECT_CREATE}>
              <ProjectFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/edit/:id"
          element={
            <ProtectedRoute permission={PERMISSIONS.PROJECT_UPDATE}>
              <ProjectFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute permission={PERMISSIONS.PROJECT_VIEW}>
              <ProjectDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Task Routes */}
        <Route
          path="/tasks"
          element={
            <ProtectedRoute permission={PERMISSIONS.TASK_VIEW}>
              <TaskListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks/add"
          element={
            <ProtectedRoute permission={PERMISSIONS.TASK_CREATE}>
              <TaskFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks/edit/:id"
          element={
            <ProtectedRoute permission={PERMISSIONS.TASK_UPDATE}>
              <TaskFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks/:id"
          element={
            <ProtectedRoute permission={PERMISSIONS.TASK_VIEW}>
              <TaskDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Payroll Routes */}
        <Route
          path="/payroll"
          element={
            <ProtectedRoute permission={PERMISSIONS.PAYROLL_VIEW}>
              <PayrollPage />
            </ProtectedRoute>
          }
        />
        
        {/* User Management - Admin only (requires user:view permission) */}
        <Route
          path="/users"
          element={
            <ProtectedRoute permission={PERMISSIONS.USER_VIEW}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        
        {/* Role Management - Admin only (requires role:view permission) */}
        <Route
          path="/roles"
          element={
            <ProtectedRoute permission={PERMISSIONS.ROLE_VIEW}>
              <RoleManagementPage />
            </ProtectedRoute>
          }
        />
        
        {/* Profile & Password - Authenticated users only */}
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Role workspace routes - workspace page validates role-specific access */}
        <Route
          path="/work"
          element={
            <ProtectedRoute permission={PERMISSIONS.TASK_VIEW}>
              <WorkManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/work/:section"
          element={
            <ProtectedRoute permission={PERMISSIONS.TASK_VIEW}>
              <WorkManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/workspace/benefits/review/:taskId"
          element={
            <ProtectedRoute>
              <BenefitsReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspace/:slug"
          element={
            <ProtectedRoute>
              <RoleWorkspacePage />
            </ProtectedRoute>
          }
        />
        
        {/* Documents - all authenticated users */}
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <DocumentsPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
