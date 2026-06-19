# Manual QA Testing Guide

## Mục lục
1. [CRUD Actions Testing](#crud-actions-testing)
2. [Mobile Responsiveness Testing](#mobile-responsiveness-testing)
3. [Accessibility Testing](#accessibility-testing)
4. [Test Checklist](#test-checklist)

---

## CRUD Actions Testing

### 1. User Management - CRUD Flow

#### 1.1 CREATE User
**Mục tiêu:** Tạo user mới thành công

**Bước thực hiện:**
1. Đăng nhập với tài khoản Admin
2. Điều hướng đến trang "Quản lý Tài khoản" (`/users`)
3. Click nút "Thêm tài khoản"
4. Điền form:
   - Tên đăng nhập: `testuser123`
   - Mật khẩu: `password123`
   - Vai trò: `USER`
5. Click "Tạo"

**Kết quả mong đợi:**
- ✅ Modal đóng
- ✅ Notification "Tạo tài khoản thành công" hiển thị
- ✅ User mới xuất hiện trong table
- ✅ Trạng thái: "Hoạt động"

**Test Cases Validation:**
- [ ] Empty username → Show error "Tên đăng nhập là bắt buộc"
- [ ] Empty password → Show error "Mật khẩu là bắt buộc"
- [ ] Username < 3 chars → Show error "Tên đăng nhập phải có ít nhất 3 ký tự"
- [ ] Password < 6 chars → Show error "Mật khẩu phải có ít nhất 6 ký tự"
- [ ] Duplicate username → Show error "Username already exists"
- [ ] Invalid characters → Show error "Tên đăng nhập chỉ được chứa..."

#### 1.2 READ/VIEW Users
**Mục tiêu:** Xem danh sách users

**Bước thực hiện:**
1. Điều hướng đến `/users`
2. Quan sát table

**Kết quả mong đợi:**
- ✅ Table hiển thị columns: Tên đăng nhập, Vai trò, Trạng thái, Ngày tạo, Thao tác
- ✅ Data load từ API
- ✅ Loading skeleton hiển thị khi loading
- ✅ Empty state nếu không có data
- ✅ Pagination hiển thị đúng
- ✅ Search box hoạt động

**Test Cases:**
- [ ] Search by username works
- [ ] Sort by username (asc/desc)
- [ ] Sort by created date (asc/desc)
- [ ] Pagination: Change page size (5, 10, 20, 50)
- [ ] Pagination: Navigate between pages
- [ ] Status badges show correct colors (green=active, red=locked)

#### 1.3 UPDATE User
**Mục tiêu:** Cập nhật thông tin user

**Bước thực hiện:**
1. Tìm user vừa tạo trong table
2. Click nút "Sửa"
3. Trong modal, thay đổi:
   - Vai trò: `USER` → `HR_MANAGER`
4. Toggle một số permissions
5. Click "Cập nhật"

**Kết quả mong đợi:**
- ✅ Modal đóng
- ✅ Notification "Cập nhật tài khoản thành công"
- ✅ Vai trò trong table được update
- ✅ Permissions được lưu

**Test Cases:**
- [ ] Permission matrix hiển thị đúng
- [ ] Inherited permissions không thể toggle
- [ ] Custom permissions có thể toggle
- [ ] Select all/deselect all trong group hoạt động
- [ ] Role change updates inherited permissions visually

#### 1.4 DELETE User
**Mục tiêu:** Xóa user

**Bước thực hiện:**
1. Tìm user trong table
2. Click nút "Xóa"
3. Modal xác nhận xuất hiện
4. Click "Xóa" để confirm

**Kết quả mong đợi:**
- ✅ Confirmation modal xuất hiện
- ✅ Modal đóng sau khi confirm
- ✅ Notification "Xóa tài khoản thành công"
- ✅ User biến mất khỏi table
- ✅ Page count updates nếu cần

**Test Cases:**
- [ ] Click "Hủy" → Modal closes, user NOT deleted
- [ ] Click "X" (close) → Modal closes, user NOT deleted
- [ ] Click outside modal → Modal closes, user NOT deleted
- [ ] Press Escape → Modal closes, user NOT deleted

#### 1.5 LOCK/UNLOCK User
**Mục tiêu:** Khóa và mở khóa tài khoản

**Bước thực hiện:**
1. Tìm user với status "Hoạt động"
2. Click icon Lock
3. Confirm trong modal
4. Verify status changes to "Bị khóa"
5. Click icon Unlock
6. Confirm trong modal
7. Verify status changes back to "Hoạt động"

**Kết quả mong đợi:**
- ✅ Lock: Status badge changes to red "Bị khóa"
- ✅ Unlock: Status badge changes to green "Hoạt động"
- ✅ Notifications display correctly
- ✅ Optimistic update (instant UI change)

### 2. Employee Management - CRUD Flow

#### 2.1 CREATE Employee
**Bước thực hiện:**
1. Đi đến `/employees`
2. Click "Thêm nhân viên"
3. Điền form:
   - Tên nhân viên: `Nguyễn Văn A`
   - Email: `nguyenvana@example.com`
   - Số điện thoại: `0912345678`
   - Chức vụ: `Developer`
   - Chọn Tổ chức
   - Chọn Phòng ban
4. Click "Thêm nhân viên"

**Kết quả mong đợi:**
- ✅ Redirect về `/employees`
- ✅ Notification success
- ✅ Employee mới trong list

**Validation Tests:**
- [ ] Name required
- [ ] Name min 2 chars, max 100 chars
- [ ] Email format validation
- [ ] Phone format (Vietnamese): 0912345678
- [ ] Organization required
- [ ] Department required (depends on organization)

#### 2.2 READ/VIEW Employees
**Bước thực hiện:**
1. Đi đến `/employees`
2. Quan sát list

**Kết quả mong đợi:**
- ✅ Table với columns: Mã NV, Họ và tên, Email, Số điện thoại, Chức vụ, Phòng ban, Trạng thái, Ngày vào làm
- ✅ Search box works
- ✅ Pagination works
- ✅ Click row → Navigate to detail page

#### 2.3 UPDATE Employee
**Bước thực hiện:**
1. Click "Sửa" hoặc click row
2. Trong form, update:
   - Chức vụ: `Senior Developer`
   - Số điện thoại: `0987654321`
3. Click "Cập nhật"

**Kết quả mong đợi:**
- ✅ Redirect về list
- ✅ Notification success
- ✅ Data updated

#### 2.4 DELETE Employee
**Bước thực hiện:**
1. Tìm cách xóa employee (nếu có UI)
2. Confirm deletion

**Kết quả mong đợi:**
- ✅ Employee removed from list

### 3. Department Management - CRUD Flow

#### 3.1 CREATE Department
**Bước thực hiện:**
1. Đi đến `/departments`
2. Click "Thêm phòng ban"
3. Điền thông tin
4. Submit

**Kết quả mong đợi:**
- ✅ Department mới trong list
- ✅ Notification success

#### 3.2-3.4 READ/UPDATE/DELETE Department
Similar to Employee flow above.

### 4. Organization Management - CRUD Flow

#### 4.1-4.4 CREATE/READ/UPDATE/DELETE Organization
Similar to Department flow above.

---

## Mobile Responsiveness Testing

### Test Devices

**Test trên các kích thước:**
- Mobile: 375px (iPhone SE)
- Mobile: 414px (iPhone 12 Pro)
- Tablet: 768px (iPad)
- Tablet: 1024px (iPad Pro)
- Desktop: 1280px
- Desktop: 1920px

### Cách Test

#### Option 1: Chrome DevTools
1. Mở Chrome DevTools (F12)
2. Click icon "Toggle device toolbar" (Ctrl+Shift+M)
3. Chọn device hoặc nhập custom width
4. Test từng page

#### Option 2: Thay đổi browser width
1. Resize browser window
2. Observe responsive breakpoints

### Test Cases - Mobile View (< 768px)

#### Layout
- [ ] Navigation menu collapses to hamburger
- [ ] Tables scroll horizontally if needed
- [ ] Cards stack vertically
- [ ] Buttons full-width or properly sized
- [ ] Text không bị cắt
- [ ] Images scale properly

#### User Management Page
- [ ] Table scrollable horizontally
- [ ] Action buttons accessible
- [ ] Search bar full width
- [ ] "Add" button visible and accessible
- [ ] Modal fits screen (no overflow)
- [ ] Form inputs full width
- [ ] Permission matrix scrollable

#### Employee Form Page
- [ ] Form fields stack vertically
- [ ] Dropdowns work properly
- [ ] Submit buttons accessible
- [ ] Back button visible
- [ ] Warning banner readable

#### Navigation
- [ ] Links tappable (min 44x44px)
- [ ] No horizontal scroll on pages
- [ ] Modals centered and fit screen

### Test Cases - Tablet View (768px - 1024px)

- [ ] 2-column layouts work
- [ ] Tables show more columns
- [ ] Sidebar visible or toggleable
- [ ] Forms in optimal width

### Test Cases - Desktop View (> 1024px)

- [ ] Full layout visible
- [ ] Multi-column layouts work
- [ ] Tables show all columns
- [ ] Optimal spacing and padding

### Touch Targets

**Test trên mobile:**
- [ ] Buttons minimum 44x44px
- [ ] Links tappable easily
- [ ] Checkboxes/radio buttons large enough
- [ ] Dropdown arrows accessible
- [ ] Icon buttons have adequate size

### Text Readability

- [ ] Font size readable on mobile (min 16px for body)
- [ ] Line height adequate
- [ ] Contrast ratio sufficient
- [ ] Text không quá dài (max-width cho paragraph)

---

## Accessibility Testing

### Keyboard Navigation

#### Test với keyboard only (không dùng mouse)

**Basic Navigation:**
1. Tab through page
   - [ ] Focus visible on all interactive elements
   - [ ] Tab order logical (top to bottom, left to right)
   - [ ] No keyboard traps
   - [ ] Skip to main content link (if present)

2. Forms
   - [ ] Tab to inputs
   - [ ] Enter labels input
   - [ ] Space toggles checkboxes
   - [ ] Arrow keys work in dropdowns
   - [ ] Enter submits form

3. Modals
   - [ ] Tab trapped inside modal
   - [ ] Escape closes modal
   - [ ] Focus returns to trigger element after close

4. Tables
   - [ ] Tab through action buttons
   - [ ] Enter activates buttons

5. Buttons
   - [ ] Enter activates
   - [ ] Space activates

**Keyboard Shortcuts to Test:**
- `Tab` - Next element
- `Shift+Tab` - Previous element
- `Enter` - Activate button/link
- `Space` - Toggle checkbox/activate button
- `Escape` - Close modal
- `Arrow keys` - Navigate dropdowns

### Screen Reader Testing

#### Using NVDA (Windows - Free)

**Download:** https://www.nvaccess.org/download/

**Bước thực hiện:**
1. Install NVDA
2. Start NVDA (Ctrl+Alt+N)
3. Navigate website with keyboard
4. Listen to announcements

**Test Cases:**
- [ ] Page title announced
- [ ] Headings announced with level (h1, h2, etc.)
- [ ] Links announced with text
- [ ] Buttons announced with label
- [ ] Form fields announced with label
- [ ] Error messages announced
- [ ] Status messages (success/error notifications) announced
- [ ] Table headers announced
- [ ] Images have alt text (or marked decorative)
- [ ] Loading states announced

#### Using ChromeVox (Chrome Extension)

**Install:** Chrome Web Store → ChromeVox

**Test similar to NVDA above**

#### Using VoiceOver (macOS)

**Activate:** Cmd+F5

**Test similar to NVDA above**

### ARIA Attributes

**Use browser DevTools to verify:**

#### Forms
- [ ] Inputs have `aria-label` or associated `<label>`
- [ ] Required fields have `aria-required="true"` or `required`
- [ ] Invalid fields have `aria-invalid="true"`
- [ ] Error messages have `aria-describedby` linking to error
- [ ] Error text has `role="alert"`

#### Buttons
- [ ] Buttons have descriptive text or `aria-label`
- [ ] Icon-only buttons have `aria-label`
- [ ] Disabled buttons have `disabled` attribute

#### Modals
- [ ] Modal has `role="dialog"`
- [ ] Modal has `aria-modal="true"`
- [ ] Modal has `aria-labelledby` to title
- [ ] Overlay is keyboard accessible

#### Tables
- [ ] Table has proper `<th>` headers
- [ ] Complex tables have `scope` attributes
- [ ] Sortable headers indicate sort state

#### Live Regions
- [ ] Notifications use `aria-live="polite"` or `role="alert"`
- [ ] Loading states use `aria-busy="true"`

### Color Contrast

**Tool:** Chrome DevTools Lighthouse

**Bước thực hiện:**
1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Accessibility"
4. Click "Generate report"

**Requirements:**
- [ ] Normal text: Contrast ratio ≥ 4.5:1
- [ ] Large text (18pt+): Contrast ratio ≥ 3:1
- [ ] UI components: Contrast ratio ≥ 3:1

**Manual Check:**
- [ ] Text readable on backgrounds
- [ ] Error messages visible
- [ ] Placeholder text visible
- [ ] Disabled states distinguishable

### Focus Indicators

**Test:**
- [ ] All interactive elements show focus outline
- [ ] Focus outline visible on all backgrounds
- [ ] Focus outline not removed by CSS (unless replaced with better alternative)
- [ ] Custom focus styles meet contrast requirements

### Semantic HTML

**Verify with DevTools:**
- [ ] Proper heading hierarchy (h1 → h2 → h3, no skipping)
- [ ] Lists use `<ul>`, `<ol>`, `<li>`
- [ ] Navigation uses `<nav>`
- [ ] Main content uses `<main>`
- [ ] Buttons are `<button>` (not `<div>` with click handler)
- [ ] Links are `<a>` with `href`

### Form Accessibility

**Test each form:**
- [ ] Every input has associated label
- [ ] Labels clickable (focuses input)
- [ ] Required fields indicated (*, required text, or aria-required)
- [ ] Error messages linked to fields (aria-describedby)
- [ ] Errors announced to screen readers
- [ ] Success messages announced
- [ ] Submit button clearly labeled

### Image Accessibility

- [ ] All images have `alt` attribute
- [ ] Decorative images have `alt=""` or `role="presentation"`
- [ ] Informative images have descriptive alt text
- [ ] Icons have `aria-label` if used alone

---

## Test Checklist

### Pre-Test Setup
- [ ] Database seeded with test data
- [ ] Test accounts created (Admin, User, HR Manager)
- [ ] Backend services running
- [ ] Frontend dev server running (`npm run dev`)

### CRUD Testing Checklist

#### User Management
- [ ] Create user (valid data)
- [ ] Create user (validation errors)
- [ ] View user list
- [ ] Search users
- [ ] Sort users
- [ ] Paginate users
- [ ] Edit user
- [ ] Edit user permissions
- [ ] Delete user (confirm)
- [ ] Delete user (cancel)
- [ ] Lock user
- [ ] Unlock user

#### Employee Management
- [ ] Create employee
- [ ] View employees
- [ ] Search employees
- [ ] Edit employee
- [ ] Delete employee

#### Department Management
- [ ] Create department
- [ ] View departments
- [ ] Edit department
- [ ] Delete department

#### Organization Management
- [ ] Create organization
- [ ] View organizations
- [ ] Edit organization
- [ ] Delete organization

### Mobile Responsiveness Checklist

#### Breakpoints
- [ ] 375px (Mobile)
- [ ] 768px (Tablet)
- [ ] 1024px (Desktop)
- [ ] 1920px (Large Desktop)

#### Components
- [ ] Navigation
- [ ] Tables
- [ ] Forms
- [ ] Modals
- [ ] Buttons
- [ ] Cards
- [ ] Lists

### Accessibility Checklist

#### Keyboard Navigation
- [ ] Tab through all pages
- [ ] Forms navigable
- [ ] Modals trap focus
- [ ] Escape closes modals

#### Screen Reader
- [ ] Test with NVDA/ChromeVox/VoiceOver
- [ ] All content announced
- [ ] Proper labels
- [ ] Status messages announced

#### Visual
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] Text scalable

#### Semantic HTML
- [ ] Proper heading hierarchy
- [ ] Proper use of semantic elements
- [ ] Valid HTML

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Performance
- [ ] Pages load < 3 seconds
- [ ] No layout shifts (CLS)
- [ ] Smooth scrolling
- [ ] No console errors

---

## Bug Reporting Template

Khi tìm thấy bug, report theo format:

```markdown
**Title:** [Brief description]

**Priority:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
What should happen

**Actual Result:**
What actually happened

**Screenshots:**
[Attach screenshots]

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- Screen size: 1920x1080
- User role: Admin

**Additional Notes:**
Any other relevant information
```

---

## Test Execution Log

### Test Session Details
- **Date:** _____________
- **Tester:** _____________
- **Build Version:** _____________
- **Environment:** Dev / Staging / Production

### Results Summary
- **Total Tests:** _____
- **Passed:** _____
- **Failed:** _____
- **Blocked:** _____
- **Pass Rate:** _____% 

### Failed Tests
| Test Case | Status | Bug ID | Notes |
|-----------|--------|--------|-------|
|           |        |        |       |

### Sign-off
- **Tester:** _________________ Date: _______
- **Reviewer:** _________________ Date: _______
