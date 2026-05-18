import { Outlet, NavLink, Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import {
  LayoutDashboard,
  ClipboardList,
  FileEdit,
  MessageSquare,
  User,
} from 'lucide-react';
import styles from './MainLayout.module.css';

const navItems = [
  { path: ROUTES.HOME, label: '대시보드', icon: LayoutDashboard },
  { path: ROUTES.APPLICATIONS, label: '지원 현황', icon: ClipboardList },
  { path: ROUTES.RESUME, label: '자기소개서', icon: FileEdit },
  { path: ROUTES.INTERVIEW, label: '면접 연습', icon: MessageSquare },
  { path: ROUTES.MYPAGE, label: '마이페이지', icon: User },
];

export default function MainLayout() {
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <Link to={ROUTES.HOME} className={styles.logo}>
          <div className={styles.logoIcon}>C</div>
          <span className={styles.logoText}>CareerAI</span>
        </Link>

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

        <div className={styles.userBox}>
          <div className={styles.userAvatar}>SJ</div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>이성재</p>
            <p className={styles.userRole}>프론트엔드 개발자</p>
          </div>
        </div>
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
