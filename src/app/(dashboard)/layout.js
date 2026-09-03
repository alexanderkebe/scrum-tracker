'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getAvatarColor, getInitials, roleLabel } from '@/lib/utils';
import styles from './dashboard.module.css';

export default function DashboardLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-root)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ background: '#fff', padding: '10px 18px', borderRadius: 12, margin: '0 auto 16px', display: 'inline-flex', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
            <img src="/logo.png" alt="Systems Edge Solutions" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '🏠', roles: ['admin', 'product_owner', 'scrum_master', 'member'] },
    { path: '/meetings', label: 'Meetings', icon: '📋', roles: ['admin', 'product_owner', 'scrum_master', 'member'] },
    { path: '/board', label: 'Sprint Board', icon: '📊', roles: ['admin', 'product_owner', 'scrum_master', 'member'] },
    { path: '/team', label: 'Team', icon: '👥', roles: ['admin', 'product_owner'] },
    { path: '/analytics', label: 'Analytics', icon: '📈', roles: ['admin', 'product_owner', 'scrum_master'] },
    { path: '/profile', label: 'My Profile', icon: '👤', roles: ['admin', 'product_owner', 'scrum_master', 'member'] },
    { path: '/settings', label: 'Settings', icon: '⚙️', roles: ['admin'] },
  ];

  const visibleNav = navItems.filter(n => n.roles.includes(user.role));

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isActive = (path) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <div className={styles.dashLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div className={styles.sidebarLogoWrapper}>
            <img src="/logo.png" alt="Systems Edge Solutions" className={styles.sidebarLogoImg} />
          </div>
          <div className={styles.sidebarTrackerBadge}>Scrum Tracker</div>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.navLabel}>Navigation</div>
          {visibleNav.map(item => (
            <a key={item.path} className={`${styles.navItem} ${isActive(item.path) ? styles.navActive : ''}`}
              onClick={() => router.push(item.path)}>
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className="avatar avatar-sm" style={{ background: getAvatarColor(user.avatar_color || 0) }}>
              {getInitials(user.name)}
            </div>
            <div className={styles.userMeta}>
              <div className={styles.userName}>{user.name}</div>
              <div className={styles.userRole}>{roleLabel(user.role)}</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Sign out">
            🚪
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
