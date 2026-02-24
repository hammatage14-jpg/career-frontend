# IAS Frontend

Internship & Industrial Attachment platform — React frontend.

## Tech Stack

- **React 18** + **Vite** (fast dev server + build)
- **React Router v6** (page routing)
- **Axios** (HTTP client, all requests centralized)
- **CSS Modules** (component-scoped styles, no class conflicts)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set your backend URL
cp .env.example .env.local
# Edit .env.local → set VITE_API_URL=http://your-backend-url

# 3. Start dev server (runs on port 3000)
npm run dev

# 4. Build for production
npm run build
```

---

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── Sidebar.jsx     # Nav sidebar
│   ├── Sidebar.module.css
│   ├── Topbar.jsx      # Top bar + search + theme toggle
│   ├── Topbar.module.css
│   └── Icons.jsx       # All SVG icons
│
├── context/
│   ├── ThemeContext.jsx # Dark/light mode (global)
│   └── AuthContext.jsx  # User session (global)
│
├── hooks/
│   └── useCounter.js    # Animated number counter
│
├── pages/
│   └── Dashboard.jsx    # Main dashboard page
│
├── services/
│   └── api.js           # ← ALL backend calls go here
│
├── data/
│   └── mockData.js      # Placeholder data (replace with API calls)
│
├── styles/
│   ├── globals.css      # Design tokens + reset
│   └── dashboard.css    # Dashboard & shared component styles
│
├── App.jsx              # Root layout + routing
└── main.jsx             # Entry point
```

---

## Backend Integration

### 1. Set your API base URL

```env
# .env.local
VITE_API_URL=https://api.hamanmatage.com
```

Vite proxies all `/api/*` requests to this URL in development, so you never have CORS issues locally.

### 2. All API calls live in `src/services/api.js`

The file exports typed service groups:

```js
import { opportunityService, applicationService, dashboardService } from './services/api'

// Example usage in a component or page:
const { data } = await opportunityService.getRecommended()
const { data } = await applicationService.getAll({ status: 'pending' })
```

### 3. Replace mock data with real API calls

In each page, find the `MOCK_*` imports and swap them for actual service calls using `useEffect` + `useState`:

```jsx
// Before (mock)
import { MOCK_OPPORTUNITIES } from '../data/mockData'

// After (real API)
import { useState, useEffect } from 'react'
import { opportunityService } from '../services/api'

const [opportunities, setOpportunities] = useState([])
useEffect(() => {
  opportunityService.getRecommended().then(res => setOpportunities(res.data))
}, [])
```

### 4. Authentication

`AuthContext.jsx` handles login/logout and restores sessions via `/api/auth/me`.
Token is stored in `localStorage` under the key `ias_token` and auto-attached to every request via the Axios interceptor.

```jsx
import { useAuth } from '../context/AuthContext'

const { user, login, logout } = useAuth()
```

---

## Dark / Light Mode

Managed globally via `ThemeContext`. The `data-theme` attribute is toggled on `<html>` and CSS custom properties handle the rest — no JS needed for styling.

```jsx
import { useTheme } from '../context/ThemeContext'
const { theme, toggleTheme } = useTheme()
```

---

## Adding New Pages

1. Create `src/pages/YourPage.jsx`
2. Add it to the `renderPage()` switch in `App.jsx`
3. Add API calls in `src/services/api.js` under the appropriate service group

---

## Production Build

```bash
npm run build
# Output → dist/
# Deploy dist/ to your static host (Netlify, Vercel, Nginx, etc.)
```

For Nginx, add this to your server block to support client-side routing:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```
