import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Circle, X, Plus } from 'lucide-react';
import { ROUTES } from '../../constants';
import styles from './ExperienceEdit.module.css';

// ─── Types ────────────────────────────────────────────────────────
type CategoryKey = '기본정보' | '자격증상' | '경력인턴' | '교육부트캠프' | '프로젝트' | '동아리' | '봉사활동' | '스킬';

interface Entry {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  skills: string[];
  detail: string;
}

interface LocationState {
  category?: CategoryKey;
  entries?: Entry[];
  activeIdx?: number;
  fromSignup?: boolean;
  step?: number;
}

// ─── Constants ────────────────────────────────────────────────────
const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: '기본정보', label: '기본정보' },
  { key: '자격증상', label: '자격증/상' },
  { key: '경력인턴', label: '경력/인턴' },
  { key: '교육부트캠프', label: '교육/부트캠프' },
  { key: '프로젝트', label: '프로젝트' },
  { key: '동아리', label: '동아리' },
  { key: '봉사활동', label: '봉사활동' },
  { key: '스킬', label: '스킬' },
];

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  기본정보: '기본 정보',
  자격증상: '자격증 / 상',
  경력인턴: '경력 / 인턴',
  교육부트캠프: '교육 / 부트캠프',
  프로젝트: '프로젝트',
  동아리: '동아리',
  봉사활동: '봉사활동',
  스킬: '스킬',
};

const DEFAULT_ENTRIES: Entry[] = [
  {
    id: '1',
    company: '네이버 주식회사',
    role: '프론트엔드 개발 인턴',
    startDate: '2024년 7월',
    endDate: '2024년 8월',
    skills: ['React', 'TypeScript', 'React Query', 'Next.js'],
    detail: 'React Query를 도입해 API 호출을 60% 줄이고 초기 로딩 속도를 2.1초 단축했습니다. 코드 스플리팅과 번들 최적화로 번들 사이즈도 40% 절감했으며, 팀 코드 리뷰를 주도해 공통 컴포넌트 라이브러리를 구축했습니다.',
  },
  {
    id: '2',
    company: 'ABC 스타트업',
    role: '풀스택 개발 인턴',
    startDate: '2023년 12월',
    endDate: '2024년 2월',
    skills: ['Node.js', 'React', 'MongoDB'],
    detail: '',
  },
];

const DONE_CATEGORIES: Set<CategoryKey> = new Set(['기본정보', '자격증상']);

// ─── Skill tag input ──────────────────────────────────────────────
function SkillTags({ skills, onChange }: { skills: string[]; onChange: (s: string[]) => void }) {
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);

  const add = () => {
    const v = input.trim();
    if (v && !skills.includes(v)) onChange([...skills, v]);
    setInput('');
    setAdding(false);
  };

  return (
    <div className={styles.tagWrap}>
      {skills.map((s) => (
        <span key={s} className={styles.tag}>
          {s}
          <button className={styles.tagRemove} onClick={() => onChange(skills.filter((x) => x !== s))}>
            <X size={11} />
          </button>
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          className={styles.tagInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add();
            if (e.key === 'Escape') setAdding(false);
          }}
          onBlur={add}
          placeholder="입력 후 Enter"
        />
      ) : (
        <button className={styles.tagAdd} onClick={() => setAdding(true)}>
          <Plus size={12} /> 추가
        </button>
      )}
    </div>
  );
}

// ─── Career/Intern form ───────────────────────────────────────────
function CareerForm({ entries, activeIdx, onEntriesChange, onActiveChange }: {
  entries: Entry[];
  activeIdx: number;
  onEntriesChange: (e: Entry[]) => void;
  onActiveChange: (i: number) => void;
}) {
  const entry = entries[activeIdx];

  const update = (field: keyof Entry, value: string | string[]) => {
    const next = entries.map((e, i) => i === activeIdx ? { ...e, [field]: value } : e);
    onEntriesChange(next);
  };

  const addEntry = () => {
    const newEntry: Entry = { id: Date.now().toString(), company: '', role: '', startDate: '', endDate: '', skills: [], detail: '' };
    onEntriesChange([...entries, newEntry]);
    onActiveChange(entries.length);
  };

  const deleteEntry = (idx: number) => {
    if (entries.length <= 1) return;
    const next = entries.filter((_, i) => i !== idx);
    onEntriesChange(next);
    onActiveChange(Math.min(activeIdx, next.length - 1));
  };

  return (
    <div className={styles.formArea}>
      {/* Entry tabs */}
      <div className={styles.entryTabs}>
        {entries.map((e, i) => (
          <div
            key={e.id}
            className={`${styles.entryTab} ${i === activeIdx ? styles.entryTabActive : ''}`}
            onClick={() => onActiveChange(i)}
          >
            {i === activeIdx && e.detail && (
              <CheckCircle size={14} className={styles.tabCheck} />
            )}
            {!e.detail && i !== activeIdx && (
              <span className={styles.tabNum}>{i + 1}</span>
            )}
            {e.detail && i !== activeIdx && (
              <CheckCircle size={14} className={styles.tabCheckDone} />
            )}
            <div className={styles.tabInfo}>
              <span className={styles.tabCompany}>{e.company || '(미입력)'}</span>
              <span className={styles.tabRole}>{e.role || '역할 미입력'}</span>
            </div>
            {entries.length > 1 && (
              <button
                className={styles.tabDeleteBtn}
                onClick={(ev) => { ev.stopPropagation(); deleteEntry(i); }}
                title="삭제"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        <button className={styles.addEntryBtn} onClick={addEntry}>
          <Plus size={14} /> 추가
        </button>
      </div>

      {/* Basic info */}
      <div className={styles.formCard}>
        <h3 className={styles.formCardTitle}>기본 정보</h3>
        <div className={styles.fieldGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>회사/기관명 <span className={styles.required}>*</span></label>
            <input className={styles.fieldInput} value={entry.company} onChange={(e) => update('company', e.target.value)} placeholder="네이버 주식회사" />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>직무/포지션 <span className={styles.required}>*</span></label>
            <input className={styles.fieldInput} value={entry.role} onChange={(e) => update('role', e.target.value)} placeholder="프론트엔드 개발 인턴" />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>시작일 <span className={styles.required}>*</span></label>
            <input className={styles.fieldInput} value={entry.startDate} onChange={(e) => update('startDate', e.target.value)} placeholder="2024년 7월" />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>종료일 <span className={styles.required}>*</span></label>
            <input className={styles.fieldInput} value={entry.endDate} onChange={(e) => update('endDate', e.target.value)} placeholder="2024년 8월" />
          </div>
          <div className={`${styles.fieldGroup} ${styles.fieldFull}`}>
            <label className={styles.fieldLabel}>사용 기술/스킬</label>
            <SkillTags skills={entry.skills} onChange={(s) => update('skills', s)} />
          </div>
        </div>
      </div>

      {/* Detail */}
      <div className={styles.formCard}>
        <div className={styles.detailHeader}>
          <h3 className={styles.formCardTitle}>경험 세부사항</h3>
          <span className={styles.optional}>(선택사항)</span>
        </div>
        <p className={styles.detailHint}>
          함께 세부사항 작성란입니다. 미작성시 AI와의 대화가 길어질 수 있습니다.
        </p>
        <textarea
          className={styles.detailTextarea}
          value={entry.detail}
          onChange={(e) => update('detail', e.target.value)}
          placeholder="구체적인 성과, 사용 기술, 본인의 역할 등을 자유롭게 작성해주세요."
          rows={6}
        />
        {entry.detail.trim() && (
          <p className={styles.detailDone}>
            <CheckCircle size={13} /> 세부사항이 입력되었습니다.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Simple placeholder for other categories ──────────────────────
function PlaceholderForm({ category }: { category: CategoryKey }) {
  return (
    <div className={styles.formArea}>
      <div className={styles.formCard}>
        <h3 className={styles.formCardTitle}>{CATEGORY_LABELS[category]}</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          이 항목은 회원가입 플로우와 연결 후 활성화됩니다.
        </p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────
export default function ExperienceEditPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as LocationState;

  const fromSignup = state.fromSignup ?? false;
  const [activeCategory, setActiveCategory] = useState<CategoryKey>(state.category || '경력인턴');
  const [entries, setEntries] = useState<Entry[]>(state.entries || DEFAULT_ENTRIES);
  const [activeIdx, setActiveIdx] = useState(state.activeIdx ?? 0);

  const doneSet = new Set([...DONE_CATEGORIES, ...(entries.some((e) => e.company) ? ['경력인턴' as CategoryKey] : [])]);
  const completedCount = doneSet.size;
  const progress = Math.round((completedCount / CATEGORIES.length) * 100);

  const categoryIdx = CATEGORIES.findIndex((c) => c.key === activeCategory);
  const prevCategory = CATEGORIES[categoryIdx - 1]?.key;
  const nextCategory = CATEGORIES[categoryIdx + 1]?.key;

  return (
    <div className={styles.page}>
      {/* Left sidebar */}
      <aside className={styles.sidebar}>
        <Link to={ROUTES.HOME} className={styles.logo}>
          <div className={styles.logoIcon}>C</div>
          <span className={styles.logoText}>CareerAI</span>
        </Link>

        <p className={styles.sidebarHeading}>입력 항목</p>

        <nav className={styles.stepList}>
          {CATEGORIES.map((cat) => {
            const isDone = doneSet.has(cat.key);
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                className={`${styles.stepItem} ${isActive ? styles.stepActive : ''}`}
                onClick={() => setActiveCategory(cat.key)}
              >
                {isDone
                  ? <CheckCircle size={16} className={styles.stepIconDone} />
                  : <Circle size={16} className={`${styles.stepIconEmpty} ${isActive ? styles.stepIconActive : ''}`} />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>전체 완성도</span>
            <span className={styles.progressPct}>{progress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <p className={styles.progressSub}>{completedCount}/{CATEGORIES.length} 항목 완료</p>
        </div>
      </aside>

      {/* Main content */}
      <div className={styles.main}>
        {fromSignup && (
          <div className={styles.signupSteps}>
            <div className={styles.signupStep}>
              <span className={styles.signupStepNumDone}>1</span>
              <span className={styles.signupStepLabelDone}>기본 정보</span>
            </div>
            <div className={styles.signupStepLine} />
            <div className={`${styles.signupStep} ${styles.signupStepActive}`}>
              <span className={styles.signupStepNum}>2</span>
              <span className={styles.signupStepLabel}>경험 입력</span>
            </div>
            <div className={styles.signupStepLine} />
            <div className={styles.signupStep}>
              <span className={styles.signupStepNum}>3</span>
              <span className={styles.signupStepLabel}>완료</span>
            </div>
          </div>
        )}
        <h1 className={styles.pageTitle}>{CATEGORY_LABELS[activeCategory]}</h1>

        <div className={styles.content}>
          {activeCategory === '경력인턴' ? (
            <CareerForm
              entries={entries}
              activeIdx={activeIdx}
              onEntriesChange={setEntries}
              onActiveChange={setActiveIdx}
            />
          ) : (
            <PlaceholderForm category={activeCategory} />
          )}
        </div>

        {/* Action bar */}
        <div className={styles.actionBar}>
          <button
            className={styles.prevBtn}
            onClick={() => prevCategory ? setActiveCategory(prevCategory) : navigate(ROUTES.MYPAGE)}
          >
            ← 이전
          </button>
          <div className={styles.actionRight}>
            <button className={styles.saveBtn}>임시저장</button>
            <button
              className={styles.nextBtn}
              onClick={() => nextCategory ? setActiveCategory(nextCategory) : navigate(ROUTES.MYPAGE)}
            >
              저장 후 다음 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
