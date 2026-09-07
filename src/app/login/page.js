'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { startGoogleSignIn } from '@/lib/google-auth';
import { BRAND_LOGOS } from '@/lib/logos';
import styles from './auth.module.css';

const GoogleIcon = () => <svg aria-hidden="true" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.19-.19-1.69H12v3.45h5.38c-.11.86-.71 2.16-2.04 3.03l-.02.12 2.97 2.3.21.02c1.93-1.78 2.85-4.4 2.85-7.23Z"/><path fill="#34A853" d="M12 21.75c2.63 0 4.84-.86 6.45-2.29l-3.07-2.44c-.82.57-1.92.97-3.38.97-2.58 0-4.77-1.7-5.55-4.06l-.11.01-3.09 2.39-.04.1A9.75 9.75 0 0 0 12 21.75Z"/><path fill="#FBBC05" d="M6.45 13.93A5.87 5.87 0 0 1 6.14 12c0-.67.12-1.33.3-1.93v-.13l-3.12-2.42-.1.05A9.75 9.75 0 0 0 2.25 12c0 1.6.38 3.1.97 4.43l3.23-2.5Z"/><path fill="#EA4335" d="M12 6.01c1.84 0 3.08.8 3.79 1.46l2.77-2.7C16.83 3.16 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.78 5.32l3.22 2.5C7.23 7.7 9.42 6.01 12 6.01Z"/></svg>;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(''); setLoading(true);
    try { await login(email, password); router.push('/'); } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  const handleGoogle = async () => {
    setError(''); setGoogleLoading(true);
    try { await startGoogleSignIn(); } catch (err) { setError(err.message); setGoogleLoading(false); }
  };

  return <div className={styles.authPage}>
    <aside className={styles.authHero}>
      <div className={styles.heroContent}>
        <div className={styles.heroLogoWrapper}><img src={BRAND_LOGOS.onDark.full} alt="Systems Edge Solutions" className={styles.heroLogoImg} /></div>
        <p className={styles.eyebrow}>SCRUM TRACKER</p>
        <h1 className={styles.heroTitle}>Keep every sprint moving forward.</h1>
        <p className={styles.heroSubtitle}>One calm, focused workspace for your team&apos;s ceremonies, tasks, and progress.</p>
        <div className={styles.heroFeatures}>
          <div className={styles.heroFeature}><span>01</span> Run focused ceremonies</div>
          <div className={styles.heroFeature}><span>02</span> See sprint momentum</div>
          <div className={styles.heroFeature}><span>03</span> Surface blockers early</div>
        </div>
      </div>
    </aside>
    <main className={styles.authForm}>
      <div className={styles.formContainer}>
        <div className={styles.formBrand}>
          <div className={styles.formIconBadge}><img src={BRAND_LOGOS.onLight.icon} alt="Systems Edge Solutions icon" className={styles.formIconImg} /></div>
          <img src={BRAND_LOGOS.onLight.full} alt="Systems Edge Solutions" className={styles.formWordmark} />
        </div>
        <p className={styles.formEyebrow}>WELCOME BACK</p>
        <h2 className={styles.formTitle}>Sign in to your workspace</h2>
        <p className={styles.formSubtitle}>Use your work email to continue.</p>
        {error && <div className={styles.errorBox} role="alert">{error}</div>}
        <button type="button" className={styles.googleButton} onClick={handleGoogle} disabled={googleLoading || loading}><GoogleIcon />{googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}</button>
        <div className={styles.divider}><span>or continue with email</span></div>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="form-label" htmlFor="login-email">Work email</label><input id="login-email" type="email" autoComplete="email" className="form-input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /></div>
          <div className="form-group"><label className="form-label" htmlFor="login-password">Password</label><input id="login-password" type="password" autoComplete="current-password" className="form-input" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /></div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading || googleLoading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className={styles.formFooter}>New to Scrum Tracker? <Link href="/register" className={styles.formLink}>Create an account</Link></p>
      </div>
    </main>
  </div>;
}
