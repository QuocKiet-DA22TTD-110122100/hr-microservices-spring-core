# 📊 Sơ đồ Cấu trúc Frontend

## 🏗️ Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND APPLICATION                    │
│                    (React + TypeScript)                      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   UI Layer   │    │ State Layer  │    │  API Layer   │
│  (Pages &    │◄───┤  (Zustand)   │───►│  (Axios)     │
│  Components) │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
        │                                        │
        │                                        │
        ▼                                        ▼
┌──────────────┐                      ┌──────────────┐
│ Utils Layer  │                      │   Backend    │
│ (Helpers)    │                      │   API        │
└──────────────┘                      └──────────────┘
```

---

## 📁 Cấu trúc thư mục chi tiết

```
frontend/
│
├── 📄 index.html                    # HTML template chính
├── 📄 package.json                  # Dependencies & scripts
├── 📄 vite.config.ts               # Vite configuration
├── 📄 tsconfig.json                # TypeScript config
├── 📄 tailwind.config.js           # Tailwind CSS config
├── 📄 .eslintrc.cjs                # ESLint rules
├── 📄 .gitignore                   # Git ignore rules
│
├── 📂 public/                       # Static assets
│   └── vite.svg
│
└── 📂 src/                          # Source code
    │
    ├── 📄 main.tsx                  # ⭐ Entry point
    ├── 📄 App.tsx                   # ⭐ Main app component
    ├── 📄 index.css                 # Global styles
    ├── 📄 vite-env.d.ts            # Vite types
    │
    ├── 📂 api/                      # 🌐 API Services
    │   ├── auth.api.ts             # Authentication APIs
    │   ├── employee.api.ts         # Employee APIs
    │   └── department.api.ts       # Department APIs
    │
    ├── 📂 components/               # 🧩 React Components
    │   │
    │   ├── 📂 Layout/              # Layout components
    │   │   └── MainLayout.tsx      # Main app layout
    │   │
    │   └── 📂 UI/                  # Reusable UI components
    │       ├── Button.tsx          # Button component
    │       ├── Input.tsx           # Input component
    │       ├── Table.tsx           # Table component
    │       └── Modal.tsx           # Modal component
    │
    ├── 📂 pages/                    # 📄 Page Components
    │   ├── LoginPage.tsx           # Login screen
    │   ├── RegisterPage.tsx        # Register screen
    │   ├── ForgotPasswordPage.tsx  # Forgot password
    │   ├── DashboardPage.tsx       # Dashboard
    │   ├── EmployeeListPage.tsx    # Employee list
    │   ├── DepartmentListPage.tsx  # Department list
    │   ├── ProfilePage.tsx         # User profile
    │   └── ChangePasswordPage.tsx  # Change password
    │
    ├── 📂 store/                    # 💾 State Management
    │   ├── authStore.ts            # Auth state (user, tokens)
    │   └── uiStore.ts              # UI state (notifications)
    │
    ├── 📂 types/                    # 📝 TypeScript Types
    │   ├── common.ts               # Common types
    │   ├── auth.ts                 # Auth types
    │   ├── employee.ts             # Employee types
    │   └── department.ts           # Department types
    │
    └── 📂 utils/                    # 🛠️ Utility Functions
        ├── axios.ts                # Axios config & interceptors
        ├── storage.ts              # localStorage helpers
        └── format.ts               # Format helpers
```

---

## 🔄 Luồng dữ liệu (Data Flow)

### 1. User Login Flow

```
┌─────────────┐
│    User     │
│ (Nhập form) │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  LoginPage.tsx  │ ◄─── Component
│  - Form UI      │
│  - Validation   │
└────────┬────────┘
         │ onSubmit
         ▼
┌─────────────────┐
│ authApi.login() │ ◄─── API Service
│ POST /api/auth  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Axios Client   │ ◄─── HTTP Client
│  + JWT Token    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend API    │
│  Spring Boot    │
└────────┬────────┘
         │ Response
         ▼
┌─────────────────┐
│  authStore      │ ◄─── State Management
│  - setUser()    │
│  - setTokens()  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  localStorage   │ ◄─── Persistence
│  - accessToken  │
│  - refreshToken │
│  - user         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Navigate to    │
│  Dashboard      │
└─────────────────┘
```

### 2. Protected Route Flow

```
User truy cập /employees
         │
         ▼
┌─────────────────────┐
│   React Router      │
│   <Route path=...>  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   PrivateRoute      │
│   Check auth?       │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐  ┌──────────────┐
│  FALSE  │  │    TRUE      │
│ Redirect│  │ Render Page  │
│ /login  │  │              │
└─────────┘  └──────────────┘
```

### 3. API Call with Auto Refresh Token

```
Component gọi API
         │
         ▼
┌─────────────────────┐
│  employeeApi.getAll │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Axios Interceptor  │
│  + Authorization    │
│    Bearer {token}   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Backend API       │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐  ┌──────────────┐
│ 401     │  │  200 OK      │
│ Expired │  │  Return data │
└────┬────┘  └──────┬───────┘
     │              │
     ▼              ▼
┌─────────────┐  ┌──────────────┐
│ Refresh     │  │  Component   │
│ Token API   │  │  Update UI   │
└──────┬──────┘  └──────────────┘
       │
       ▼
┌─────────────┐
│ Save new    │
│ token       │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Retry       │
│ original    │
│ request     │
└─────────────┘
```

---

## 🧩 Component Hierarchy

### Main App Structure

```
App.tsx
│
├── BrowserRouter
│   │
│   ├── Notification Container (Toast)
│   │
│   └── Routes
│       │
│       ├── /login ──────────► LoginPage
│       ├── /register ───────► RegisterPage
│       ├── /forgot-password ► ForgotPasswordPage
│       │
│       └── PrivateRoute (Protected)
│           │
│           ├── / ──────────────────► DashboardPage
│           ├── /employees ─────────► EmployeeListPage
│           ├── /departments ───────► DepartmentListPage
│           ├── /profile ───────────► ProfilePage
│           └── /change-password ───► ChangePasswordPage
```

### MainLayout Structure

```
MainLayout.tsx
│
├── Header (Fixed Top)
│   ├── Toggle Sidebar Button
│   ├── App Title
│   └── User Menu
│       ├── User Name
│       └── Logout Button
│
├── Sidebar (Fixed Left)
│   ├── Navigation Menu
│   │   ├── Dashboard
│   │   ├── Employees
│   │   └── Departments
│   │
│   └── User Menu
│       ├── Profile
│       └── Change Password
│
└── Main Content Area
    └── {children} ◄─── Page content
```

### Page Component Structure

```
EmployeeListPage.tsx
│
├── MainLayout
│   │
│   └── Content
│       │
│       ├── Header Section
│       │   ├── Title
│       │   └── Add Button
│       │
│       ├── Search Section
│       │   ├── Input (Search box)
│       │   └── Button (Search)
│       │
│       ├── Table Section
│       │   └── Table Component
│       │       ├── Columns config
│       │       ├── Data
│       │       └── Loading state
│       │
│       └── Pagination Section
│           ├── Previous Button
│           ├── Page Info
│           └── Next Button
```

---

## 💾 State Management Flow

### Zustand Store Architecture

```
┌─────────────────────────────────────────┐
│           Application State              │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│  authStore   │        │   uiStore    │
├──────────────┤        ├──────────────┤
│ State:       │        │ State:       │
│ - user       │        │ - notifs     │
│ - isAuth     │        │ - isLoading  │
│ - isLoading  │        │              │
│              │        │ Actions:     │
│ Actions:     │        │ - addNotif   │
│ - setUser    │        │ - removeNotif│
│ - setTokens  │        │ - setLoading │
│ - logout     │        │              │
│ - checkAuth  │        │              │
└──────────────┘        └──────────────┘
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   React Components    │
        │   useAuthStore()      │
        │   useUIStore()        │
        └───────────────────────┘
```

### Component State vs Global State

```
┌─────────────────────────────────────────┐
│         State Management Strategy        │
└─────────────────────────────────────────┘

Local State (useState)
├── Form inputs
├── Modal open/close
├── Dropdown open/close
├── Loading states (component-specific)
└── Temporary UI state

Global State (Zustand)
├── User authentication
├── User profile data
├── Global notifications
├── Global loading
└── Shared data across pages

Server State (React Query - optional)
├── API data caching
├── Background refetching
├── Optimistic updates
└── Pagination state
```

---

## 🎨 Styling Architecture

### Tailwind CSS Utility Classes

```
Component Styling Strategy
│
├── Layout Classes
│   ├── flex, grid
│   ├── container, mx-auto
│   └── space-y-*, gap-*
│
├── Spacing Classes
│   ├── p-*, px-*, py-*
│   ├── m-*, mx-*, my-*
│   └── space-between
│
├── Typography Classes
│   ├── text-*, font-*
│   ├── leading-*, tracking-*
│   └── text-left, text-center
│
├── Color Classes
│   ├── bg-*, text-*
│   ├── border-*
│   └── hover:*, focus:*
│
├── Responsive Classes
│   ├── sm:*, md:*, lg:*, xl:*
│   └── Mobile-first approach
│
└── State Classes
    ├── hover:*
    ├── focus:*
    ├── active:*
    └── disabled:*
```

### Component Styling Example

```tsx
<button className="
  px-4 py-2           // Padding
  bg-blue-600         // Background color
  text-white          // Text color
  rounded-lg          // Border radius
  font-medium         // Font weight
  hover:bg-blue-700   // Hover state
  focus:outline-none  // Focus state
  focus:ring-2        // Focus ring
  focus:ring-blue-500 // Ring color
  disabled:opacity-50 // Disabled state
  transition-colors   // Smooth transition
">
  Click me
</button>
```

---

## 🔒 Security Architecture

### Authentication & Authorization Flow

```
┌─────────────────────────────────────────┐
│          Security Layers                 │
└─────────────────────────────────────────┘

1. Client-Side Validation
   ├── Form validation (react-hook-form)
   ├── Input sanitization
   └── Type checking (TypeScript)
          │
          ▼
2. JWT Token Management
   ├── Access Token (short-lived)
   ├── Refresh Token (long-lived)
   ├── Auto refresh on expiry
   └── Secure storage (localStorage)
          │
          ▼
3. Request Security
   ├── Authorization header
   ├── HTTPS only (production)
   ├── CORS handling
   └── Rate limiting (backend)
          │
          ▼
4. Route Protection
   ├── PrivateRoute wrapper
   ├── Auth check before render
   └── Redirect to login if needed
          │
          ▼
5. Error Handling
   ├── 401 → Refresh token
   ├── 403 → Access denied
   ├── 423 → Account locked
   └── 429 → Rate limited
```

---

## 📦 Build & Deployment Flow

```
Development
    │
    ├── npm run dev
    │   └── Vite Dev Server (Port 3000)
    │       ├── Hot Module Replacement
    │       ├── Fast refresh
    │       └── Proxy to backend
    │
    ▼
Production Build
    │
    ├── npm run build
    │   │
    │   ├── TypeScript Compile
    │   ├── Vite Build
    │   │   ├── Bundle JS
    │   │   ├── Process CSS
    │   │   ├── Optimize images
    │   │   └── Code splitting
    │   │
    │   └── Output: dist/
    │       ├── index.html
    │       ├── assets/
    │       │   ├── index-[hash].js
    │       │   └── index-[hash].css
    │       └── vite.svg
    │
    ▼
Deployment
    │
    ├── Static Hosting
    │   ├── Vercel
    │   ├── Netlify
    │   └── GitHub Pages
    │
    └── Server Hosting
        ├── Nginx
        ├── Apache
        └── Node.js
```

---

## 🧪 Testing Strategy (Recommended)

```
Testing Pyramid
    │
    ├── E2E Tests (10%)
    │   ├── Cypress / Playwright
    │   ├── Full user journeys
    │   └── Critical paths
    │
    ├── Integration Tests (30%)
    │   ├── React Testing Library
    │   ├── Component interactions
    │   └── API mocking
    │
    └── Unit Tests (60%)
        ├── Jest / Vitest
        ├── Utility functions
        ├── Custom hooks
        └── Pure components
```

---

## 📊 Performance Optimization

```
Performance Strategy
│
├── Code Splitting
│   ├── Route-based splitting
│   ├── Component lazy loading
│   └── Dynamic imports
│
├── Bundle Optimization
│   ├── Tree shaking
│   ├── Minification
│   ├── Compression (gzip)
│   └── CDN delivery
│
├── Runtime Optimization
│   ├── React.memo
│   ├── useMemo / useCallback
│   ├── Virtual scrolling
│   └── Debounce / Throttle
│
└── Asset Optimization
    ├── Image optimization
    ├── Font subsetting
    ├── CSS purging
    └── Lazy loading images
```

---

## 🔄 Development Workflow

```
1. Feature Development
   ├── Create feature branch
   ├── Implement feature
   │   ├── Create types
   │   ├── Create API service
   │   ├── Create components
   │   └── Create page
   ├── Test locally
   └── Commit changes

2. Code Review
   ├── Create Pull Request
   ├── Run CI checks
   │   ├── TypeScript check
   │   ├── ESLint
   │   └── Build test
   ├── Review by team
   └── Merge to main

3. Deployment
   ├── Build production
   ├── Run tests
   ├── Deploy to staging
   ├── QA testing
   └── Deploy to production
```

---

**Tạo bởi:** Nhóm thực tập 2026
**Mục đích:** Tài liệu kỹ thuật cho team developers
