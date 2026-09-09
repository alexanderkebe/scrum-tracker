'use client';
import AppLoader from '@/components/AppLoader';
import AuthBrand from '@/components/AuthBrand';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, BarChart3, Eye, EyeOff, LockKeyhole, Mail, MousePointer2, TriangleAlert, UsersRound } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { startGoogleSignIn } from '@/lib/google-auth';
import styles from './auth.module.css';

const GoogleIcon = () => <svg aria-hidden="true" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.19-.19-1.69H12v3.45h5.38c-.11.86-.71 2.16-2.04 3.03l-.02.12 2.97 2.3.21.02c1.93-1.78 2.85-4.4 2.85-7.23Z"/><path fill="#34A853" d="M12 21.75c2.63 0 4.84-.86 6.45-2.29l-3.07-2.44c-.82.57-1.92.97-3.38.97-2.58 0-4.77-1.7-5.55-4.06l-.11.01-3.09 2.39-.04.1A9.75 9.75 0 0 0 12 21.75Z"/><path fill="#FBBC05" d="M6.45 13.93A5.87 5.87 0 0 1 6.14 12c0-.67.12-1.33.3-1.93v-.13l-3.12-2.42-.1.05A9.75 9.75 0 0 0 2.25 12c0 1.6.38 3.1.97 4.43l3.23-2.5Z"/><path fill="#EA4335" d="M12 6.01c1.84 0 3.08.8 3.79 1.46l2.77-2.7C16.83 3.16 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.78 5.32l3.22 2.5C7.23 7.7 9.42 6.01 12 6.01Z"/></svg>;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <div className={styles.loginGlow} />
      <div className={styles.loginDots} aria-hidden="true" />
      <div className={styles.heroContent}>
        <AuthBrand light />
        <h1 className={styles.loginHeroTitle}>Keep every sprint<br /><span className={styles.heroEmphasis}>moving forward.</span></h1>
        <p className={styles.loginHeroSubtitle}>A focused workspace for your team&apos;s planning,<br className={styles.desktopBreak} /> standups, tasks, and progress.</p>
        <div className={styles.loginFeatureList}>
          <div className={styles.loginFeature}>
            <span><UsersRound /></span><div><strong>Run focused ceremonies</strong><small>Plan, stand up, and review with clarity.</small></div>
          </div>
          <div className={styles.loginFeature}>
            <span><BarChart3 /></span><div><strong>See sprint momentum</strong><small>Track progress in real time.</small></div>
          </div>
          <div className={styles.loginFeature}>
            <span><TriangleAlert /></span><div><strong>Surface blockers early</strong><small>Keep your team unblocked and moving.</small></div>
          </div>
        </div>
        <div className={styles.boardSketch} aria-hidden="true">
          <div className={styles.boardTop}><i /><i /><i /></div>
          <div className={styles.boardColumns}>
            <div><b>TO DO</b><span /><span /><span /></div>
            <div><b>IN PROGRESS</b><span /><span className={styles.highlightTask} /></div>
            <div><b>DONE</b><span /><span /></div>
          </div>
          <MousePointer2 className={styles.boardCursor} />
        </div>
        <div className={styles.ideaNote} aria-hidden="true">Ideas<br />→ Progress<br />→ Results</div>
        <div className={styles.sprintNote} aria-hidden="true">Better sprints.<br />Stronger teams.<i /></div>
      </div>
    </aside>
    <main className={styles.authForm}>
      <div className={`${styles.formContainer} ${styles.loginCard}`}>
        <AuthBrand />

        {/* Mobile-only hero title */}
        <h2 className={styles.mobileTitle}>Welcome back!</h2>
        <p className={styles.mobileSubtitle}>Turn plans into progress, together.</p>

        {/* Desktop title */}
        <h2 className={styles.loginFormTitle}>Sign in to Scrum Tracker</h2>
        <p className={styles.loginFormSubtitle}>Continue with your workspace account.</p>

        {error && <div className={styles.errorBox} role="alert">{error}</div>}

        {/* Google + divider wrapped so mobile can reorder them below the form */}
        <div className={styles.oauthBlock}>
          <button type="button" className={styles.googleButton} onClick={handleGoogle} disabled={googleLoading || loading}>{googleLoading ? <AppLoader inline label="Opening Google…" /> : <><GoogleIcon />Continue with Google</>}</button>
        </div>
        <div className={`${styles.divider} ${styles.dividerBlock}`}><span className={styles.dividerDesktopText}>or continue with email</span><span className={styles.dividerMobileText}>or continue with</span></div>

        <form className={`${styles.loginFormFields} ${styles.formBlock}`} onSubmit={handleSubmit}>
          <div className={styles.loginField}>
            <label htmlFor="login-email">Work email</label>
            <div className={styles.inputShell}><Mail aria-hidden="true" /><input id="login-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required /></div>
          </div>
          <div className={styles.loginField}>
            <label htmlFor="login-password">Password</label>
            <div className={styles.inputShell}><LockKeyhole aria-hidden="true" /><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" required /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff /> : <Eye />}</button></div>
          </div>
          <div className={styles.rememberRow}>
            <label className={styles.rememberLabel}><input type="checkbox" defaultChecked /> Remember me</label>
            <Link href="/login" className={styles.forgotLink}>Forgot password?</Link>
          </div>
          <button type="submit" className={styles.loginSubmit} disabled={loading || googleLoading}>{loading ? <AppLoader inline label="Signing in…" /> : <><span>Sign in</span><ArrowRight className={styles.submitArrow} /></>}</button>
        </form>

        <p className={styles.loginFooter}>New to Scrum Tracker? <Link href="/register" className={styles.formLink}>Create an account</Link></p>

        {/* Mobile-only board illustration + tagline */}
        <div className={styles.mobileFooterDecor} aria-hidden="true">
          <div className={styles.mobileFooterRow}>
            <div className={styles.boardSketch}>
              <div className={styles.boardTop}><i /><i /><i /></div>
              <div className={styles.boardColumns}>
                <div><b>TO DO</b><span /><span /><span /></div>
                <div><b>IN PROGRESS</b><span /><span className={styles.highlightTask} /></div>
                <div><b>DONE</b><span /><span /></div>
              </div>
            </div>
            <div className={styles.mobileFooterNote}>Plan<br />Collaborate<br />Deliver</div>
          </div>
          <p className={styles.mobileTagline}>Better sprints. Stronger teams.</p>
        </div>
      </div>
    </main>
  </div>;
}
