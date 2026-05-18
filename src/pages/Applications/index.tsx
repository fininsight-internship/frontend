import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { ROUTES } from '../../constants';
import styles from './Applications.module.css';

type Status = 'done' | 'in_progress' | 'waiting';

interface Application {
  company: string;
  role: string;
  score: number | null;
  deadline: string | null;
  jd: Status;
  resume: Status;
  interview: Status;
}

const MOCK_APPS: Application[] = [
  { company: '네이버', role: '프론트엔드 개발자', score: 91, deadline: '2026년 07월 15일', jd: 'done', resume: 'done', interview: 'in_progress' },
  { company: '라인', role: '풀스택 개발자', score: 78, deadline: '2026년 07월 31일', jd: 'done', resume: 'in_progress', interview: 'waiting' },
  { company: '카카오', role: '백엔드 개발자', score: 82, deadline: '2026년 06월 30일', jd: 'done', resume: 'in_progress', interview: 'waiting' },
  { company: '삼성전자', role: '소프트웨어 엔지니어', score: null, deadline: '2026년 06월 20일', jd: 'waiting', resume: 'waiting', interview: 'waiting' },
  { company: '토스', role: '서버 개발자', score: null, deadline: '2026년 06월 25일', jd: 'waiting', resume: 'waiting', interview: 'waiting' },
  { company: '토스', role: '프론트엔드 개발자', score: null, deadline: null, jd: 'waiting', resume: 'waiting', interview: 'waiting' },
];

const JD_LABEL: Record<Status, string> = { done: '완료', in_progress: '진행중', waiting: '대기' };
const RESUME_LABEL: Record<Status, string> = { done: '완료', in_progress: '작성중', waiting: '대기' };
const INTERVIEW_LABEL: Record<Status, string> = { done: '완료', in_progress: '진행중', waiting: '대기' };
const STATUS_CLASS: Record<Status, string> = { done: 'btnDone', in_progress: 'btnProgress', waiting: 'btnWaiting' };

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filtered = MOCK_APPS.filter(
    (a) =>
      a.company.toLowerCase().includes(query.toLowerCase()) ||
      a.role.toLowerCase().includes(query.toLowerCase()),
  );

  const handleCardClick = (app: Application) => {
    if (app.jd !== 'done') navigate(ROUTES.ANALYSIS);
    else if (app.resume !== 'done') navigate(ROUTES.RESUME);
    else navigate(ROUTES.INTERVIEW);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>지원 현황</h1>
        <p className={styles.subtitle}>모든 지원 파이프라인을 관리합니다.</p>
      </div>

      {/* Search */}
      <div className={styles.searchWrap}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="기업명 또는 직무 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Application list */}
      <div className={styles.list}>
        {filtered.map((app, i) => (
          <div key={i} className={styles.card} onClick={() => handleCardClick(app)}>
            <div className={styles.cardLeft}>
              <div className={styles.companyRow}>
                <span className={styles.companyName}>{app.company}</span>
                {app.score !== null && (
                  <span className={styles.scoreBadge}>{app.score}점</span>
                )}
              </div>
              <p className={styles.role}>{app.role}</p>
              {app.deadline && (
                <p className={styles.deadline}>마감: {app.deadline}</p>
              )}
            </div>

            <div className={styles.pipeline} onClick={(e) => e.stopPropagation()}>
              <div className={styles.pipelineItem}>
                <span className={styles.pipelineLabel}>JD분석</span>
                <button className={`${styles.statusBtn} ${styles[STATUS_CLASS[app.jd]]}`}>
                  {JD_LABEL[app.jd]}
                </button>
              </div>
              <div className={styles.pipelineItem}>
                <span className={styles.pipelineLabel}>자소서</span>
                <button className={`${styles.statusBtn} ${styles[STATUS_CLASS[app.resume]]}`}>
                  {RESUME_LABEL[app.resume]}
                </button>
              </div>
              <div className={styles.pipelineItem}>
                <span className={styles.pipelineLabel}>면접</span>
                <button className={`${styles.statusBtn} ${styles[STATUS_CLASS[app.interview]]}`}>
                  {INTERVIEW_LABEL[app.interview]}
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className={styles.empty}>검색 결과가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
