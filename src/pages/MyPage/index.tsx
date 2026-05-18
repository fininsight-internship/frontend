import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Check } from 'lucide-react';
import styles from './MyPage.module.css';

type Section = '개인정보' | '경험관리' | '구독관리' | '알림설정';

const MENU_ITEMS: { key: Section; label: string; danger?: boolean }[] = [
  { key: '개인정보', label: '개인정보 수정' },
  { key: '경험관리', label: '내 경험 관리' },
  { key: '구독관리', label: '구독 관리' },
  { key: '알림설정', label: '알림 설정' },
];

const PLANS = [
  {
    name: 'Free',
    price: '₩0',
    current: true,
    features: ['월 5회 분석', '기본 피드백', '자소서 3개'],
    color: 'planFree',
  },
  {
    name: 'Pro',
    price: '₩19,900',
    current: false,
    features: ['월 30회 분석', '심층 피드백', '무제한 자소서', 'PDF 내보내기'],
    color: 'planPro',
  },
  {
    name: 'Premium',
    price: '₩39,900',
    current: false,
    features: ['무제한 분석', '1:1 AI 코칭', '취업 컨설턴트 매칭', '모든 기능'],
    color: 'planPremium',
  },
];

function ProfileSection() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '김민준', nickname: 'minj',
    email: 'minj@email.com', phone: '010-1234-5678',
    jobInterest: '프론트엔드 개발', targetCompany: '대기업, 스타트업',
  });
  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>개인정보 수정</h2>
        <button className={styles.editBtn} onClick={() => setEditing((v) => !v)}>
          {editing ? '저장' : '수정'}
        </button>
      </div>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label className={styles.label}>이름</label>
          <input className={styles.input} value={form.name} onChange={update('name')} disabled={!editing} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>닉네임</label>
          <input className={styles.input} value={form.nickname} onChange={update('nickname')} disabled={!editing} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>이메일</label>
          <input className={styles.input} value={form.email} onChange={update('email')} disabled={!editing} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>연락처</label>
          <input className={styles.input} value={form.phone} onChange={update('phone')} disabled={!editing} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>관심 직무</label>
          <input className={styles.input} value={form.jobInterest} onChange={update('jobInterest')} disabled={!editing} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>목표 기업 유형</label>
          <input className={styles.input} value={form.targetCompany} onChange={update('targetCompany')} disabled={!editing} />
        </div>
      </div>
    </div>
  );
}

const MOCK_EXPERIENCES = [
  { id: '1', company: '네이버 주식회사', role: '프론트엔드 개발 인턴', period: '2024.07 - 2024.08', hasStar: true, category: '경력인턴' as const },
  { id: '2', company: '개인 프로젝트', role: '투업 관리 플랫폼 개발', period: '2024.03 - 2024.06', hasStar: true, category: '프로젝트' as const },
  { id: '3', company: 'ABC 스타트업', role: '풀스택 개발 인턴', period: '2023.12 - 2024.02', hasStar: false, category: '경력인턴' as const },
  { id: '4', company: '우아한테크코스 5기', role: '프론트엔드 과정', period: '2023.02 - 2023.11', hasStar: false, category: '교육부트캠프' as const },
];

function ExperienceSection() {
  const navigate = useNavigate();

  const handleClick = (exp: typeof MOCK_EXPERIENCES[0]) => {
    navigate('/experience/edit', {
      state: { category: exp.category },
    });
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>내 경험 관리</h2>
      </div>
      <div className={styles.expList}>
        {MOCK_EXPERIENCES.map((exp) => (
          <div key={exp.id} className={`${styles.expCard} ${styles.expCardClickable}`} onClick={() => handleClick(exp)}>
            <div>
              <p className={styles.expCompany}>{exp.company}</p>
              <p className={styles.expRole}>{exp.role}</p>
              <p className={styles.expPeriod}>{exp.period}</p>
            </div>
            <div className={styles.expRight}>
              <span className={`${styles.starBadge} ${exp.hasStar ? styles.starDone : styles.starMissing}`}>
                {exp.hasStar ? 'STAR 입력됨' : 'STAR 미입력'}
              </span>
              <ChevronRight size={16} className={styles.expChevron} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubscriptionSection() {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>구독 관리</h2>
      </div>
      <div className={styles.planGrid}>
        {PLANS.map((plan) => (
          <div key={plan.name} className={`${styles.planCard} ${styles[plan.color]}`}>
            <div className={styles.planTop}>
              <span className={styles.planName}>{plan.name}</span>
              {plan.current && <span className={styles.currentBadge}>현재 플랜</span>}
            </div>
            <p className={styles.planPrice}>
              {plan.price}<span className={styles.planPer}>/월</span>
            </p>
            <ul className={styles.planFeatures}>
              {plan.features.map((f) => (
                <li key={f} className={styles.planFeatureItem}>
                  <Check size={13} className={styles.checkIcon} />
                  {f}
                </li>
              ))}
            </ul>
            {!plan.current && (
              <button className={styles.upgradeBtn}>업그레이드</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationSection() {
  const [settings, setSettings] = useState({
    analysis: true,
    resume: true,
    interview: false,
    marketing: false,
  });
  const toggle = (k: keyof typeof settings) =>
    setSettings((p) => ({ ...p, [k]: !p[k] }));

  const items = [
    { key: 'analysis' as const, label: '분석 완료 알림', desc: '기업분석 및 JD 분석이 완료되면 알려드려요.' },
    { key: 'resume' as const, label: '자소서 피드백 알림', desc: 'AI 피드백 결과가 나오면 알려드려요.' },
    { key: 'interview' as const, label: '면접 연습 리마인더', desc: '면접 연습 일정을 미리 알려드려요.' },
    { key: 'marketing' as const, label: '마케팅 정보 수신', desc: '이벤트 및 업데이트 소식을 알려드려요.' },
  ];

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>알림 설정</h2>
      </div>
      <div className={styles.notiList}>
        {items.map((item) => (
          <div key={item.key} className={styles.notiItem}>
            <div>
              <p className={styles.notiLabel}>{item.label}</p>
              <p className={styles.notiDesc}>{item.desc}</p>
            </div>
            <button
              className={`${styles.toggle} ${settings[item.key] ? styles.toggleOn : ''}`}
              onClick={() => toggle(item.key)}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MyPage() {
  const [active, setActive] = useState<Section>('개인정보');

  const contentMap: Record<Section, React.ReactNode> = {
    개인정보: <ProfileSection />,
    경험관리: <ExperienceSection />,
    구독관리: <SubscriptionSection />,
    알림설정: <NotificationSection />,
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>마이페이지</h1>

      <div className={styles.layout}>
        {/* Left panel */}
        <aside className={styles.leftPanel}>
          {/* Profile card */}
          <div className={styles.profileCard}>
            <div className={styles.avatar}>김</div>
            <p className={styles.profileName}>김민준</p>
            <p className={styles.profileEmail}>minj@email.com</p>
            <div className={styles.planBadge}>
              <span className={styles.planBadgeName}>Free 플랜</span>
              <span className={styles.planBadgeUsage}>이번 달 3/5회 사용</span>
            </div>
          </div>

          {/* Menu */}
          <nav className={styles.menu}>
            {MENU_ITEMS.map((item) => (
              <button
                key={item.key}
                className={`${styles.menuItem} ${active === item.key ? styles.menuItemActive : ''}`}
                onClick={() => setActive(item.key)}
              >
                <span>{item.label}</span>
                <ChevronRight size={16} className={styles.menuChevron} />
              </button>
            ))}
            <button className={`${styles.menuItem} ${styles.menuItemDanger}`}>
              계정 삭제
            </button>
          </nav>
        </aside>

        {/* Right panel */}
        <div className={styles.rightPanel}>
          {contentMap[active]}
        </div>
      </div>
    </div>
  );
}
