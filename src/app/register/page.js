'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { startGoogleSignIn } from '@/lib/google-auth';
import { BRAND_LOGOS } from '@/lib/logos';
import styles from '../login/auth.module.css';

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
        <path d="M1 backward" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Could not create your account.');
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

          <p className={styles.eyebrow}>YOUR TEAM&apos;S HOME</p>
          <h1 className={styles.heroTitle}>Make progress visible together.</h1>
          <p className={styles.heroSubtitle}>
            Bring planning, stand-ups, and sprint delivery into one shared high-performing rhythm.
          </p>

          <div className={styles.heroFeatures}>
            <div className={styles.heroFeature}>
              <span className={styles.featureNumber}>01</span>
              <div>
                <strong>Align on priorities</strong>
                <p>Every team member clear on the sprint goal and story points.</p>
              </div>
            </div>
            <div className={styles.heroFeature}>
              <span className={styles.featureNumber}>02</span>
              <div>
                <strong>Build momentum together</strong>
                <p>Role-based views for Product Owners, Scrum Masters, and Devs.</p>
              </div>
            </div>
            <div className={styles.heroFeature}>
              <span className={styles.featureNumber}>03</span>
              <div>
                <strong>Learn after every sprint</strong>
                <p>Actionable retrospectives and velocity charts that drive continuous improvement.</p>
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
            <p className={styles.formEyebrow}>GET STARTED</p>
            <h2 className={styles.formTitle}>Create your account</h2>
            <p className={styles.formSubtitle}>Join Systems Edge Solutions Agile workspace in seconds.</p>
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
            <span>{googleLoading ? 'Redirecting to Google…' : 'Sign up with Google'}</span>
          </button>

          <div className={styles.divider}>
            <span>or sign up with email</span>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" htmlFor="register-name">Full name</label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Johnson"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" htmlFor="register-email">Work email</label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@systemedge.com"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" htmlFor="register-password">Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="form-input"
                  style={{ paddingRight: '42px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
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
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Must be at least 6 characters.
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading || googleLoading}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className={styles.formFooter}>
            Already have an account?{' '}
            <Link href="/login" className={styles.formLink}>
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
