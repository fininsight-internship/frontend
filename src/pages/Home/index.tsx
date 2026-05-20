import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import styles from './Home.module.css';

// ─── Mock data ────────────────────────────────────────────────────
const STATS = [
  { label: '분석한 기업', value: '5', sub: '이번 달 +2', subType: 'blue' },
  { label: '작성한 자소서', value: '3', sub: '평균 적합도 78%', subType: 'blue' },
  { label: '면접 연습 횟수', value: '12', sub: '총 답변 48개', subType: 'orange' },
];

type ResumeStatus = 'done' | 'in_progress' | null;
type InterviewStatus = 'done' | 'in_progress' | null;

interface Company {
  name: string;
  initial: string;
  role: string;
  jd: boolean;
  resume: ResumeStatus;
  interview: InterviewStatus;
  score: number | null;
  dday: number;
}

const COMPANIES: Company[] = [
  { name: '카카오', initial: '카', role: '프론트엔드 개발자', jd: true, resume: 'done', interview: 'in_progress', score: 84, dday: 12 },
  { name: '네이버', initial: '네', role: '데이터 분석가', jd: true, resume: 'in_progress', interview: null, score: 71, dday: 24 },
  { name: '토스', initial: '토', role: 'iOS 개발자', jd: true, resume: null, interview: null, score: null, dday: 30 },
];

const ACTIVITIES = [
  { text: '카카오 면접 3번째 질문 답변 완료', time: '1시간 전' },
  { text: '네이버 자소서 2번 문항 피드백 수신', time: '3시간 전' },
  { text: '토스 기업분석 리포트 생성', time: '어제' },
];

const COMPANY_COLORS: Record<string, string> = {
  카카오: '#FEE500',
  네이버: '#03C75A',
  토스: '#0064FF',
};

const COMPANY_TEXT_COLORS: Record<string, string> = {
  카카오: '#3c1e01',
  네이버: '#fff',
  토스: '#fff',
};

function ResumeBadge({ status }: { status: ResumeStatus }) {
  if (status === 'done') return <span className={`${styles.badge} ${styles.badgeGreen}`}>자소서 ✓</span>;
  if (status === 'in_progress') return <span className={`${styles.badge} ${styles.badgeAmber}`}>자소서 작성중</span>;
  return <span className={`${styles.badge} ${styles.badgeGray}`}>자소서 —</span>;
}

function InterviewBadge({ status }: { status: InterviewStatus }) {
  if (status === 'done') return <span className={`${styles.badge} ${styles.badgeGreen}`}>면접 ✓</span>;
  if (status === 'in_progress') return <span className={`${styles.badge} ${styles.badgeBlue}`}>면접 진행중</span>;
  return <span className={`${styles.badge} ${styles.badgeGray}`}>면접 —</span>;
}

export default function HomePage() {
  const userStr = localStorage.getItem('user');
  let displayName = '사용자';

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      displayName = user.nickname || user.name || user.email || '사용자';
    } catch (e) {
      console.error('Failed to parse user session:', e);
    }
  }

  return (
    <div className={styles.page}>
      {/* Greeting */}
      <div className={styles.greeting}>
        <h1 className={styles.greetingTitle}>안녕하세요, {displayName} 님 👋</h1>
        <p className={styles.greetingSubtitle}>오늘도 취업 준비 화이팅! 현재 {COMPANIES.length}개 기업 준비 중입니다.</p>
      </div>

      {/* Stat cards */}
      <div className={styles.statsGrid}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <p className={styles.statLabel}>{s.label}</p>
            <p className={styles.statValue}>{s.value}</p>
            <p className={`${styles.statSub} ${styles[`sub_${s.subType}`]}`}>{s.sub}</p>
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
            {COMPANIES.map((c) => (
              <div key={c.name} className={styles.companyRow}>
                <div
                  className={styles.companyAvatar}
                  style={{ background: COMPANY_COLORS[c.name] || 'var(--color-primary)', color: COMPANY_TEXT_COLORS[c.name] || '#fff' }}
                >
                  {c.initial}
                </div>
                <div className={styles.companyInfo}>
                  <span className={styles.companyName}>{c.name}</span>
                  <span className={styles.companyRole}>{c.role}</span>
                </div>
                <div className={styles.companyBadges}>
                  {c.jd && <span className={`${styles.badge} ${styles.badgeGreen}`}>JD ✓</span>}
                  <ResumeBadge status={c.resume} />
                  <InterviewBadge status={c.interview} />
                  {c.score !== null && (
                    <span className={`${styles.badge} ${styles.badgeScore}`}>{c.score}점</span>
                  )}
                  <span className={`${styles.badge} ${c.dday <= 14 ? styles.badgeRed : styles.badgeGray}`}>
                    D-{c.dday}
                  </span>
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
              {ACTIVITIES.map((a, i) => (
                <div key={i} className={styles.activityItem}>
                  <span className={styles.activityDot} />
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>{a.text}</p>
                    <p className={styles.activityTime}>{a.time}</p>
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
