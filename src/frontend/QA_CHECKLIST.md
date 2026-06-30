# QA Manual Test Checklist

## Test Session Info
- **Tester Name:** _________________
- **Date:** _________________
- **Build/Commit:** _________________
- **Environment:** [ ] Dev [ ] Staging [ ] Production

---

## 1. USER MANAGEMENT - CRUD

### 1.1 Create User
- [ ] Click "Thêm tài khoản" button works
- [ ] Modal opens with empty form
- [ ] Username field validation:
  - [ ] Empty → Shows error
  - [ ] < 3 chars → Shows error
  - [ ] > 50 chars → Shows error
  - [ ] Invalid chars → Shows error
  - [ ] Valid input → No error
- [ ] Password field validation:
  - [ ] Empty → Shows error
  - [ ] < 6 chars → Shows error
  - [ ] Valid input → No error
- [ ] Role dropdown has options
- [ ] Submit with valid data → Success
  - [ ] Modal closes
  - [ ] Success notification shown
  - [ ] User appears in table
- [ ] Cancel button closes modal
- [ ] X button closes modal
- [ ] Click outside closes modal
- [ ] Escape key closes modal

### 1.2 View Users
- [ ] Table displays with correct columns
- [ ] Loading skeleton shows when loading
- [ ] Data loads from API
- [ ] Empty state shows when no data
- [ ] Search box filters users
- [ ] Search is debounced (500ms)
- [ ] Sort by username works (asc/desc)
- [ ] Sort by date works (asc/desc)
- [ ] Pagination info shows correct numbers
- [ ] Page size dropdown works (5, 10, 20, 50)
- [ ] Previous/Next buttons work
- [ ] First/Last page buttons work
- [ ] Status badges show correct colors
  - [ ] Green = Hoạt động (unlocked)
  - [ ] Red = Bị khóa (locked)

### 1.3 Edit User
- [ ] Click "Sửa" button opens modal
- [ ] Modal shows current user data
- [ ] Username field displays (read-only)
- [ ] Role dropdown shows current value
- [ ] Permission matrix displays
  - [ ] Permissions grouped by category
  - [ ] Inherited permissions shown (disabled)
  - [ ] Custom permissions toggleable
  - [ ] Select all in group works
  - [ ] Deselect all in group works
  - [ ] Permission counters update
- [ ] Change role → Inherited permissions update
- [ ] Toggle custom permissions works
- [ ] Submit → Success
  - [ ] Modal closes
  - [ ] Success notification
  - [ ] Table updates
- [ ] Cancel/X/Outside click/Escape closes modal

### 1.4 Delete User
- [ ] Click "Xóa" button
- [ ] Confirmation modal appears
- [ ] Modal shows warning message
- [ ] Confirm delete → Success
  - [ ] Modal closes
  - [ ] Success notification
  - [ ] User removed from table
  - [ ] Page count updates if needed
- [ ] Cancel → Modal closes, user NOT deleted

### 1.5 Lock/Unlock User
- [ ] Active user shows Lock icon
- [ ] Locked user shows Unlock icon
- [ ] Click Lock → Confirmation modal
- [ ] Confirm lock → Success
  - [ ] Status changes to "Bị khóa"
  - [ ] Success notification
  - [ ] Icon changes to Unlock
- [ ] Click Unlock → Confirmation modal
- [ ] Confirm unlock → Success
  - [ ] Status changes to "Hoạt động"
  - [ ] Success notification
  - [ ] Icon changes to Lock

---

## 2. EMPLOYEE MANAGEMENT - CRUD

### 2.1 Create Employee
- [ ] Click "Thêm nhân viên" navigates to form
- [ ] Form displays all fields
- [ ] Name validation (required, 2-100 chars)
- [ ] Email validation (format)
- [ ] Phone validation (Vietnamese format)
- [ ] Position validation (max 100 chars)
- [ ] Organization dropdown loads
- [ ] Select organization → Department dropdown enables
- [ ] Department dropdown loads based on organization
- [ ] Submit with valid data → Success
  - [ ] Redirects to /employees
  - [ ] Success notification
  - [ ] Employee in list
- [ ] Cancel button goes back

### 2.2 View Employees
- [ ] Table displays employees
- [ ] Search works
- [ ] Pagination works
- [ ] Click row navigates to detail

### 2.3 Edit Employee
- [ ] Navigate to edit (/employees/edit/:id)
- [ ] Form pre-filled with data
- [ ] Can update fields
- [ ] Submit → Success
  - [ ] Redirects to list
  - [ ] Success notification
- [ ] Cancel goes back

### 2.4 Delete Employee
- [ ] Delete button/action available
- [ ] Confirmation modal
- [ ] Confirm → Employee deleted

---

## 3. PERMISSION-BASED UI

### 3.1 Admin User
- [ ] Login as Admin
- [ ] Can see "Thêm tài khoản" button
- [ ] Can see all action buttons (Sửa, Xóa, Lock)
- [ ] Can create users
- [ ] Can edit users
- [ ] Can delete users
- [ ] Can lock/unlock users

### 3.2 Regular User
- [ ] Login as USER role
- [ ] Cannot see "Thêm tài khoản" button
- [ ] Cannot see Sửa button
- [ ] Cannot see Xóa button
- [ ] Cannot see Lock/Unlock button
- [ ] Can view employee list
- [ ] Cannot see "Thêm nhân viên" button

### 3.3 HR Manager
- [ ] Login as HR_MANAGER
- [ ] Can view users (no create/delete)
- [ ] Can manage employees fully
- [ ] Can create employees
- [ ] Can edit employees
- [ ] Can manage departments

---

## 4. MOBILE RESPONSIVENESS

### 4.1 Mobile (375px - iPhone SE)
- [ ] Navigation accessible
- [ ] Tables scroll horizontally
- [ ] All buttons accessible
- [ ] Modals fit screen
- [ ] Forms full width
- [ ] Text readable
- [ ] No horizontal scroll on pages
- [ ] Touch targets ≥ 44x44px

### 4.2 Mobile (414px - iPhone 12 Pro)
- [ ] Same as above
- [ ] More comfortable spacing

### 4.3 Tablet (768px - iPad)
- [ ] 2-column layouts work
- [ ] Tables show more columns
- [ ] Better spacing
- [ ] Optimal form width

### 4.4 Tablet (1024px - iPad Pro)
- [ ] Full sidebar visible
- [ ] Multi-column layouts
- [ ] More table columns visible

### 4.5 Desktop (1280px+)
- [ ] Full layout visible
- [ ] All features accessible
- [ ] Optimal spacing

---

## 5. ACCESSIBILITY - KEYBOARD

### 5.1 Keyboard Navigation
- [ ] Tab through entire page
  - [ ] Focus visible on all elements
  - [ ] Tab order logical
  - [ ] No keyboard traps
- [ ] Forms keyboard accessible
  - [ ] Tab to inputs
  - [ ] Enter submits
  - [ ] Arrow keys in dropdowns
  - [ ] Space toggles checkboxes
- [ ] Modals keyboard accessible
  - [ ] Tab trapped in modal
  - [ ] Escape closes modal
  - [ ] Focus returns after close
- [ ] Buttons keyboard accessible
  - [ ] Enter activates
  - [ ] Space activates
- [ ] Tables keyboard accessible
  - [ ] Tab through actions

### 5.2 Focus Indicators
- [ ] All interactive elements show focus
- [ ] Focus outline visible
- [ ] Focus outline has good contrast
- [ ] Custom focus styles (if any) visible

---

## 6. ACCESSIBILITY - SCREEN READER

### 6.1 NVDA/ChromeVox Testing
- [ ] Page title announced
- [ ] Headings announced (h1, h2, h3)
- [ ] Links announced with text
- [ ] Buttons announced with label
- [ ] Form labels announced
- [ ] Form errors announced
- [ ] Required fields announced
- [ ] Success notifications announced
- [ ] Error notifications announced
- [ ] Table headers announced
- [ ] Loading states announced

### 6.2 ARIA Attributes (DevTools Check)
- [ ] Inputs have labels or aria-label
- [ ] Required fields have aria-required
- [ ] Invalid fields have aria-invalid
- [ ] Errors have aria-describedby
- [ ] Buttons have aria-label (icon buttons)
- [ ] Modals have role="dialog"
- [ ] Modals have aria-modal="true"
- [ ] Notifications have role="alert"

---

## 7. ACCESSIBILITY - VISUAL

### 7.1 Color Contrast
- [ ] Run Lighthouse accessibility audit
- [ ] Normal text ≥ 4.5:1 contrast
- [ ] Large text ≥ 3:1 contrast
- [ ] UI components ≥ 3:1 contrast
- [ ] Error messages visible
- [ ] Placeholder text readable
- [ ] Disabled states distinguishable

### 7.2 Semantic HTML
- [ ] Proper heading hierarchy (no skips)
- [ ] Lists use proper tags (ul, ol, li)
- [ ] Navigation uses <nav>
- [ ] Main content uses <main>
- [ ] Buttons are <button>
- [ ] Links are <a> with href

### 7.3 Images
- [ ] All images have alt text
- [ ] Decorative images have alt=""
- [ ] Icons have aria-label

---

## 8. ERROR HANDLING

### 8.1 Network Errors
- [ ] 500 error → Shows error notification
- [ ] 503 error → Shows "service unavailable"
- [ ] Network timeout → Shows timeout message
- [ ] No internet → Shows connection error
- [ ] Retry button works

### 8.2 Client Errors
- [ ] 400 Bad Request → Shows validation error
- [ ] 401 Unauthorized → Shows "please login"
- [ ] 403 Forbidden → Shows permission denied
- [ ] 404 Not Found → Shows not found
- [ ] 422 Validation → Shows field errors
- [ ] 429 Rate Limit → Shows "too many requests"

### 8.3 Form Validation
- [ ] Client-side validation before submit
- [ ] Backend validation errors map to fields
- [ ] Inline errors display
- [ ] Multiple field errors show
- [ ] Error messages in Vietnamese

---

## 9. CROSS-BROWSER

### 9.1 Chrome
- [ ] All features work
- [ ] UI renders correctly
- [ ] No console errors

### 9.2 Firefox
- [ ] All features work
- [ ] UI renders correctly
- [ ] No console errors

### 9.3 Safari
- [ ] All features work
- [ ] UI renders correctly
- [ ] No console errors

### 9.4 Edge
- [ ] All features work
- [ ] UI renders correctly
- [ ] No console errors

---

## 10. PERFORMANCE

- [ ] Pages load < 3 seconds
- [ ] No layout shifts (CLS)
- [ ] Smooth scrolling
- [ ] Animations smooth (60fps)
- [ ] No memory leaks
- [ ] Images optimized
- [ ] API calls efficient

---

## SUMMARY

### Results
- **Total Tests:** _____
- **Passed:** _____ ✅
- **Failed:** _____ ❌
- **Blocked:** _____ ⚠️
- **Pass Rate:** _____% 

### Critical Issues Found
1. _________________________________
2. _________________________________
3. _________________________________

### Notes
_________________________________________
_________________________________________
_________________________________________

### Sign-off
- **Tester:** _________________ 
- **Date:** _________________
- **Status:** [ ] PASS [ ] FAIL
