import { useState, useEffect } from 'react';
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

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const JD_LABEL: Record<Status, string> = { done: '완료', in_progress: '진행중', waiting: '대기' };
  const RESUME_LABEL: Record<Status, string> = { done: '완료', in_progress: '작성중', waiting: '대기' };
  const INTERVIEW_LABEL: Record<Status, string> = { done: '완료', in_progress: '진행중', waiting: '대기' };
  const STATUS_CLASS: Record<Status, string> = { done: 'btnDone', in_progress: 'btnProgress', waiting: 'btnWaiting' };

  useEffect(() => {
    import('../../services/api').then((mod) => {
      mod.default.get('/user/applications').then((res) => {
        setApps(res.data);
        setLoading(false);
      }).catch((err) => {
        console.error(err);
        setLoading(false);
      });
    });
  }, []);

  const filtered = apps.filter(
    (a) =>
      a.company.toLowerCase().includes(query.toLowerCase()) ||
      a.role.toLowerCase().includes(query.toLowerCase()),
  );

  const handleCardClick = (app: Application) => {
    navigate(ROUTES.APPLICATION_DETAIL, { state: { app } });
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
        {loading && <div style={{ padding: '2rem', textAlign: 'center' }}>불러오는 중...</div>}
        {!loading && filtered.map((app, i) => (
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
                <button
                  className={`${styles.statusBtn} ${styles[STATUS_CLASS[app.jd]]}`}
                  onClick={(e) => { e.stopPropagation(); navigate(ROUTES.ANALYSIS); }}
                >
                  {JD_LABEL[app.jd]}
                </button>
              </div>
              <div className={styles.pipelineItem}>
                <span className={styles.pipelineLabel}>자소서</span>
                <button
                  className={`${styles.statusBtn} ${styles[STATUS_CLASS[app.resume]]}`}
                  onClick={(e) => { e.stopPropagation(); navigate(ROUTES.RESUME); }}
                >
                  {RESUME_LABEL[app.resume]}
                </button>
              </div>
              <div className={styles.pipelineItem}>
                <span className={styles.pipelineLabel}>면접</span>
                <button
                  className={`${styles.statusBtn} ${styles[STATUS_CLASS[app.interview]]}`}
                  onClick={(e) => { e.stopPropagation(); navigate(ROUTES.INTERVIEW); }}
                >
                  {INTERVIEW_LABEL[app.interview]}
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className={styles.empty}>지원 내역이 없습니다. 새로운 분석을 시작해보세요!</div>
        )}
      </div>
    </div>
  );
}
