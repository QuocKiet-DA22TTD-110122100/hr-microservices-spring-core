import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeeListPage } from './pages/EmployeeListPage';
import { EmployeeFormPage } from './pages/EmployeeFormPage';
import { EmployeeDetailPage } from './pages/EmployeeDetailPage';
import { DepartmentListPage } from './pages/DepartmentListPage';
import { DepartmentFormPage } from './pages/DepartmentFormPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { RoleManagementPage } from './pages/RoleManagementPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { X } from 'lucide-react';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const { notifications, removeNotification } = useUIStore();

  return (
    <BrowserRouter>
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center gap-3 p-4 rounded-lg shadow-lg min-w-[300px] ${
              notification.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : notification.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : notification.type === 'warning'
                ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            <p className="flex-1">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="p-1 hover:bg-white/50 rounded"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <PrivateRoute>
              <EmployeeListPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/employees/add"
          element={
            <PrivateRoute>
              <EmployeeFormPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/employees/edit/:id"
          element={
            <PrivateRoute>
              <EmployeeFormPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/employees/:id"
          element={
            <PrivateRoute>
              <EmployeeDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/departments"
          element={
            <PrivateRoute>
              <DepartmentListPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/departments/add"
          element={
            <PrivateRoute>
              <DepartmentFormPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/departments/edit/:id"
          element={
            <PrivateRoute>
              <DepartmentFormPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <UserManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <PrivateRoute>
              <RoleManagementPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <PrivateRoute>
              <ChangePasswordPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
