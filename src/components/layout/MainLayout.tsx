import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants';
import {
  LayoutDashboard,
  ClipboardList,
  FileEdit,
  MessageSquare,
  User,
  Building2,
  LogOut,
} from 'lucide-react';
import styles from './MainLayout.module.css';

const navItems = [
  { path: ROUTES.HOME, label: '대시보드', icon: LayoutDashboard },
  { path: ROUTES.ANALYSIS, label: '기업 분석', icon: Building2 },
  { path: ROUTES.APPLICATIONS, label: '지원 현황', icon: ClipboardList },
  { path: ROUTES.RESUME, label: '자기소개서', icon: FileEdit },
  { path: ROUTES.INTERVIEW, label: '면접 연습', icon: MessageSquare },
  { path: ROUTES.MYPAGE, label: '마이페이지', icon: User },
];

export default function MainLayout() {
  const navigate = useNavigate();

  // localStorage에서 로그인된 사용자 정보 동적 로드
  const userStr = localStorage.getItem('user');
  let userName = '이성재';
  let userRole = '프론트엔드 개발자';
  let avatarText = 'SJ';

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      userName = user.name || user.email || '사용자';
      userRole = user.role || '취업 준비생';
      avatarText = userName.slice(0, 2).toUpperCase();
    } catch (e) {
      console.error('Failed to parse user session:', e);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate(ROUTES.LOGIN);
  };

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
          <div className={styles.userAvatar}>{avatarText}</div>
          <div className={styles.userInfo}>
            <p className={styles.userName} title={userName}>{userName}</p>
            <p className={styles.userRole} title={userRole}>{userRole}</p>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn} title="로그아웃">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
