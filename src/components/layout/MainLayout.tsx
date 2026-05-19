import { Outlet, NavLink } from 'react-router-dom';
import { ROUTES } from '../../constants';
import {
  LayoutDashboard,
  Search,
  FileEdit,
  MessageSquare,
  User,
} from 'lucide-react';
import styles from './MainLayout.module.css';

const navItems = [
  { path: ROUTES.HOME, label: '대시보드', icon: LayoutDashboard },
  { path: ROUTES.ANALYSIS, label: 'JD & 기업분석', icon: Search },
  { path: ROUTES.RESUME, label: '자기소개서', icon: FileEdit },
  { path: ROUTES.INTERVIEW, label: '면접 준비', icon: MessageSquare },
  { path: ROUTES.MYPAGE, label: '마이페이지', icon: User },
];

export default function MainLayout() {
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>C</div>
          <span className={styles.logoText}>CareerAI</span>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === ROUTES.HOME}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
              >
                <span className={styles.navIcon}>
                  <Icon size={18} />
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
