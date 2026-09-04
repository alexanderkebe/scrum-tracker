'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import styles from '../../login/auth.module.css';

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const completeSignIn = async () => {
      const accessToken = new URLSearchParams(window.location.hash.slice(1)).get('access_token');
      if (!accessToken) {
        setError('Google did not return a valid sign-in session. Please try again.');
        return;
      }

      try {
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not complete Google sign-in.');
        await refreshUser();
        router.replace('/');
      } catch (err) {
        setError(err.message || 'Could not complete Google sign-in.');
      }
    };

    completeSignIn();
  }, [refreshUser, router]);

  return (
    <main className={styles.callbackPage}>
      <div className={styles.callbackCard}>
        {error ? <><h1>Sign-in failed</h1><p>{error}</p><a href="/login" className="btn btn-primary">Back to sign in</a></> : <><span className={styles.loadingMark} /><h1>Signing you in</h1><p>Finishing your secure Google sign-in…</p></>}
      </div>
    </main>
  );
}
