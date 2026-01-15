# Clerk OTP Authentication Guide

**Sources:**
- https://clerk.com/docs/custom-flows/email-sms-otp
- https://clerk.com/blog/otp-authentication-nextjs

**Note:** This project uses Vite + React frontend with Express.js backend. Adapt the patterns below accordingly.

## Overview

Clerk enables passwordless authentication through one-time passwords (OTPs) sent via email or SMS.

## Setup Requirements

1. Enable SMS/Email OTP in Clerk Dashboard:
   - Navigate to User & Authentication > Phone tab
   - Enable "Sign-up with phone" and "Sign-in with phone"
   - Or navigate to Email tab for email OTP

2. Phone numbers must be in **E.164 format** (e.g., +14155551234)

## Vite + React Integration

### Installation

```bash
npm install @clerk/clerk-react
```

### Environment Variables

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

For Express backend:
```env
CLERK_SECRET_KEY=sk_test_...
```

### ClerkProvider Setup (Vite + React)

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
```

### Protected Routes (React Router)

```tsx
// src/App.tsx
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChatInterface } from './application/shell/ChatCenter';
import { SignInPage } from './auth/SignInPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route
          path="/*"
          element={
            <>
              <SignedIn>
                <ChatInterface />  {/* Direct to chat after login */}
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

## Custom OTP Sign-In Flow (React)

```tsx
// src/auth/SignInPage.tsx
import * as React from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

export function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const navigate = useNavigate();

  // Step 1: Request OTP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      const { supportedFirstFactors } = await signIn.create({
        identifier: email,
      });

      const emailCodeFactor = supportedFirstFactors?.find(
        (factor) => factor.strategy === 'email_code'
      );

      if (emailCodeFactor && 'emailAddressId' in emailCodeFactor) {
        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: emailCodeFactor.emailAddressId,
        });
        setPendingVerification(true);
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  // Step 2: Verify OTP
  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/');  // Navigate to chat interface
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  if (pendingVerification) {
    return (
      <form onSubmit={handleVerification}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter verification code"
        />
        <button type="submit">Verify</button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="analyst@company.com"
      />
      <button type="submit">Send Code</button>
    </form>
  );
}
```

## Express.js Backend Integration

### Installation

```bash
npm install @clerk/express
```

### Middleware Setup

```typescript
// src/core/middleware.ts
import { clerkMiddleware, requireAuth } from '@clerk/express';

// Add to Express app
app.use(clerkMiddleware());

// Protect routes
app.use('/api/*', requireAuth());
```

### Getting User in Routes

```typescript
// src/application/applications.routes.ts
import { getAuth } from '@clerk/express';

router.get('/applications', (req, res) => {
  const { userId } = getAuth(req);

  // userId is the Clerk user ID - use for RLS
  const applications = await db
    .from('applications')
    .select('*')
    .eq('analyst_id', userId);

  res.json(applications);
});
```

## SMS OTP Variant

For SMS instead of email:

```tsx
// Use phone number instead of email
const { supportedFirstFactors } = await signIn.create({
  identifier: phoneNumber,  // E.164 format: +14155551234
});

const phoneCodeFactor = supportedFirstFactors?.find(
  (factor) => factor.strategy === 'phone_code'
);

if (phoneCodeFactor && 'phoneNumberId' in phoneCodeFactor) {
  await signIn.prepareFirstFactor({
    strategy: 'phone_code',
    phoneNumberId: phoneCodeFactor.phoneNumberId,
  });
}
```

## Security Features

- JWT tokens with 60-second lifetime, automatic refresh every 50 seconds
- bcrypt password hashing
- HaveIBeenPwned database integration
- NIST Special Publication 800-63B compliance

## Whitelist Configuration

Configure allowed analyst emails in Clerk Dashboard:
1. Go to User & Authentication > Restrictions
2. Enable "Allowlist" mode
3. Add approved analyst email addresses
