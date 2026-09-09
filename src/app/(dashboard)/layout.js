'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  UserCircle,
  UsersRound,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import AppLoader from '@/components/AppLoader';
import { getAvatarColor, getInitials, roleLabel } from '@/lib/utils';
import { BRAND_LOGOS } from '@/lib/logos';
import styles from './dashboard.module.css';

/** Short role abbreviation shown in parentheses next to the name */
function roleAbbrev(role) {
  const map = { admin: 'Admin', product_owner: 'PO', scrum_master: 'SM', member: 'TM' };
  return map[role] || '';
}

/** Strip any trailing parenthesized abbreviation from a display name, e.g. "Kal Connor (PO)" → "Kal Connor" */
function stripRoleFromName(name) {
  if (!name) return '';
  return name.replace(/\s*\([A-Za-z]+\)\s*$/, '').trim();
}

const mainNav = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'product_owner', 'scrum_master', 'member'] },
  { path: '/meetings', label: 'Meetings', icon: CalendarDays, roles: ['admin', 'product_owner', 'scrum_master', 'member'] },
  { path: '/board', label: 'Sprint Board', icon: Columns3, roles: ['admin', 'product_owner', 'scrum_master', 'member'] },
  { path: '/team', label: 'Team', icon: UsersRound, roles: ['admin', 'product_owner'] },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'product_owner', 'scrum_master'] },
];

const settingsNav = [
  { path: '/profile', label: 'My Profile', icon: UserCircle, roles: ['admin', 'product_owner', 'scrum_master', 'member'] },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

const pageMeta = {
  '/': ['Dashboard', 'Your sprint at a glance. Keep your team aligned and moving forward.'],
  '/meetings': ['Meetings', 'Plan and capture every Scrum ceremony.'],
  '/board': ['Sprint Board', 'Move work through the sprint with clarity.'],
  '/team': ['Team', 'Manage roles, access, and collaboration.'],
  '/analytics': ['Analytics', 'Understand delivery, attendance, and sprint health.'],
  '/profile': ['My Profile', 'Manage your personal Scrum Tracker details.'],
  '/settings': ['Settings', 'Configure your workspace and team defaults.'],
};

export default function DashboardLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading) {
    return <AppLoader fullScreen label="Loading your workspace…" />;
  }

  if (!user) return null;

  const isActive = (path) => path === '/' ? pathname === '/' : pathname.startsWith(path);
  const metaKey = Object.keys(pageMeta).find(path => path === '/' ? pathname === '/' : pathname.startsWith(path)) || '/';
  const [title] = pageMeta[metaKey];

  const toggleSidebar = () => {
    setCollapsed(value => !value);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const renderNav = items => items.filter(item => item.roles.includes(user.role)).map(item => {
    const Icon = item.icon;
    return <Link key={item.path} href={item.path} className={`${styles.navItem} ${isActive(item.path) ? styles.navActive : ''}`} title={item.label}>
      <span className={styles.navIcon}><Icon aria-hidden="true" /></span>
      <span className={styles.navText}>{item.label}</span>
    </Link>;
  });

  return <div className={styles.dashLayout}>
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarBrandLockup}>
          <Image src={BRAND_LOGOS.onDark.icon} alt="" width={34} height={48} className={styles.sidebarMark} priority />
          <div className={styles.sidebarBrandText}><strong>Scrum Tracker</strong><span>by Systems Edge Solutions</span></div>
        </div>
        <button className={styles.sidebarToggle} type="button" onClick={toggleSidebar} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed}>
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      <nav className={styles.sidebarNav} aria-label="Workspace navigation">
        <div className={styles.navSection}>
          <div className={styles.navLabel}>Main</div>
          {renderNav(mainNav)}
        </div>
        <div className={styles.navDivider} />
        <div className={styles.navSection}>
          <div className={styles.navLabel}>Settings</div>
          {renderNav(settingsNav)}
        </div>
      </nav>

      <div className={styles.sidebarFooter}>
        <button className={styles.userInfo} type="button" onClick={() => router.push('/profile')} title="Open profile">
          <span className={styles.shellAvatar} style={{ background: getAvatarColor(user.avatar_color || 0) }}>{getInitials(user.name)}</span>
          <span className={styles.userMeta}><strong>{user.name}</strong><small>{roleLabel(user.role)}</small></span>
        </button>
        <button className={styles.logoutBtn} onClick={handleLogout} title="Sign out" aria-label="Sign out"><LogOut /></button>
      </div>
    </aside>

    <main className={`${styles.mainContent} ${collapsed ? styles.mainContentCollapsed : ''}`}>
      <header className={styles.minimalTopbar}>
        <h1>{title}</h1>

        {/* Search bar — hides when viewport is too narrow */}
        <div className={styles.topbarSearch}>
          <Search aria-hidden="true" />
          <input type="text" placeholder="Search tasks, blockers, people…" aria-label="Search" />
          <kbd className={styles.topbarSearchKbd}>Ctrl + K</kbd>
        </div>

        <div className={styles.topbarRight}>
          {/* Notification bell */}
          <button className={styles.topbarNotifBtn} type="button" aria-label="Notifications" title="Notifications">
            <Bell />
            <span className={styles.topbarNotifBadge}>3</span>
          </button>

          {/* Profile chip */}
          <Link href="/profile" className={styles.topbarProfileChip} title={user.name}>
            <span className={styles.shellAvatar} style={{ background: getAvatarColor(user.avatar_color || 0) }}>{getInitials(user.name)}</span>
            <span className={styles.topbarProfileMeta}>
              <strong>{stripRoleFromName(user.name)}{roleAbbrev(user.role) ? ` (${roleAbbrev(user.role)})` : ''}</strong>
              <small>{roleLabel(user.role)}</small>
            </span>
            <ChevronDown className={styles.topbarProfileChevron} />
          </Link>
        </div>
      </header>
      {children}
    </main>
  </div>;
}
