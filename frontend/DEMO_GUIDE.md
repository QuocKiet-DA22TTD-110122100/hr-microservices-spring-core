# 🎨 Hướng dẫn Xem Demo Giao diện

## 🚀 Đã chạy server thành công!

Server đang chạy tại: **http://localhost:3001/**

---

## 📋 Cách xem Dashboard và các trang khác

### Bước 1: Truy cập trang đăng nhập

Mở trình duyệt và vào: **http://localhost:3001/login**

### Bước 2: Đăng nhập Demo

Ứng dụng đang chạy ở **Demo Mode** - bạn có thể đăng nhập với **BẤT KỲ** username và password nào!

**Ví dụ:**
- Username: `admin`
- Password: `123456`

Hoặc:
- Username: `demo`
- Password: `demo`

Hoặc bất kỳ gì bạn muốn! 😊

### Bước 3: Xem các trang

Sau khi đăng nhập, bạn sẽ được chuyển đến Dashboard và có thể xem:

✅ **Dashboard** - Trang chủ với thống kê
✅ **Quản lý Nhân viên** - Danh sách nhân viên
✅ **Quản lý Phòng ban** - Danh sách phòng ban
✅ **Thông tin cá nhân** - Profile page
✅ **Đổi mật khẩu** - Form đổi mật khẩu

---

## 🎯 Các trang có thể xem

### 🔓 Không cần đăng nhập:

1. **Đăng nhập** 
   - URL: http://localhost:3001/login
   - Nhập bất kỳ username/password

2. **Đăng ký**
   - URL: http://localhost:3001/register
   - Form đăng ký đầy đủ

3. **Quên mật khẩu**
   - URL: http://localhost:3001/forgot-password
   - Form khôi phục mật khẩu

### 🔒 Sau khi đăng nhập:

4. **Dashboard**
   - URL: http://localhost:3001/
   - Trang chủ với cards thống kê

5. **Danh sách Nhân viên**
   - URL: http://localhost:3001/employees
   - Table với search và pagination

6. **Danh sách Phòng ban**
   - URL: http://localhost:3001/departments
   - Table phòng ban

7. **Thông tin cá nhân**
   - URL: http://localhost:3001/profile
   - Profile với avatar và thông tin

8. **Đổi mật khẩu**
   - URL: http://localhost:3001/change-password
   - Form đổi mật khẩu

---

## 💡 Tips

### Xem Responsive Design
- Nhấn `F12` để mở DevTools
- Click icon điện thoại để toggle device mode
- Thử các kích thước: Mobile, Tablet, Desktop

### Xem Notifications
- Sau khi đăng nhập, bạn sẽ thấy toast notification
- Thử submit các form để xem notifications khác

### Navigation
- Dùng sidebar menu để chuyển trang
- Click vào tên user ở header để xem menu

### Đăng xuất
- Click nút "Đăng xuất" ở góc trên bên phải
- Bạn sẽ được chuyển về trang login

---

## 🎨 Tính năng giao diện

✅ Responsive design (mobile, tablet, desktop)
✅ Gradient backgrounds đẹp mắt
✅ Form validation với error messages
✅ Loading states với spinner
✅ Toast notifications
✅ Modal dialogs
✅ Sidebar navigation
✅ Status badges với màu sắc
✅ Icons từ Lucide React
✅ Smooth transitions

---

## 🔧 Chế độ Demo

Hiện tại ứng dụng đang chạy ở **Demo Mode**:

- ✅ Không cần backend API
- ✅ Đăng nhập với bất kỳ username/password
- ✅ Dữ liệu hiển thị là dữ liệu mẫu
- ✅ Form submit chỉ hiển thị notification
- ✅ Không lưu dữ liệu thật

**Khi nào có backend:**
- Chỉ cần comment code demo trong `LoginPage.tsx`
- Uncomment code gọi API thật
- Ứng dụng sẽ kết nối với backend Spring Boot

---

## 🛑 Dừng server

Để dừng server, nhấn `Ctrl + C` trong terminal đang chạy.

---

## 📸 Screenshots

### Trang Đăng nhập
- Gradient background xanh dương
- Form trung tâm với shadow
- Demo mode notice

### Dashboard
- Header với user menu
- Sidebar navigation
- Cards thống kê
- Cảnh báo mật khẩu

### Danh sách
- Table với dữ liệu
- Search box
- Pagination
- Status badges

---

## ❓ Troubleshooting

**Q: Không vào được Dashboard?**
A: Đảm bảo bạn đã đăng nhập. Nhập bất kỳ username/password và click "Đăng nhập".

**Q: Trang trắng xóa?**
A: Mở DevTools (F12) và xem Console có lỗi gì không. Hoặc refresh lại trang.

**Q: Port 3001 không hoạt động?**
A: Kiểm tra terminal xem server có đang chạy không. Nếu không, chạy lại `npm run dev`.

**Q: Muốn thay đổi giao diện?**
A: Sửa file trong `src/pages/` hoặc `src/components/`. Trang sẽ tự động reload.

---

## 🎉 Enjoy!

Bây giờ bạn có thể xem toàn bộ giao diện của hệ thống quản lý nhân sự!

Nếu có câu hỏi, hãy hỏi team lead hoặc check file `ARCHITECTURE.md` để hiểu rõ hơn về cấu trúc.

---

**Tạo bởi:** Nhóm thực tập 2026
**Mục đích:** Demo giao diện cho doanh nghiệp
