import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Check } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
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

function ProfileSection({ userProfile }: { userProfile: any }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '', nickname: '',
    email: '', jobInterest: '',
  });

  useEffect(() => {
    if (userProfile) {
      setForm((prev) => ({
        ...prev,
        name: userProfile.name || '',
        nickname: userProfile.eng_name || '',
        email: userProfile.email || '',
        jobInterest: userProfile.role || '',
      }));
    }
  }, [userProfile]);

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
          <label className={styles.label}>관심 직무</label>
          <input className={styles.input} value={form.jobInterest} onChange={update('jobInterest')} disabled={!editing} />
        </div>
      </div>
    </div>
  );
}


function ExperienceSection() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const dbKey = user ? `experience_profile_${user.id}` : 'experience_profile_guest';

  // 경험 정보 상태 관리 (로컬 캐시 초기화 및 DB 동기화)
  const [profile, setProfile] = useState<any>(() => {
    const saved = localStorage.getItem(dbKey);
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const fetchExperience = async () => {
      try {
        const res = await api.get('/experience');
        if (res.data) {
          setProfile(res.data);
          localStorage.setItem(dbKey, JSON.stringify(res.data));
        }
      } catch (err) {
        console.warn('DB 경험 데이터 로드 실패:', err);
      }
    };
    fetchExperience();
  }, [dbKey]);

  const categoriesToRender = [
    { key: '경력인턴', label: '경력 / 인턴' },
    { key: '교육부트캠프', label: '교육 / 부트캠프' },
    { key: '프로젝트', label: '프로젝트' },
    { key: '동아리', label: '동아리' },
    { key: '봉사활동', label: '봉사활동' },
    { key: '기타경험', label: '기타 경험 사항' },
  ];

  const exps: any[] = [];
  if (profile) {
    categoriesToRender.forEach((cat) => {
      const array = profile[cat.key as any] || [];
      array.forEach((item: any) => {
        let displayTitle = '';
        if (cat.key === '경력인턴') {
          if (item.company) {
            displayTitle = `${item.company} (${item.department || ''} / ${item.startDate || ''} ~ ${item.endDate || ''})`;
          }
        } else if (cat.key === '교육부트캠프') {
          if (item.name) {
            displayTitle = `${item.name} (${item.topic || ''})`;
          }
        } else {
          displayTitle = item.title;
        }

        if (displayTitle) {
          exps.push({
            id: item.id,
            title: displayTitle,
            detail: item.detail,
            category: cat.key,
            categoryLabel: cat.label
          });
        }
      });
    });
  }

  const displayExps = exps;

  const handleClick = (categoryKey: string) => {
    navigate('/experience/edit', {
      state: { category: categoryKey },
    });
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className={styles.sectionTitle}>내 경험 관리</h2>
        <button 
          onClick={() => navigate('/experience/edit')} 
          className={styles.editBtn} 
          style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '0.45rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}
        >
          + 새 경험 등록하기
        </button>
      </div>
      
      {/* AI 지원 공지 배너 추가 */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)', 
        border: '1px solid var(--color-border)', 
        borderRadius: '10px', 
        padding: '1rem', 
        fontSize: '0.82rem', 
        color: 'var(--color-text-secondary)',
        lineHeight: '1.5',
        marginBottom: '1rem' 
      }}>
        💡 <strong>자소서 연동 꿀팁:</strong> 상세히 입력해 주신 모든 경험은 AI가 고품질 자기소개서 초안을 빌드할 때 우선 순위로 결합됩니다. 
        만약 간단하게만 작성하셨더라도 걱정 마세요! 자소서 탭에서 <strong>AI 멘토가 대화식(멀티턴) 질문을 통해 스토리 구체화를 직접 무료로 도와드립니다.</strong>
      </div>

      <div className={styles.expList}>
        {displayExps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>
            등록된 경험이 없습니다. 위의 버튼을 눌러 경험을 등록해보세요.
          </div>
        ) : (
          displayExps.map((exp) => (
            <div key={exp.id} className={`${styles.expCard} ${styles.expCardClickable}`} onClick={() => handleClick(exp.category)}>
              <div>
                <p className={styles.expCompany} style={{ fontWeight: '700', color: 'var(--color-text)' }}>{exp.title}</p>
                <p className={styles.expRole} style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: '600', marginTop: '2px' }}>
                  📂 {exp.categoryLabel}
                </p>
                <p className={styles.expPeriod} style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {exp.detail || '상세 내용이 없습니다. 클릭하여 작성해주세요.'}
                </p>
              </div>
              <div className={styles.expRight}>
                <span className={`${styles.starBadge} ${exp.detail ? styles.starDone : styles.starMissing}`}>
                  {exp.detail ? '상세내용 입력됨' : '상세내용 미입력'}
                </span>
                <ChevronRight size={16} className={styles.expChevron} />
              </div>
            </div>
          ))
        )}
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
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUserProfile(res.data))
      .catch(err => console.warn('Failed to load user profile', err));
  }, []);

  const contentMap: Record<Section, React.ReactNode> = {
    개인정보: <ProfileSection userProfile={userProfile} />,
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
            <div className={styles.avatar}>{userProfile?.name?.[0] || 'U'}</div>
            <p className={styles.profileName}>{userProfile?.name || '사용자'}</p>
            <p className={styles.profileEmail}>{userProfile?.email || 'email@example.com'}</p>
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
