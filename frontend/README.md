# Frontend README

## Development Setup

### Quick Start
```bash
npm install
npm run dev
```

Application will run at: `http://localhost:3000`

## Pages

### Public Pages
- `/` - Home page
- `/auth/signup` - 14-step signup flow
- `/auth/signup/success` - Signup success page
- `/auth/signin` - Primary login
- `/auth/signin/recovery` - Multi-factor recovery flow

### Protected Pages
- `/dashboard` - SuperAdmin dashboard

## Key Components

### ProtectedRoute
Wrapper component for authenticating routes
```tsx
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>
```

### API Client
Pre-configured Axios instance with token injection:
```tsx
import { apiClient } from '@/lib/axios'

// Use apiClient for API calls
```

### Auth Store (Zustand)
Global authentication state:
```tsx
import { useAuthStore } from '@/store/auth.store'

const { isAuthenticated, user, logout } = useAuthStore()
```

## File Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles
│   ├── providers.tsx       # App providers
│   ├── auth/
│   │   ├── signup/
│   │   │   ├── page.tsx    # Complete 14-step signup
│   │   │   └── success/
│   │   │       └── page.tsx
│   │   └── signin/
│   │       ├── page.tsx    # Primary login
│   │       └── recovery/
│   │           └── page.tsx
│   └── dashboard/
│       └── page.tsx        # SuperAdmin dashboard
├── components/
│   └── ProtectedRoute.tsx  # Route protection wrapper
├── lib/
│   └── axios.ts            # API client configuration
└── store/
    └── auth.store.ts       # Zustand auth store
```

## Signup Flow (14 Steps)

1. Basic Information
2. Alternative Contact
3. Password Setup
4. Security Question
5. Government ID
6. Secondary Approver
7. Review Information
8. Google Authenticator Setup
9. Authenticator Verification
10. Backup Codes
11. Recovery Code
12. Final Security Setup
13. Final Review
14. Account Created

## Signin Flow (8 Steps)

1. Primary Login (Email/Phone/UserID + Password)
2. Alternative Contact OTP
3. Google Authenticator Code
4. Recovery Code
5. Backup Code
6. Security Question
7. Government ID
8. Secondary Approval

## Styling

Using Tailwind CSS with custom utilities defined in `globals.css`:
- `.btn` - Button base styles
- `.btn-primary` - Blue button
- `.btn-secondary` - Gray button
- `.input` - Input field styles
- `.card` - Card component
- `.badge` - Badge components

## API Integration

All API calls are handled through `apiClient` which:
- Automatically includes JWT token in headers
- Handles 401 responses (token refresh)
- Provides proper error handling

## Build & Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

### Type Checking
```bash
npm run type-check
```

## Environment Variables

### Development (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Production
Update `NEXT_PUBLIC_API_URL` to your production backend URL.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with same versions

## Performance

- App Router for optimized routing
- Server-side rendering
- Automatic code splitting
- Image optimization
- CSS optimization

## Troubleshooting

### API Connection Error
Ensure `NEXT_PUBLIC_API_URL` in `.env.local` points to running backend.

### Build Errors
```bash
npm run type-check  # Check TypeScript errors
npm run lint        # Check ESLint issues
```

### Port Already in Use
Default port is 3000. Change with:
```bash
npm run dev -- -p 3001
```

## Security

- XSS protection via React's built-in sanitization
- CSRF protection from httpOnly cookies (when configured)
- Secure token storage in localStorage
- Automatic token injection in API calls
- Protected routes validation
