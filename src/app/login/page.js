'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { startGoogleSignIn } from '@/lib/google-auth';
import { BRAND_LOGOS } from '@/lib/logos';
import styles from './auth.module.css';

const GoogleIcon = () => (
  <svg className={styles.googleIconSvg} aria-hidden="true" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.19-.19-1.69H12v3.45h5.38c-.11.86-.71 2.16-2.04 3.03l-.02.12 2.97 2.3.21.02c1.93-1.78 2.85-4.4 2.85-7.23Z"/>
    <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.86 6.45-2.29l-3.07-2.44c-.82.57-1.92.97-3.38.97-2.58 0-4.77-1.7-5.55-4.06l-.11.01-3.09 2.39-.04.1A9.75 9.75 0 0 0 12 21.75Z"/>
    <path fill="#FBBC05" d="M6.45 13.93A5.87 5.87 0 0 1 6.14 12c0-.67.12-1.33.3-1.93v-.13l-3.12-2.42-.1.05A9.75 9.75 0 0 0 2.25 12c0 1.6.38 3.1.97 4.43l3.23-2.5Z"/>
    <path fill="#EA4335" d="M12 6.01c1.84 0 3.08.8 3.79 1.46l2.77-2.7C16.83 3.16 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.78 5.32l3.22 2.5C7.23 7.7 9.42 6.01 12 6.01Z"/>
  </svg>
);

const EyeIcon = ({ visible }) => (
  <svg className={styles.togglePasswordIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {visible ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

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
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await startGoogleSignIn();
    } catch (err) {
      setError(err.message || 'Could not initiate Google sign-in.');
      setGoogleLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className={styles.authPage}>
      {/* Left Brand / Hero Section */}
      <aside className={styles.authHero}>
        <div className={styles.heroContent}>
          <div className={styles.heroLogoWrapper}>
            <img
              src={BRAND_LOGOS.onDark.full}
              alt="Systems Edge Solutions"
              className={styles.heroLogoImg}
            />
          </div>

          <p className={styles.eyebrow}>SCRUM TRACKER</p>
          <h1 className={styles.heroTitle}>Keep every sprint moving forward.</h1>
          <p className={styles.heroSubtitle}>
            One calm, focused workspace for your team&apos;s ceremonies, tasks, and progress.
          </p>

          <div className={styles.heroFeatures}>
            <div className={styles.heroFeature}>
              <span className={styles.featureNumber}>01</span>
              <div>
                <strong>Run focused ceremonies</strong>
                <p>Stand-ups, sprint planning, and reviews with structured timeboxing.</p>
              </div>
            </div>
            <div className={styles.heroFeature}>
              <span className={styles.featureNumber}>02</span>
              <div>
                <strong>See sprint momentum</strong>
                <p>Real-time burnup and velocity metrics calculated automatically.</p>
              </div>
            </div>
            <div className={styles.heroFeature}>
              <span className={styles.featureNumber}>03</span>
              <div>
                <strong>Surface blockers early</strong>
                <p>Track blockers across team roles with instant clarity.</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Form Section */}
      <main className={styles.authForm}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <div className={styles.formIconBadge}>
              <img src={BRAND_LOGOS.onLight.icon} alt="Systems Edge" className={styles.formIconImg} />
            </div>
            <p className={styles.formEyebrow}>WELCOME BACK</p>
            <h2 className={styles.formTitle}>Sign in to your workspace</h2>
            <p className={styles.formSubtitle}>Enter your credentials to access your active sprint.</p>
          </div>

          {error && (
            <div className={styles.errorBox} role="alert">
              <span className={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            className={styles.googleButton}
            onClick={handleGoogle}
            disabled={googleLoading || loading}
          >
            <GoogleIcon />
            <span>{googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}</span>
          </button>

          <div className={styles.divider}>
            <span>or continue with email</span>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" htmlFor="login-email">Work email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@systemedge.com"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="login-password">Password</label>
              </div>
              <div className={styles.passwordWrapper}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="form-input"
                  style={{ paddingRight: '42px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggleBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading || googleLoading}
            >
              {loading ? 'Signing in…' : 'Sign In to Workspace'}
            </button>
          </form>

          {/* Quick Demo Login Fill */}
          <div className={styles.demoBox}>
            <div className={styles.demoHeader}>
              <span className={styles.demoPill}>Quick Demo Access</span>
            </div>
            <div className={styles.demoButtons}>
              <button
                type="button"
                className={styles.demoBtn}
                onClick={() => fillDemo('admin@systemedge.com', 'admin123')}
                title="Fill Admin credentials"
              >
                Admin (Full Access)
              </button>
              <button
                type="button"
                className={styles.demoBtn}
                onClick={() => fillDemo('po@systemedge.com', 'admin123')}
                title="Fill Product Owner credentials"
              >
                Product Owner
              </button>
              <button
                type="button"
                className={styles.demoBtn}
                onClick={() => fillDemo('sm@systemedge.com', 'admin123')}
                title="Fill Scrum Master credentials"
              >
                Scrum Master
              </button>
            </div>
          </div>

          <p className={styles.formFooter}>
            New to Scrum Tracker?{' '}
            <Link href="/register" className={styles.formLink}>
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
