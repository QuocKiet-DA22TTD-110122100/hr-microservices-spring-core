import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useAuthStore } from '@/store/authStore';
import { getPasswordExpiryWarning } from '@/utils/format';
import { Users, Building2, AlertCircle } from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const [passwordWarning, setPasswordWarning] = useState<string | null>(null);

  useEffect(() => {
    if (user?.passwordExpiresAt) {
      const warning = getPasswordExpiryWarning(user.passwordExpiresAt);
      setPasswordWarning(warning);
    }
  }, [user]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-md">
          <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
          <p className="text-blue-100">Chào mừng trở lại, {user?.fullName}</p>
        </div>

        {passwordWarning && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
              <p className="text-yellow-800 text-sm">{passwordWarning}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 - Blue */}
          <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Tổng nhân viên</p>
                <p className="text-3xl font-bold text-gray-800">--</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl">
                <Users className="text-blue-600" size={32} />
              </div>
            </div>
          </div>

          {/* Card 2 - Green */}
          <div className="bg-white rounded-xl p-6 border-l-4 border-green-500 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Tổng phòng ban</p>
                <p className="text-3xl font-bold text-gray-800">--</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <Building2 className="text-green-600" size={32} />
              </div>
            </div>
          </div>

          {/* Card 3 - Purple */}
          <div className="bg-white rounded-xl p-6 border-l-4 border-purple-500 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Nhân viên mới tháng này</p>
                <p className="text-3xl font-bold text-gray-800">--</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl">
                <Users className="text-purple-600" size={32} />
              </div>
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div className="bg-white rounded-xl p-6 border shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-gray-800">Hoạt động gần đây</h2>
          </div>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-3">
              <AlertCircle className="text-gray-400" size={28} />
            </div>
            <p className="text-gray-500 text-sm">Chưa có hoạt động nào</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
