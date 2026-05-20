import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  CheckCircle, 
  Circle, 
  X, 
  Plus, 
  Info,
  User, 
  Award, 
  Briefcase, 
  GraduationCap, 
  Cpu, 
  Users, 
  Heart, 
  Compass,
  Trash2
} from 'lucide-react';
import { ROUTES } from '../../constants';
import api from '../../services/api';
import styles from './ExperienceEdit.module.css';

// ─── Types ────────────────────────────────────────────────────────
export type CategoryKey = '기본정보' | '자격증상' | '경력인턴' | '교육부트캠프' | '프로젝트' | '동아리' | '봉사활동' | '기타경험';

export interface EducationEntry {
  schoolName: string;
  admissionDate: string;  // type="date"
  graduationDate: string; // type="date"
}

export interface CertEntry {
  id: string;
  name: string;
  date: string;          // YYYY-MM-DD
  organization: string;  // 발급기관명
}

export interface CareerEntry {
  id: string;
  company: string;       // 회사명
  department: string;    // 부서
  startDate: string;     // 근무 시작일 (type="date")
  endDate: string;       // 퇴사일 (type="date")
  detail: string;        // 경험 내용
}

export interface BootcampEntry {
  id: string;
  name: string;          // 교육/부트캠프 명
  topic: string;         // 교육 주제 또는 주요 내용
  detail: string;        // 세부 경험 내용
}

export interface CommonEntry {
  id: string;
  title: string;         // 프로젝트명, 동아리명 등
  detail: string;        // 세부 내용
}

export interface ExperienceState {
  기본정보: {
    name: string;
    engName: string;
    birthDate: string;
    education: EducationEntry[];
  };
  자격증상: CertEntry[];
  경력인턴: CareerEntry[];
  교육부트캠프: BootcampEntry[];
  프로젝트: CommonEntry[];
  동아리: CommonEntry[];
  봉사활동: CommonEntry[];
  기타경험: CommonEntry[];
}

interface LocationState {
  category?: CategoryKey;
  fromSignup?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────
const CATEGORIES: { key: CategoryKey; label: string; icon: any }[] = [
  { key: '기본정보', label: '기본정보', icon: User },
  { key: '자격증상', label: '자격증/수상', icon: Award },
  { key: '경력인턴', label: '경력/인턴', icon: Briefcase },
  { key: '교육부트캠프', label: '교육/부트캠프', icon: GraduationCap },
  { key: '프로젝트', label: '프로젝트', icon: Cpu },
  { key: '동아리', label: '동아리', icon: Users },
  { key: '봉사활동', label: '봉사활동', icon: Heart },
  { key: '기타경험', label: '기타 경험 사항', icon: Compass },
];

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  기본정보: '기본 정보',
  자격증상: '자격증 / 수상',
  경력인턴: '경력 / 인턴',
  교육부트캠프: '교육 / 부트캠프',
  프로젝트: '프로젝트',
  동아리: '동아리',
  봉사활동: '봉사활동',
  기타경험: '기타 경험 사항',
};

// ─── Empty Default State (빈 양식 — 데모 데이터 없음) ─────────────
const DEFAULT_STATE: ExperienceState = {
  기본정보: { name: '', engName: '', birthDate: '', education: [{ schoolName: '', admissionDate: '', graduationDate: '' }] },
  자격증상: [{ id: '1', name: '', date: '', organization: '' }],
  경력인턴: [{ id: '1', company: '', department: '', startDate: '', endDate: '', detail: '' }],
  교육부트캠프: [{ id: '1', name: '', topic: '', detail: '' }],
  프로젝트: [{ id: '1', title: '', detail: '' }],
  동아리: [{ id: '1', title: '', detail: '' }],
  봉사활동: [{ id: '1', title: '', detail: '' }],
  기타경험: [{ id: '1', title: '', detail: '' }],
};

// DB 응답 정규화: 빈 배열인 카테고리에 빈 항목 1개 추가 (form input이 작동하려면 최소 1개 필요)
function normalizeProfile(data: Partial<ExperienceState>): ExperienceState {
  return {
    기본정보: data.기본정보 ?? DEFAULT_STATE.기본정보,
    자격증상: data.자격증상 ?? [],
    경력인턴: data.경력인턴?.length ? data.경력인턴 : [{ id: '1', company: '', department: '', startDate: '', endDate: '', detail: '' }],
    교육부트캠프: data.교육부트캠프?.length ? data.교육부트캠프 : [{ id: '1', name: '', topic: '', detail: '' }],
    프로젝트: data.프로젝트?.length ? data.프로젝트 : [{ id: '1', title: '', detail: '' }],
    동아리: data.동아리?.length ? data.동아리 : [{ id: '1', title: '', detail: '' }],
    봉사활동: data.봉사활동?.length ? data.봉사활동 : [{ id: '1', title: '', detail: '' }],
    기타경험: data.기타경험?.length ? data.기타경험 : [{ id: '1', title: '', detail: '' }],
  };
}

// ─── Component: AI Notice Banner ──────────────────────────────────
function AICoverLetterNotice() {
  return (
    <div className={styles.aiNoticeBanner}>
      <Info size={20} className={styles.aiNoticeIcon} />
      <div className={styles.aiNoticeContent}>
        <h4 className={styles.aiNoticeTitle}>💡 AI 자기소개서 작성을 위한 꿀팁!</h4>
        <p className={styles.aiNoticeText}>
          이곳에 등록해주시는 세부 경험 사항들을 토대로 <strong>서류 적합도가 높은 맞춤형 자기소개서 초안</strong>을 자동으로 설계해 드립니다.<br />
          조금 더 세세하게 경험 내용을 적어주실수록 고품질의 자소서가 완성되지만, 
          <strong> 지금 적을 내용이 생각나지 않거나 간단히만 적어주셔도 자소서 탭에서 AI 멘토가 친절한 멀티턴 대화를 통해 경험 스토리를 함께 발굴하고 살을 붙여주니 안심하고 편하게 작성해 주세요!</strong>
        </p>
      </div>
    </div>
  );
}

export default function ExperienceEditPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as LocationState;

  // 1. 계정 전환 시 즉시 반영되도록 authStore에서 user를 가져옴
  const { user } = useAuthStore();
  const dbKey = user ? `experience_profile_${user.id}` : 'experience_profile_guest';

  // 2. Load stored experience state
  const loadSavedState = (): ExperienceState => {
    const saved = localStorage.getItem(dbKey);
    if (saved) {
      try {
        return normalizeProfile(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse experience profile:', e);
      }
    }
    return DEFAULT_STATE;
  };

  const fromSignup = state.fromSignup ?? false;
  const [activeCategory, setActiveCategory] = useState<CategoryKey>(state.category || '기본정보');
  const [profile, setProfile] = useState<ExperienceState>(DEFAULT_STATE);
  const [profileReady, setProfileReady] = useState(false);
  const [activeCommonIdx, setActiveCommonIdx] = useState(0);

  // 3. DB에서 경험 데이터 로드 (DB가 항상 소스 오브 트루스)
  useEffect(() => {
    const fetchExperienceFromDB = async () => {
      try {
        const res = await api.get('/experience');
        if (res.data) {
          const normalized = normalizeProfile(res.data);
          setProfile(normalized);
          localStorage.setItem(dbKey, JSON.stringify(normalized));
        }
      } catch (err) {
        // DB 실패 시 localStorage 데이터로 폴백
        const fallback = loadSavedState();
        setProfile(fallback);
        console.warn('⚠️ [DB Sync] 서버 연동 실패, 로컬 데이터 사용:', err);
      } finally {
        setProfileReady(true);
      }
    };
    fetchExperienceFromDB();
  }, [dbKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // 4. Track category progress (Check if actually filled in)
  const isCategoryComplete = (cat: CategoryKey): boolean => {
    if (cat === '기본정보') {
      const b = profile.기본정보;
      return !!(
        b.name && 
        b.birthDate && 
        b.education.length > 0 && 
        b.education.every(edu => edu.schoolName && edu.admissionDate && edu.graduationDate)
      );
    }
    if (cat === '자격증상') {
      return profile.자격증상.length > 0 && profile.자격증상.every(c => c.name && c.date && c.organization);
    }
    if (cat === '경력인턴') {
      return profile.경력인턴.length > 0 && profile.경력인턴.every(c => c.company && c.department && c.startDate && c.endDate && c.detail);
    }
    if (cat === '교육부트캠프') {
      return profile.교육부트캠프.length > 0 && profile.교육부트캠프.every(c => c.name && c.topic && c.detail);
    }
    const array = profile[cat] as CommonEntry[];
    return array.length > 0 && array.every(c => c.title && c.detail);
  };

  const completedCount = CATEGORIES.filter((c) => isCategoryComplete(c.key)).length;
  const progress = Math.round((completedCount / CATEGORIES.length) * 100);

  const categoryIdx = CATEGORIES.findIndex((c) => c.key === activeCategory);
  const prevCategory = CATEGORIES[categoryIdx - 1]?.key;
  const nextCategory = CATEGORIES[categoryIdx + 1]?.key;

  // 5. Save and navigation handlers (POST API 실시간 동기화 포함)
  const handleSave = async (silent = false) => {
    // 5-1. 브라우저 로컬 저장
    localStorage.setItem(dbKey, JSON.stringify(profile));

    // 5-2. 백엔드 PostgreSQL DB 실시간 영구 저장 수행
    try {
      await api.post('/experience', profile);
      if (!silent) {
        alert('모든 입력 사항이 데이터베이스(DB)에 안전하게 영구 저장되었습니다!');
      }
    } catch (err) {
      console.error('❌ DB 저장 실패:', err);
      if (!silent) {
        alert('로컬 저장은 수행되었으나, 서버 데이터베이스 저장 중 오류가 발생했습니다.');
      }
    }
  };

  const handleSaveAndNext = async () => {
    await handleSave(true);
    if (nextCategory) {
      setActiveCategory(nextCategory);
      setActiveCommonIdx(0);
    } else {
      if (fromSignup) {
        navigate(ROUTES.HOME);
      } else {
        navigate(ROUTES.MYPAGE);
      }
    }
  };

  // ─── Render Sub-Forms ───────────────────────────────────────────

  // (1) 기본 정보 입력 폼
  const renderBasicInfoForm = () => {
    const data = profile.기본정보;
    const updateField = (field: keyof typeof data, val: any) => {
      setProfile((prev) => ({
        ...prev,
        기본정보: { ...prev.기본정보, [field]: val }
      }));
    };

    const addSchool = () => {
      const newEdu: EducationEntry = { schoolName: '', admissionDate: '', graduationDate: '' };
      updateField('education', [...data.education, newEdu]);
    };

    const removeSchool = (idx: number) => {
      if (data.education.length <= 1) return;
      updateField('education', data.education.filter((_, i) => i !== idx));
    };

    const updateSchool = (idx: number, field: keyof EducationEntry, val: string) => {
      const nextEdus = data.education.map((edu, i) => 
        i === idx ? { ...edu, [field]: val } : edu
      );
      updateField('education', nextEdus);
    };

    return (
      <div className={styles.formArea}>
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>기본 인적사항</h3>
          <div className={styles.fieldGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>성명 <span className={styles.required}>*</span></label>
              <input 
                className={styles.fieldInput} 
                value={data.name} 
                onChange={(e) => updateField('name', e.target.value)} 
                placeholder="김민준" 
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>영문 이름</label>
              <input 
                className={styles.fieldInput} 
                value={data.engName} 
                onChange={(e) => updateField('engName', e.target.value)} 
                placeholder="Minjun Kim" 
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>출생년월일 <span className={styles.required}>*</span></label>
              <input 
                type="date"
                className={styles.fieldInput} 
                value={data.birthDate} 
                onChange={(e) => updateField('birthDate', e.target.value)} 
              />
            </div>
          </div>
        </div>

        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>학력 정보</h3>
          <p className={styles.detailHint}>고등학교, 대학교, 대학원 등 학업 이력을 상세히 입력해 주세요.</p>
          
          {data.education.map((edu, idx) => (
            <div key={idx} className={styles.educationRow}>
              <input 
                className={styles.fieldInput} 
                value={edu.schoolName} 
                onChange={(e) => updateSchool(idx, 'schoolName', e.target.value)} 
                placeholder="학교명 및 전공 (예: 서울대학교 컴퓨터공학)" 
              />
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} style={{ fontSize: '0.68rem', fontWeight: 'bold' }}>입학날짜 <span className={styles.required}>*</span></label>
                <input 
                  type="date"
                  className={styles.fieldInput} 
                  value={edu.admissionDate} 
                  onChange={(e) => updateSchool(idx, 'admissionDate', e.target.value)} 
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} style={{ fontSize: '0.68rem', fontWeight: 'bold' }}>졸업날짜 <span className={styles.required}>*</span></label>
                <input 
                  type="date"
                  className={styles.fieldInput} 
                  value={edu.graduationDate} 
                  onChange={(e) => updateSchool(idx, 'graduationDate', e.target.value)} 
                />
              </div>
              {data.education.length > 1 && (
                <button 
                  className={styles.deleteRowBtn} 
                  onClick={() => removeSchool(idx)} 
                  title="삭제"
                  style={{ marginTop: '16px' }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}

          <button className={styles.addRowBtn} onClick={addSchool}>
            <Plus size={14} /> 학력 추가
          </button>
        </div>
      </div>
    );
  };

  // (2) 자격증 및 수상 내역 폼
  const renderCertForm = () => {
    const list = profile.자격증상;
    const updateList = (newList: CertEntry[]) => {
      setProfile((prev) => ({ ...prev, 자격증상: newList }));
    };

    const addCert = () => {
      const newCert: CertEntry = { id: Date.now().toString(), name: '', date: '', organization: '' };
      updateList([...list, newCert]);
    };

    const removeCert = (idx: number) => {
      if (list.length <= 1) {
        updateList([{ id: '1', name: '', date: '', organization: '' }]);
        return;
      }
      updateList(list.filter((_, i) => i !== idx));
    };

    const updateCert = (idx: number, field: keyof CertEntry, val: string) => {
      const next = list.map((item, i) => 
        i === idx ? { ...item, [field]: val } : item
      );
      updateList(next);
    };

    return (
      <div className={styles.formArea}>
        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>자격증 및 수상 내역</h3>
          <p className={styles.detailHint}>보유하신 자격증이나 교내외 수상 경력을 작성해 주세요.</p>
          
          {list.map((cert, idx) => (
            <div key={cert.id} className={styles.certRow}>
              <input 
                className={styles.fieldInput} 
                value={cert.name} 
                onChange={(e) => updateCert(idx, 'name', e.target.value)} 
                placeholder="자격증 또는 대회/상 명칭" 
              />
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} style={{ fontSize: '0.68rem', fontWeight: 'bold' }}>취득일/수상일 <span className={styles.required}>*</span></label>
                <input 
                  type="date"
                  className={styles.fieldInput} 
                  value={cert.date} 
                  onChange={(e) => updateCert(idx, 'date', e.target.value)} 
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} style={{ fontSize: '0.68rem', fontWeight: 'bold' }}>발급기관명 <span className={styles.required}>*</span></label>
                <input 
                  className={styles.fieldInput} 
                  value={cert.organization} 
                  onChange={(e) => updateCert(idx, 'organization', e.target.value)} 
                  placeholder="예: 한국산업인력공단" 
                />
              </div>
              <button 
                className={styles.deleteRowBtn} 
                onClick={() => removeCert(idx)} 
                title="삭제"
                style={{ marginTop: '16px' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <button className={styles.addRowBtn} onClick={addCert}>
            <Plus size={14} /> 자격/수상 추가
          </button>
        </div>
      </div>
    );
  };

  // (3) 경력/인턴 전용 폼 (시작일/퇴사일 나란히 회사명-부서랑 배치)
  const renderCareerForm = () => {
    const list = profile.경력인턴;
    const updateList = (newList: CareerEntry[]) => {
      setProfile((prev) => ({ ...prev, 경력인턴: newList }));
    };

    const activeEntry = list[activeCommonIdx] || { id: '1', company: '', department: '', startDate: '', endDate: '', detail: '' };

    const addEntry = () => {
      const newEntry: CareerEntry = { id: Date.now().toString(), company: '', department: '', startDate: '', endDate: '', detail: '' };
      updateList([...list, newEntry]);
      setActiveCommonIdx(list.length);
    };

    const removeEntry = (idx: number) => {
      if (list.length <= 1) {
        updateList([{ id: Date.now().toString(), company: '', department: '', startDate: '', endDate: '', detail: '' }]);
        setActiveCommonIdx(0);
        return;
      }
      const next = list.filter((_, i) => i !== idx);
      updateList(next);
      setActiveCommonIdx(Math.min(activeCommonIdx, next.length - 1));
    };

    const updateActiveField = (field: keyof CareerEntry, val: string) => {
      const next = list.map((item, i) => 
        i === activeCommonIdx ? { ...item, [field]: val } : item
      );
      updateList(next);
    };

    return (
      <div className={styles.formArea}>
        <div className={styles.entryTabs}>
          {list.map((item, i) => (
            <div
              key={item.id}
              className={`${styles.entryTab} ${i === activeCommonIdx ? styles.entryTabActive : ''}`}
              onClick={() => setActiveCommonIdx(i)}
            >
              {item.detail && i !== activeCommonIdx && (
                <CheckCircle size={14} className={styles.tabCheckDone} />
              )}
              {i === activeCommonIdx && item.detail && (
                <CheckCircle size={14} className={styles.tabCheck} />
              )}
              {!item.detail && <span className={styles.tabNum}>{i + 1}</span>}
              <div className={styles.tabInfo}>
                <span className={styles.tabCompany}>{item.company || '(회사명 미입력)'}</span>
                <span className={styles.tabRole}>{item.department || '경력/인턴'}</span>
              </div>
              {list.length > 1 && (
                <button
                  className={styles.tabDeleteBtn}
                  onClick={(ev) => { ev.stopPropagation(); removeEntry(i); }}
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

        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>🏢 경력 및 인턴 상세 정보</h3>
          <div className={styles.fieldGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>회사명 <span className={styles.required}>*</span></label>
              <input 
                className={styles.fieldInput}
                value={activeEntry.company} 
                onChange={(e) => updateActiveField('company', e.target.value)} 
                placeholder="예: 네이버 주식회사" 
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>부서 <span className={styles.required}>*</span></label>
              <input 
                className={styles.fieldInput}
                value={activeEntry.department} 
                onChange={(e) => updateActiveField('department', e.target.value)} 
                placeholder="예: 검색플랫폼 개발팀" 
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>근무 시작일 <span className={styles.required}>*</span></label>
              <input 
                type="date"
                className={styles.fieldInput}
                value={activeEntry.startDate} 
                onChange={(e) => updateActiveField('startDate', e.target.value)} 
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>퇴사일 <span className={styles.required}>*</span></label>
              <input 
                type="date"
                className={styles.fieldInput}
                value={activeEntry.endDate} 
                onChange={(e) => updateActiveField('endDate', e.target.value)} 
              />
            </div>
          </div>
        </div>

        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>📝 경력기술(서) 및 업무 경험 내용 <span className={styles.required}>*</span></h3>
          <p className={styles.detailHint}>해당 회사에서 담당하셨던 주요 프로젝트, 업무 내용, 성과 및 기술 스택을 구체적으로 기재해 주세요.</p>
          <textarea
            className={styles.detailTextarea}
            value={activeEntry.detail}
            onChange={(e) => updateActiveField('detail', e.target.value)}
            placeholder="구체적인 성과 및 맡은 역할을 자세히 적을수록 자기소개서 품질이 비약적으로 상승합니다."
            rows={8}
          />
        </div>
      </div>
    );
  };

  // (4) 교육/부트캠프 전용 폼
  const renderBootcampForm = () => {
    const list = profile.교육부트캠프;
    const updateList = (newList: BootcampEntry[]) => {
      setProfile((prev) => ({ ...prev, 교육부트캠프: newList }));
    };

    const activeEntry = list[activeCommonIdx] || { id: '1', name: '', topic: '', detail: '' };

    const addEntry = () => {
      const newEntry: BootcampEntry = { id: Date.now().toString(), name: '', topic: '', detail: '' };
      updateList([...list, newEntry]);
      setActiveCommonIdx(list.length);
    };

    const removeEntry = (idx: number) => {
      if (list.length <= 1) {
        updateList([{ id: Date.now().toString(), name: '', topic: '', detail: '' }]);
        setActiveCommonIdx(0);
        return;
      }
      const next = list.filter((_, i) => i !== idx);
      updateList(next);
      setActiveCommonIdx(Math.min(activeCommonIdx, next.length - 1));
    };

    const updateActiveField = (field: keyof BootcampEntry, val: string) => {
      const next = list.map((item, i) => 
        i === activeCommonIdx ? { ...item, [field]: val } : item
      );
      updateList(next);
    };

    return (
      <div className={styles.formArea}>
        <div className={styles.entryTabs}>
          {list.map((item, i) => (
            <div
              key={item.id}
              className={`${styles.entryTab} ${i === activeCommonIdx ? styles.entryTabActive : ''}`}
              onClick={() => setActiveCommonIdx(i)}
            >
              {item.detail && i !== activeCommonIdx && (
                <CheckCircle size={14} className={styles.tabCheckDone} />
              )}
              {i === activeCommonIdx && item.detail && (
                <CheckCircle size={14} className={styles.tabCheck} />
              )}
              {!item.detail && <span className={styles.tabNum}>{i + 1}</span>}
              <div className={styles.tabInfo}>
                <span className={styles.tabCompany}>{item.name || '(교육기관 미입력)'}</span>
                <span className={styles.tabRole}>{item.topic || '교육/부트캠프'}</span>
              </div>
              {list.length > 1 && (
                <button
                  className={styles.tabDeleteBtn}
                  onClick={(ev) => { ev.stopPropagation(); removeEntry(i); }}
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

        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>🎓 교육 및 부트캠프 정보</h3>
          <div className={styles.fieldGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>교육/부트캠프 명 <span className={styles.required}>*</span></label>
              <input 
                className={styles.fieldInput}
                value={activeEntry.name} 
                onChange={(e) => updateActiveField('name', e.target.value)} 
                placeholder="예: 우아한테크코스 5기" 
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>교육 주제 또는 주요 내용 <span className={styles.required}>*</span></label>
              <input 
                className={styles.fieldInput}
                value={activeEntry.topic} 
                onChange={(e) => updateActiveField('topic', e.target.value)} 
                placeholder="예: 프론트엔드 모던 웹 아키텍처 과정" 
              />
            </div>
          </div>
        </div>

        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>📝 세부 교육 경험 내용 <span className={styles.required}>*</span></h3>
          <p className={styles.detailHint}>해당 교육과정에서 학습한 핵심 기술, 진행했던 팀 프로젝트나 실무 협업 설계 내용을 구체적으로 기재해 주세요.</p>
          <textarea
            className={styles.detailTextarea}
            value={activeEntry.detail}
            onChange={(e) => updateActiveField('detail', e.target.value)}
            placeholder="학습한 핵심 이론 및 프로젝트 진행 성과를 작성해 주세요."
            rows={8}
          />
        </div>
      </div>
    );
  };

  // (5) 프로젝트, 동아리, 봉사활동, 기타경험 공통 컴포넌트
  const renderCommonForm = (catKey: '프로젝트' | '동아리' | '봉사활동' | '기타경험') => {
    const list = profile[catKey] as CommonEntry[];
    const updateList = (newList: CommonEntry[]) => {
      setProfile((prev) => ({ ...prev, [catKey]: newList }));
    };

    const activeEntry = list[activeCommonIdx] || { id: '1', title: '', detail: '' };

    const addEntry = () => {
      const newEntry: CommonEntry = { id: Date.now().toString(), title: '', detail: '' };
      updateList([...list, newEntry]);
      setActiveCommonIdx(list.length);
    };

    const removeEntry = (idx: number) => {
      if (list.length <= 1) {
        updateList([{ id: Date.now().toString(), title: '', detail: '' }]);
        setActiveCommonIdx(0);
        return;
      }
      const next = list.filter((_, i) => i !== idx);
      updateList(next);
      setActiveCommonIdx(Math.min(activeCommonIdx, next.length - 1));
    };

    const updateActiveField = (field: keyof CommonEntry, val: string) => {
      const next = list.map((item, i) => 
        i === activeCommonIdx ? { ...item, [field]: val } : item
      );
      updateList(next);
    };

    // 카테고리별 맞춤 라벨 설정
    const labels = {
      프로젝트: {
        titleLabel: '프로젝트명',
        titlePlaceholder: '예: 실시간 취업 코칭 플랫폼 CareerAI',
        detailLabel: '프로젝트 세부 내용',
        detailHint: '프로젝트의 주요 기능, 사용 기술 스택, 담당 아키텍처 및 본인의 기여 성과를 입력해 주세요.',
        detailPlaceholder: 'Vite와 React, TypeScript를 이용해 피드백 전용 서비스 대시보드를 전면 빌드한 경험 등'
      },
      동아리: {
        titleLabel: '동아리명',
        titlePlaceholder: '예: 컴퓨터 학술 동아리 SCSA',
        detailLabel: '동아리 세부 내용',
        detailHint: '동아리 내에서 맡으신 직책, 수행한 프로젝트, 활동 및 핵심 협업 경험을 적어주세요.',
        detailPlaceholder: '매주 알고리즘 모의테스트 주최 및 멘토링 역할 수행 등'
      },
      봉사활동: {
        titleLabel: '봉사활동 기관/명칭',
        titlePlaceholder: '예: 지역 다문화가정 아동 IT 교육 연합회',
        detailLabel: '봉사활동 세부 내용',
        detailHint: '봉사활동에서 본인이 담당하셨던 교육, 시설 지원 등 세부 기여 경험을 구체적으로 기재해 주세요.',
        detailPlaceholder: '소외계층 아동을 대상으로 주말 스크래치 코딩 기초 멘토링 강사로 활동 등'
      },
      기타경험: {
        titleLabel: '활동/경험명',
        titlePlaceholder: '예: 오픈소스 프로젝트 PR 컨트리뷰션 기여',
        detailLabel: '경험 세부 내용',
        detailHint: '그 외 자기소개서에 활용할 수 있는 모든 직무 연관 대외활동이나 기타 경험 사항들을 기재해 주세요.',
        detailPlaceholder: 'React 기반 오픈소스 라이브러리의 컴포넌트 영문 교정 및 병합 완료 성과 등'
      }
    }[catKey];

    return (
      <div className={styles.formArea}>
        <div className={styles.entryTabs}>
          {list.map((item, i) => (
            <div
              key={item.id}
              className={`${styles.entryTab} ${i === activeCommonIdx ? styles.entryTabActive : ''}`}
              onClick={() => setActiveCommonIdx(i)}
            >
              {item.detail && i !== activeCommonIdx && (
                <CheckCircle size={14} className={styles.tabCheckDone} />
              )}
              {i === activeCommonIdx && item.detail && (
                <CheckCircle size={14} className={styles.tabCheck} />
              )}
              {!item.detail && <span className={styles.tabNum}>{i + 1}</span>}
              <div className={styles.tabInfo}>
                <span className={styles.tabCompany}>{item.title || `(${labels.titleLabel} 미입력)`}</span>
                <span className={styles.tabRole}>{catKey} 경험 #{i + 1}</span>
              </div>
              {list.length > 1 && (
                <button
                  className={styles.tabDeleteBtn}
                  onClick={(ev) => { ev.stopPropagation(); removeEntry(i); }}
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

        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>⚙️ {labels.titleLabel} <span className={styles.required}>*</span></h3>
          <input 
            className={styles.fieldInput} 
            style={{ fontWeight: '700', fontSize: '0.95rem', borderLeft: '4px solid var(--color-primary)' }}
            value={activeEntry.title} 
            onChange={(e) => updateActiveField('title', e.target.value)} 
            placeholder={labels.titlePlaceholder} 
          />
        </div>

        <div className={styles.formCard}>
          <h3 className={styles.formCardTitle}>📝 {labels.detailLabel} <span className={styles.required}>*</span></h3>
          <p className={styles.detailHint}>{labels.detailHint}</p>
          <textarea
            className={styles.detailTextarea}
            value={activeEntry.detail}
            onChange={(e) => updateActiveField('detail', e.target.value)}
            placeholder={labels.detailPlaceholder}
            rows={8}
          />
        </div>
      </div>
    );
  };

  // ─── Master Form Router ─────────────────────────────────────────
  const renderActiveForm = () => {
    switch (activeCategory) {
      case '기본정보':
        return renderBasicInfoForm();
      case '자격증상':
        return renderCertForm();
      case '경력인턴':
        return renderCareerForm();
      case '교육부트캠프':
        return renderBootcampForm();
      default:
        return renderCommonForm(activeCategory);
    }
  };

  return (
    <div className={styles.page}>
      {/* 좌측 사이드바 */}
      <aside className={styles.sidebar}>
        <Link to={ROUTES.HOME} className={styles.logo}>
          <div className={styles.logoIcon}>C</div>
          <span className={styles.logoText}>CareerAI</span>
        </Link>

        <p className={styles.sidebarHeading}>입력 항목</p>

        <nav className={styles.stepList}>
          {CATEGORIES.map((cat) => {
            const isDone = isCategoryComplete(cat.key);
            const isActive = activeCategory === cat.key;
            const CatIcon = cat.icon;
            return (
              <button
                key={cat.key}
                className={`${styles.stepItem} ${isActive ? styles.stepActive : ''}`}
                onClick={() => {
                  setActiveCategory(cat.key);
                  setActiveCommonIdx(0);
                }}
              >
                {isDone ? (
                  <CheckCircle size={16} className={styles.stepIconDone} />
                ) : (
                  <Circle size={16} className={`${styles.stepIconEmpty} ${isActive ? styles.stepIconActive : ''}`} />
                )}
                <CatIcon size={15} style={{ flexShrink: 0 }} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </nav>

        {/* 하단 완성도 게이지 */}
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

      {/* 우측 메인 영역 */}
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
          <AICoverLetterNotice />
          {profileReady ? renderActiveForm() : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              경험 데이터를 불러오는 중...
            </div>
          )}
        </div>

        {/* 액션 하단 바 */}
        <div className={styles.actionBar}>
          <button
            className={styles.prevBtn}
            onClick={() => {
              if (prevCategory) {
                setActiveCategory(prevCategory);
                setActiveCommonIdx(0);
              } else {
                navigate(ROUTES.MYPAGE);
              }
            }}
          >
            ← 이전 단계
          </button>
          <div className={styles.actionRight}>
            <button className={styles.saveBtn} onClick={() => handleSave(false)}>임시 저장</button>
            <button className={styles.nextBtn} onClick={handleSaveAndNext}>
              {nextCategory ? '저장 후 다음 단계 →' : '작성 완료 및 완료 페이지로 →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
