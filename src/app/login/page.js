'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { BRAND_LOGOS } from '@/lib/logos';
import styles from './auth.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authHero}>
        <div className={styles.heroContent}>
          <div className={styles.heroLogoWrapper}>
            <img src={BRAND_LOGOS.onDark.full} alt="Systems Edge Solutions" className={styles.heroLogoImg} />
          </div>
          <p className={styles.heroSubtitle}>Scrum Meeting Tracker</p>
          <div className={styles.heroFeatures}>
            <div className={styles.heroFeature}><span>⚡</span> Daily Stand-ups</div>
            <div className={styles.heroFeature}><span>📋</span> Sprint Planning</div>
            <div className={styles.heroFeature}><span>📊</span> Team Analytics</div>
            <div className={styles.heroFeature}><span>🎯</span> Sprint Reviews</div>
          </div>
        </div>
      </div>

      <div className={styles.authForm}>
        <div className={styles.formContainer}>
          <div className={styles.formIconBadge}>
            <img src={BRAND_LOGOS.onLight.icon} alt="Systems Edge Solutions" className={styles.formIconImg} />
          </div>
          <h2 className={styles.formTitle}>Welcome back</h2>
          <p className={styles.formSubtitle}>Sign in to your account</p>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="name@systemedge.com" required />
            </div>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className={styles.formFooter}>
            Don&apos;t have an account? <a href="/register" className={styles.formLink}>Register</a>
          </p>

          <div className={styles.demoCredentials}>
            <strong>Demo Login:</strong> admin@systemedge.com / admin123
          </div>
        </div>
      </div>
    </div>
  );
}
