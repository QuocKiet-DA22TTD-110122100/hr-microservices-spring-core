import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/UI/Button';
import { employeeApi } from '@/api/employee.api';
import { Employee } from '@/types/employee';
import { useUIStore } from '@/store/uiStore';
import { getApiErrorMessage } from '@/utils/error';
import { ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, Calendar, Briefcase } from 'lucide-react';

export const EmployeeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) {
        addNotification({
          type: 'error',
          message: 'Thiếu mã nhân viên.',
        });
        navigate('/employees');
        return;
      }

      setIsLoading(true);
      try {
        const response = await employeeApi.getById(Number(id));
        setEmployee(response.data);
      } catch (error: unknown) {
        addNotification({
          type: 'error',
          message: getApiErrorMessage(error, 'Lỗi khi tải chi tiết nhân viên.'),
        });
        navigate('/employees');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployee();
  }, [id, navigate, addNotification]);

  const handleDelete = async () => {
    if (!id || !employee) {
      return;
    }

    if (!globalThis.confirm(`Bạn có chắc chắn muốn xóa nhân viên "${employee.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await employeeApi.delete(Number(id));
      addNotification({
        type: 'success',
        message: 'Xóa nhân viên thành công.',
      });
      navigate('/employees');
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Lỗi khi xóa nhân viên.'),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Đang tải...</div>
        </div>
      </MainLayout>
    );
  }

  if (!employee) {
    return null;
  }

  const avatarText = employee.name?.charAt(0)?.toUpperCase() || 'N';
  const employeeCode = typeof employee.employeeCode === 'string' ? employee.employeeCode : `NV-${employee.id}`;
  const email = typeof employee.email === 'string' ? employee.email : '--';
  const phone = typeof employee.phone === 'string' ? employee.phone : '--';
  const dateOfBirth = typeof employee.dateOfBirth === 'string' ? employee.dateOfBirth : '--';
  const address = typeof employee.address === 'string' ? employee.address : '--';
  const hireDate = typeof employee.hireDate === 'string' ? employee.hireDate : '--';
  const salary = typeof employee.salary === 'number' ? employee.salary : 0;
  const status = typeof employee.status === 'string' ? employee.status : 'ACTIVE';

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
            <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
              <Trash2 size={18} className="mr-2" />
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Profile Card */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="text-center">
              <div className="w-32 h-32 bg-blue-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <span className="text-4xl font-bold text-blue-600">
                  {avatarText}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{employee.name}</h2>
              <p className="text-gray-600 text-sm mt-1">{employee.position}</p>
              <p className="text-gray-500 text-sm">{employee.departmentName}</p>

              <div className="mt-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {status === 'ACTIVE' ? 'Đang làm việc' : 'Nghỉ việc'}
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
                    <p className="text-gray-800 font-medium">{employeeCode}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Mail className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-800 font-medium">{email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Phone className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Số điện thoại</p>
                    <p className="text-gray-800 font-medium">{phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Calendar className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ngày sinh</p>
                    <p className="text-gray-800 font-medium">{dateOfBirth}</p>
                  </div>
                </div>

                <div className="md:col-span-2 flex items-start gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <MapPin className="text-red-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Địa chỉ</p>
                    <p className="text-gray-800 font-medium">{address}</p>
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
                  <p className="text-gray-800 font-medium mt-1">{hireDate}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Mức lương</p>
                  <p className="text-gray-800 font-medium mt-1">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(Number(salary))}
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
