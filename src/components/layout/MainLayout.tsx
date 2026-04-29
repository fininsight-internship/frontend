import { Outlet, NavLink } from 'react-router-dom';
import { ROUTES } from '../../constants';
import styles from './MainLayout.module.css';

const navItems = [
  { path: ROUTES.HOME, label: '홈', icon: '🏠' },
  { path: ROUTES.COMPANY, label: '기업 분석', icon: '🏢' },
  { path: ROUTES.JD, label: 'JD 분석', icon: '📋' },
  { path: ROUTES.RESUME, label: '자기소개서', icon: '✏️' },
  { path: ROUTES.INTERVIEW, label: '면접 준비', icon: '🎤' },
];

export default function MainLayout() {
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🤖</span>
          <span className={styles.logoText}>Job Agent</span>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === ROUTES.HOME}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
