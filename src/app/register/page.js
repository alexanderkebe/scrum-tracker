'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import styles from '../login/auth.module.css';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
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
            <img src="/logo.png" alt="Systems Edge Solutions" className={styles.heroLogoImg} />
          </div>
          <p className={styles.heroSubtitle}>Join your team&apos;s Scrum workspace</p>
          <div className={styles.heroFeatures}>
            <div className={styles.heroFeature}><span>👥</span> Team Collaboration</div>
            <div className={styles.heroFeature}><span>📊</span> Sprint Tracking</div>
            <div className={styles.heroFeature}><span>🎯</span> Goal Setting</div>
            <div className={styles.heroFeature}><span>📈</span> Performance Insights</div>
          </div>
        </div>
      </div>

      <div className={styles.authForm}>
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Create account</h2>
          <p className={styles.formSubtitle}>Get started with your team</p>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" value={name}
                onChange={e => setName(e.target.value)} placeholder="John Doe" required />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="name@systemedge.com" required />
            </div>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className={styles.formFooter}>
            Already have an account? <a href="/login" className={styles.formLink}>Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
