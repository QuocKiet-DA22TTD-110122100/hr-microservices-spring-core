import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/UI/Button';
import { ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, Calendar, Briefcase } from 'lucide-react';

export const EmployeeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Dữ liệu mẫu
  const employee = {
    id: id,
    employeeCode: 'NV001',
    fullName: 'Nguyễn Văn A',
    email: 'nguyenvana@company.com',
    phone: '0123456789',
    dateOfBirth: '1990-01-15',
    gender: 'Nam',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    position: 'Senior Developer',
    departmentName: 'Phòng IT',
    hireDate: '2020-01-01',
    salary: '20000000',
    status: 'ACTIVE',
    avatar: null,
  };

  return (
    <MainLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/employees')}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Chi tiết nhân viên</h1>
              <p className="text-gray-600 text-sm mt-1">Thông tin chi tiết của nhân viên</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => navigate(`/employees/edit/${id}`)}>
              <Edit size={18} className="mr-2" />
              Chỉnh sửa
            </Button>
            <Button variant="danger">
              <Trash2 size={18} className="mr-2" />
              Xóa
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Profile Card */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="text-center">
              <div className="w-32 h-32 bg-blue-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <span className="text-4xl font-bold text-blue-600">
                  {employee.fullName.charAt(0)}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{employee.fullName}</h2>
              <p className="text-gray-600 text-sm mt-1">{employee.position}</p>
              <p className="text-gray-500 text-sm">{employee.departmentName}</p>

              <div className="mt-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    employee.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {employee.status === 'ACTIVE' ? 'Đang làm việc' : 'Nghỉ việc'}
                </span>
              </div>
            </div>
          </div>

          {/* Information Cards */}
          <div className="lg:col-span-2 space-y-5">
            {/* Thông tin cơ bản */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                Thông tin cơ bản
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Briefcase className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mã nhân viên</p>
                    <p className="text-gray-800 font-medium">{employee.employeeCode}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Mail className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-800 font-medium">{employee.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Phone className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Số điện thoại</p>
                    <p className="text-gray-800 font-medium">{employee.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Calendar className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ngày sinh</p>
                    <p className="text-gray-800 font-medium">{employee.dateOfBirth}</p>
                  </div>
                </div>

                <div className="md:col-span-2 flex items-start gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <MapPin className="text-red-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Địa chỉ</p>
                    <p className="text-gray-800 font-medium">{employee.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin công việc */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                Thông tin công việc
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Chức vụ</p>
                  <p className="text-gray-800 font-medium mt-1">{employee.position}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Phòng ban</p>
                  <p className="text-gray-800 font-medium mt-1">{employee.departmentName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Ngày vào làm</p>
                  <p className="text-gray-800 font-medium mt-1">{employee.hireDate}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Mức lương</p>
                  <p className="text-gray-800 font-medium mt-1">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(Number(employee.salary))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
