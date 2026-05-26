import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import api from '../../services/api';
import styles from './Home.module.css';
import { useAuthStore } from '../../store/authStore';

// Time formatting helper
function timeAgo(dateString: string | null) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return '어제';
  return `${diffDay}일 전`;
}

// Color helpers
const getCompanyColor = (name: string) => {
  if (name.includes('카카오')) return '#FEE500';
  if (name.includes('네이버')) return '#03C75A';
  if (name.includes('토스')) return '#0064FF';
  return 'var(--color-primary)';
};

const getCompanyTextColor = (name: string) => {
  if (name.includes('카카오')) return '#3c1e01';
  return '#fff';
};

export default function HomePage() {
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/user/dashboard');
        setDashboardData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const displayName = user?.name || user?.email || '사용자';

  const stats = [
    { label: '분석한 기업', value: dashboardData?.stats?.analysis_count || 0, sub: '', subType: 'blue' },
    { label: '작성한 자소서', value: dashboardData?.stats?.resume_count || 0, sub: '', subType: 'blue' },
    { label: '면접 연습 횟수', value: dashboardData?.stats?.interview_count || 0, sub: '', subType: 'orange' },
  ];

  const recentCompanies = dashboardData?.recent_companies || [];
  const recentActivities = dashboardData?.recent_activities || [];

  return (
    <div className={styles.page}>
      {/* Greeting */}
      <div className={styles.greeting}>
        <h1 className={styles.greetingTitle}>안녕하세요, {displayName} 님 👋</h1>
        <p className={styles.greetingSubtitle}>오늘도 취업 준비 화이팅! 현재 {recentCompanies.length}개 기업 준비 중입니다.</p>
      </div>

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <p className={styles.statLabel}>{s.label}</p>
            <p className={styles.statValue}>{s.value}</p>
            {s.sub && <p className={`${styles.statSub} ${styles[`sub_${s.subType}`]}`}>{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Main 2-col layout */}
      <div className={styles.mainGrid}>
        {/* Left: company list */}
        <div className={styles.companyCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>최근 준비 중인 기업</h2>
            <Link to={ROUTES.APPLICATIONS} className={styles.seeAll}>전체보기</Link>
          </div>

          <div className={styles.companyList}>
            {loading && <p style={{ padding: '1rem', color: '#666' }}>불러오는 중...</p>}
            {!loading && recentCompanies.length === 0 && (
              <p style={{ padding: '1rem', color: '#666' }}>최근 분석한 기업이 없습니다.</p>
            )}
            {!loading && recentCompanies.map((c: any) => (
              <div key={c.analysis_id} className={styles.companyRow}>
                <div
                  className={styles.companyAvatar}
                  style={{ background: getCompanyColor(c.company_name), color: getCompanyTextColor(c.company_name) }}
                >
                  {c.company_name.charAt(0)}
                </div>
                <div className={styles.companyInfo}>
                  <span className={styles.companyName}>{c.company_name}</span>
                  <span className={styles.companyRole}>{c.job_role}</span>
                </div>
                <div className={styles.companyBadges}>
                  <span className={`${styles.badge} ${styles.badgeGreen}`}>분석 ✓</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className={styles.rightCol}>
          {/* Recent activity */}
          <div className={styles.activityCard}>
            <h2 className={styles.sectionTitle}>최근 활동</h2>
            <div className={styles.activityList}>
              {loading && <p style={{ padding: '1rem', color: '#666' }}>불러오는 중...</p>}
              {!loading && recentActivities.length === 0 && (
                <p style={{ padding: '1rem', color: '#666' }}>최근 활동 내역이 없습니다.</p>
              )}
              {!loading && recentActivities.map((a: any, i: number) => (
                <div key={i} className={styles.activityItem}>
                  <span className={styles.activityDot} />
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>{a.text}</p>
                    <p className={styles.activityTime}>{timeAgo(a.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
