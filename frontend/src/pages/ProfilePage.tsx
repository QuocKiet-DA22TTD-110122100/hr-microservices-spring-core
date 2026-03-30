import { MainLayout } from '@/components/Layout/MainLayout';
import { useAuthStore } from '@/store/authStore';
import { User, Mail, Phone, Calendar, Shield } from 'lucide-react';
import { formatDate } from '@/utils/format';

export const ProfilePage = () => {
  const { user } = useAuthStore();

  // Dữ liệu mẫu cho demo
  const profileData = {
    username: user?.username || 'admin',
    fullName: user?.fullName || 'Nguyễn Văn A',
    email: user?.email || 'admin@company.com',
    phone: '0123456789',
    position: 'Quản trị viên hệ thống',
    department: 'Phòng IT',
    joinDate: '2024-01-15',
    roles: user?.roles || ['ADMIN', 'USER'],
    lastLogin: new Date().toISOString(),
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Thông tin cá nhân</h1>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header with Avatar */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                <User className="text-blue-600" size={48} />
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">{profileData.fullName}</h2>
                <p className="text-blue-100">{profileData.position}</p>
                <p className="text-blue-100 text-sm mt-1">{profileData.department}</p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  Thông tin cơ bản
                </h3>
                
                <div className="flex items-start gap-3">
                  <User className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Tên đăng nhập</p>
                    <p className="text-gray-800 font-medium">{profileData.username}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-800 font-medium">{profileData.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Số điện thoại</p>
                    <p className="text-gray-800 font-medium">{profileData.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Ngày vào làm</p>
                    <p className="text-gray-800 font-medium">
                      {formatDate(profileData.joinDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  Phân quyền & Bảo mật
                </h3>

                <div className="flex items-start gap-3">
                  <Shield className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Vai trò</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profileData.roles.map((role) => (
                        <span
                          key={role}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Đăng nhập lần cuối</p>
                    <p className="text-gray-800 font-medium">
                      {formatDate(profileData.lastLogin, 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">Lưu ý:</span> Mật khẩu của bạn sẽ hết hạn sau 90 ngày.
                    Vui lòng đổi mật khẩu định kỳ để đảm bảo bảo mật.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Hoạt động gần đây</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">Đăng nhập thành công</p>
                <p className="text-xs text-gray-500">Hôm nay lúc 09:30</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">Cập nhật thông tin nhân viên</p>
                <p className="text-xs text-gray-500">Hôm qua lúc 14:20</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">Thêm phòng ban mới</p>
                <p className="text-xs text-gray-500">2 ngày trước lúc 10:15</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
