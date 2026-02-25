# React Frontend Foundation

![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat&logo=react&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)

A production-ready React frontend foundation with complete authentication, user management, and role-based access control. Perfect starting point for any web application.

---

## 🎯 Features

- ✅ **User Registration & Login**
- ✅ **JWT Authentication** - Access & Refresh tokens
- ✅ **Email Verification**
- ✅ **Password Reset**
- ✅ **Profile Management** - With picture upload
- ✅ **Role-Based Access Control** - User & Admin
- ✅ **Admin Panel** - User management
- ✅ **Dark/Light Theme** - Persisted in localStorage
- ✅ **Responsive Design** - Mobile-first
- ✅ **Protected Routes**
- ✅ **Error Boundaries**
- ✅ **Modern UI Components**

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Backend API running

### Installation

```bash
# Clone repository
git clone https://github.com/saadamir1/mushaf-platform-FE.git
cd mushaf-platform-FE

# Install dependencies
npm install

# Start development server
npm start
```

App runs on: **http://localhost:3001**

---

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── ErrorBoundary.js       # Error handling
│   ├── Layout.js              # App layout
│   ├── Navbar.js              # Navigation
│   ├── Loader.js              # Loading state
│   └── PrivateRoute.js        # Protected routes
├── context/
│   ├── AuthContext.js         # Authentication
│   └── ThemeContext.js        # Dark mode
├── pages/
│   ├── Login.js               # Login
│   ├── Register.js            # Register
│   ├── Profile.js             # Profile
│   ├── Admin.js               # Admin panel
│   └── NotFound.js            # 404
├── services/
│   └── api.js                 # API calls
├── styles/
│   ├── theme.js               # Theme
│   └── modern.css             # Styles
└── utils/
    ├── constants.js           # Constants
    └── helpers.js             # Helpers
```

---

## 🔧 Configuration

### Environment Variables
Create `.env` file:
```env
PORT=3001
REACT_APP_API_URL=http://localhost:3000/api/v1
```

### API Configuration
Edit `src/utils/constants.js`:
```javascript
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL,
  TIMEOUT: 30000,
};
```

---

## 🎨 Design System

### Color Variables
All colors use CSS variables:
```css
--primary-color
--accent-color
--secondary-color
--bg-color
--card-bg
```

### Components
```jsx
import { Button, Card, EmptyState } from './components/ui';

<Button variant="primary" loading={isLoading}>
  Submit
</Button>
```

---

## 📱 Pages

| Page | Route | Access |
|------|-------|--------|
| Login | `/login` | Public |
| Register | `/register` | Public |
| Profile | `/profile` | Private |
| Admin | `/admin` | Admin only |
| 404 | `/404` | Public |

---

## 🛠️ Available Scripts

```bash
npm start              # Dev server
npm run build          # Production build
npm test               # Tests
```

---

## 🔐 Authentication Flow

1. **Register** - Create account
2. **Email Verify** - Click link in email
3. **Login** - Get JWT tokens
4. **Auto Refresh** - Token refreshes automatically
5. **Protected Routes** - Access based on role

---

## 🎨 Customization

### Change Theme Colors
Edit `src/styles/theme.js`:
```javascript
export const lightTheme = {
  primary: '#0d7377',
  accent: '#fca311',
  // ...
};
```

### Add New Pages
1. Create page in `src/pages/`
2. Add route in `src/App.js`:
```jsx
const NewPage = React.lazy(() => import("./pages/NewPage"));
<Route path="/new" element={<PrivateRoute><NewPage /></PrivateRoute>} />
```

---

## 📦 Dependencies

- React 18
- React Router 6
- Axios
- CSS Variables for theming

---

## 🌍 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## 📄 License

MIT License

---

## 👤 Developer

**Saad Amir** - [GitHub](https://github.com/saadamir1)

---

*Forked from Mushaf Platform - Clean foundation without Quran features*
