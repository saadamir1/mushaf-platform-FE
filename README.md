# Mushaf Platform - Frontend

![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat&logo=react&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)

Modern, responsive frontend for Mushaf Platform - Digital Quran with Urdu translations, built with React and professional UI/UX design.

> **💡 Foundation App:** This app includes complete authentication system with registration, login, JWT tokens, profile management, role-based access control, and admin panel. It's designed to be easily adapted for other projects - just remove the Quran-specific features and keep the auth foundation!

## 🔧 Foundation Features (Reusable)
- User Registration & Login
- JWT Authentication with Refresh Tokens
- Email Verification
- Password Reset
- Profile Management with Picture Upload
- Role-Based Access Control (User/Admin)
- Admin Panel for User Management
- Dark/Light Theme Support
- Responsive Design

---

## 🎯 Features

- ✅ **Modern UI/UX** - Islamic-inspired design with teal and gold accents
- ✅ **Dark Mode** - Seamless theme switching with localStorage persistence
- ✅ **Fully Responsive** - Mobile-first design, works on all devices
- ✅ **Centralized Architecture** - Reusable components, utilities, and constants
- ✅ **JWT Authentication** - Secure login with token refresh
- ✅ **Search Functionality** - Real-time search across Surahs
- ✅ **Skeleton Loaders** - Professional loading states
- ✅ **Error Boundaries** - Graceful error handling
- ✅ **Accessibility** - WCAG AA compliant, elder-friendly

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Backend API running on `http://localhost:3000`

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
│   │   ├── Button.js          # Centralized button component
│   │   ├── SearchBar.js       # Search input with clear
│   │   ├── Card.js            # Card wrapper
│   │   ├── EmptyState.js      # No results UI
│   │   ├── SkeletonLoader.js  # Loading skeletons
│   │   └── index.js           # Barrel exports
│   ├── ErrorBoundary.js       # Error handling
│   ├── Layout.js              # App layout wrapper
│   ├── Navbar.js              # Navigation bar
│   ├── Loader.js              # Full-page loader
│   └── PrivateRoute.js        # Protected routes
├── context/
│   ├── AuthContext.js         # Authentication state
│   └── ThemeContext.js        # Dark mode state
├── pages/
│   ├── Home.js                # Surah list page
│   ├── Login.js               # Login page
│   ├── SurahReader.js         # Surah reading page
│   ├── Search.js              # Search page
│   ├── Bookmarks.js           # Bookmarks page
│   └── NotFound.js            # 404 page
├── services/
│   └── api.js                 # Axios instance & API calls
├── styles/
│   ├── theme.js               # Theme constants
│   └── modern.css             # Modern component styles
├── utils/
│   ├── constants.js           # App constants
│   ├── helpers.js             # Helper functions
│   ├── hooks.js               # Custom React hooks
│   └── index.js               # Barrel exports
├── App.js                     # Root component
├── index.js                   # Entry point
└── index.css                  # Global styles
```

---

## 🎨 Design System

### Color Palette

**Light Theme:**
- Primary: `#0d7377` (Teal)
- Accent: `#fca311` (Gold)
- Secondary: `#14213d` (Deep Navy)
- Background: `#f8f9fa`

**Dark Theme:**
- Primary: `#14a085` (Light Teal)
- Accent: `#ffd60a` (Bright Gold)
- Background: `#0f1419`

### Components

**Import reusable components:**
```jsx
import { Button, SearchBar, Card, EmptyState } from '../components/ui';

// Usage
<Button variant="primary" size="lg" loading={isLoading}>
  Sign In
</Button>

<SearchBar 
  value={query} 
  onChange={handleChange}
  onClear={handleClear}
  placeholder="Search..."
/>
```

### Utilities

**Import centralized utilities:**
```jsx
import { 
  STORAGE_KEYS, 
  storage, 
  tokenHelpers, 
  validators 
} from '../utils';

// Usage
storage.set(STORAGE_KEYS.ACCESS_TOKEN, token);
const isValid = validators.isEmail(email);
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

## 🎯 Key Features

### 1. Centralized Architecture

**All constants in one place:**
- Storage keys
- API endpoints
- Error messages
- UI constants

**Reusable components:**
- Button with variants (primary, secondary, danger, outline)
- SearchBar with clear functionality
- Card with hover effects
- EmptyState for no results
- SkeletonLoader for loading states

### 2. Dark Mode

Toggle between light and dark themes:
- Persisted in localStorage
- Smooth transitions
- All components support both themes

### 3. Authentication

- JWT-based authentication
- Automatic token refresh
- Protected routes
- Remember me functionality

### 4. Responsive Design

- Mobile-first approach
- Breakpoints: 768px (mobile), 1024px (tablet)
- Touch-friendly UI
- Optimized for all screen sizes

---

## 📱 Pages

### Home Page
- Grid layout of all Surahs
- Real-time search
- Skeleton loaders
- Empty state handling

### Login Page
- Modern form design
- Show/hide password
- Remember me checkbox
- Demo credentials display

### 404 Page
- Centered error message
- "Go Home" button
- Consistent with app theme

---

## 🛠️ Available Scripts

```bash
# Development
npm start              # Start dev server (port 3001)
npm run build          # Build for production
npm test               # Run tests
npm run eject          # Eject from Create React App

# Code Quality
npm run lint           # Run ESLint (if configured)
npm run format         # Format code (if configured)
```

---

## 🎨 Styling Approach

### CSS Variables
All colors use CSS variables for theme switching:
```css
color: var(--primary-color);
background-color: var(--card-bg);
```

### Modern CSS Features
- Flexbox & Grid layouts
- CSS animations
- Smooth transitions
- Gradient backgrounds
- Box shadows

---

## 🔐 Security

- JWT tokens stored in localStorage
- Automatic token refresh
- Protected routes with PrivateRoute component
- Input validation
- XSS protection

---

## 📊 Performance

- Code splitting with React.lazy
- Suspense for lazy loading
- Optimized images
- Debounced search
- Memoized components

---

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

---

## 📝 Best Practices

1. **Always use centralized utilities**
   ```jsx
   import { STORAGE_KEYS, storage } from '../utils';
   ```

2. **Use reusable components**
   ```jsx
   import { Button, SearchBar } from '../components/ui';
   ```

3. **Follow naming conventions**
   - Components: PascalCase
   - Files: PascalCase for components
   - Utils: camelCase

4. **Keep components small and focused**
   - Single responsibility
   - Reusable and testable

---

## 🐛 Troubleshooting

### App logs out on reload
- Fixed: Token refresh interceptor updated
- Tokens now persist correctly

### Dark mode not working
- Check localStorage for 'theme' key
- Verify CSS variables are defined

### API calls failing
- Ensure backend is running on port 3000
- Check REACT_APP_API_URL in .env

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 👤 Developer

**Saad Amir** - Backend & Frontend Engineer

- 🔗 GitHub: [@saadamir1](https://github.com/saadamir1)
- 💼 LinkedIn: [linkedin.com/in/saadamir](https://linkedin.com/in/saadamir)
- 📧 Email: Saadamir070@gmail.com
- 📍 Location: Islamabad, Pakistan

---

## 🙏 Acknowledgments

- Islamic design inspiration from traditional mosque architecture
- Color palette inspired by Islamic art and calligraphy
- UI/UX patterns from modern SaaS applications
- React community for excellent documentation

---

**Built with ❤️ for the Muslim community**

*"Read in the name of your Lord who created" - Quran 96:1*
