'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTyme } from '@/app/providers';
import LoginScreen from '@/components/LoginScreen';

/**
 * Public auth route. Renders the shared LoginScreen (Google + email/password) and
 * forwards an authenticated visitor straight into the app, mirroring the auto-redirect
 * behavior of the landing-page CTA.
 */
export default function LoginPage() {
  const { user, authLoading, handleLogin } = useTyme();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) router.replace('/calendar');
  }, [authLoading, user, router]);

  return <LoginScreen onLoginSuccess={handleLogin} />;
}
