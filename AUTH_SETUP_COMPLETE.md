# Authentication Setup for Roof SOW Genesis

## Overview
The authentication system has been implemented using Supabase Auth with a comprehensive React setup.

## Files Added

### 1. **Frontend Supabase Client** (`src/lib/supabase.ts`)
- Browser-compatible Supabase client
- Session persistence enabled
- Auto-refresh tokens
- Uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables

### 2. **Auth Context Provider** (`src/contexts/AuthContext.tsx`)
- React context for authentication state management
- Functions: `signIn`, `signUp`, `signOut`, `resetPassword`
- Loading states and error handling
- Toast notifications for user feedback
- User metadata support (full_name, role)

### 3. **Login Form Component** (`src/components/auth/LoginForm.tsx`)
- Tabbed interface for sign in/sign up
- Password reset functionality
- Role selection (inspector, engineer, admin)
- Form validation and visual feedback
- Consistent styling with existing design system

## Required Environment Variables

Add these to your **Lovable environment settings**:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Integration Steps

### Step 1: Wrap App with AuthProvider
Add the AuthProvider to your main App component:

```tsx
import { AuthProvider } from '@/contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Your existing app content */}
    </AuthProvider>
  );
}
```

### Step 2: Create Auth Guard Component
Create a component to protect routes:

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';

const AuthGuard = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <LoginForm />;
  
  return children;
};
```

### Step 3: Update Existing Components
Use the auth context in existing components:

```tsx
import { useAuth } from '@/contexts/AuthContext';

const SomeComponent = () => {
  const { user, signOut } = useAuth();
  
  return (
    <div>
      <p>Welcome, {user?.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
};
```

## Database Setup

The database is already configured with:
- ✅ RLS policies on all tables
- ✅ `auth.users` references in all user-related tables
- ✅ Proper foreign key constraints

## User Roles

The system supports three roles:
- **inspector**: Field inspectors (default)
- **engineer**: Engineers who review inspections
- **admin**: System administrators

## Features

### Authentication
- ✅ Email/password sign in
- ✅ User registration with role selection
- ✅ Password reset via email
- ✅ Session persistence
- ✅ Auto token refresh
- ✅ Loading states
- ✅ Error handling with toast notifications

### Security
- ✅ Row Level Security (RLS) on all tables
- ✅ User-based data isolation
- ✅ Secure session management
- ✅ CSRF protection via Supabase

## Testing the Authentication

1. **Set Environment Variables**: Add your Supabase credentials
2. **Deploy to Lovable**: The auth system will be active
3. **Test Registration**: Create a new account
4. **Test Sign In**: Sign in with created account
5. **Test Data Access**: Verify RLS is working correctly

## Troubleshooting

### Common Issues:
1. **Missing Environment Variables**: Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
2. **RLS Errors**: Check that policies allow the authenticated user to access data
3. **Session Issues**: Clear browser storage and retry

### Debug Steps:
1. Check browser console for Supabase errors
2. Verify environment variables are loaded
3. Test database connectivity in Supabase dashboard
4. Check RLS policies are properly configured

## Next Steps

After deploying:
1. Test the complete authentication flow
2. Verify data access works correctly
3. Update any existing components to use the auth context
4. Add role-based permissions if needed

The authentication system is now ready for production use with Lovable deployment!