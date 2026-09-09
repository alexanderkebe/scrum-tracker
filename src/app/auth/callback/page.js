'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import AppLoader from '@/components/AppLoader';
import styles from '../../login/auth.module.css';

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [error, setError] = useState('');
  const completion = useRef(null);

  useEffect(() => {
    const completeSignIn = async () => {
      const params = new URLSearchParams(window.location.search);
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const providerError = params.get('error') || fragment.get('error');
      const code = params.get('code');
      window.history.replaceState(null, '', '/auth/callback');
      if (providerError) {
        throw new Error(providerError === 'access_denied'
          ? 'Google sign-in was cancelled or access was denied. Please try again.'
          : 'Google could not complete sign-in. Please try again.');
      }
      if (!code) {
        throw new Error('Your Google sign-in link is missing or expired. Please start again.');
      }

      try {
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not complete Google sign-in.');
        await refreshUser();
        router.replace('/');
      } catch (err) {
        throw new Error(err.message || 'Could not complete Google sign-in.');
      }
    };

    // React may replay effects in development; exchange each OAuth code only once.
    if (!completion.current) completion.current = completeSignIn();
    completion.current.catch((err) => setError(err.message));
  }, [refreshUser, router]);

  return (
    <main className={styles.callbackPage}>
      <div className={styles.callbackCard}>
        {error ? <><h1>Sign-in failed</h1><p>{error}</p><a href="/login" className="btn btn-primary">Back to sign in</a></> : <AppLoader label="Signing you in…" />}
      </div>
    </main>
  );
}
