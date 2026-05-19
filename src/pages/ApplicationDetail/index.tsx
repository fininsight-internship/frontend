import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Plus } from 'lucide-react';
import { ROUTES } from '../../constants';
import styles from './ApplicationDetail.module.css';

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

type TabType = 'jd' | 'resume' | 'interview';

/* ── 탭별 Mock 데이터 ── */
const MOCK_JD_REPORT = {
  scores: {
    overall: 91,
    tech: 94,
    experience: 89,
    culture: 88,
  },
  strategy: {
    requiredSkills: ['TypeScript', 'React', 'Next.js', 'GraphQL', 'WebPerformance'],
    companyOverview: '네이버는 국내 1위 포털 서비스를 운영하며 클라우드, AI, 커머스 사업으로 확장 중입니다.',
    talentProfile: '최신 프론트엔드 기술에 능통하고 성능 최적화 경험이 있는 인재',
    coreStrategy: 'AI 기반 검색 고도화 및 글로바 서비스 확장, 기술 내재화를 통한 경쟁력 강화',
  },
};

interface ResumeQuestion {
  id: number;
  text: string;
  status: 'done' | 'in_progress' | 'waiting';
  feedbackScore: number | null;
}

const MOCK_RESUME_QUESTIONS: ResumeQuestion[] = [
  { id: 1, text: '팀 프로젝트에서 갈등을 해결한 경험을 서술하세요.', status: 'in_progress', feedbackScore: 85 },
];

const STATUS_TEXT: Record<string, string> = {
  done: '작성 완료',
  in_progress: '작성 중',
  waiting: '미작성',
};

export default function ApplicationDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const app = (location.state as { app: Application } | null)?.app;

  const [activeTab, setActiveTab] = useState<TabType>('jd');
  const [questions, setQuestions] = useState<ResumeQuestion[]>(MOCK_RESUME_QUESTIONS);

  if (!app) {
    navigate(ROUTES.APPLICATIONS);
    return null;
  }

  const report = MOCK_JD_REPORT;

  const handleAddQuestion = () => {
    const text = prompt('새 자기소개서 문항을 입력하세요.');
    if (!text?.trim()) return;
    setQuestions((prev) => [
      ...prev,
      { id: Date.now(), text: text.trim(), status: 'waiting', feedbackScore: null },
    ]);
  };

  return (
    <div className={styles.page}>
      {/* ── 헤더 ── */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(ROUTES.APPLICATIONS)}>
          <ArrowLeft size={18} />
        </button>
        <div className={styles.headerInfo}>
          <div className={styles.titleRow}>
            <h1 className={styles.companyName}>{app.company}</h1>
            {app.score !== null && (
              <span className={styles.scoreBadge}>{app.score}점</span>
            )}
          </div>
          <div className={styles.metaRow}>
            <span className={styles.role}>{app.role}</span>
            <button className={styles.jdLink}>
              <ExternalLink size={13} />
              공고 보기
            </button>
            {app.deadline && (
              <span className={styles.deadline}>마감: {app.deadline}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── 탭 ── */}
      <div className={styles.tabs}>
        {(['jd', 'resume', 'interview'] as TabType[]).map((tab) => {
          const labels: Record<TabType, string> = {
            jd: 'JD 분석 보고서',
            resume: '자기소개서',
            interview: '면접 연습',
          };
          return (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ── JD 분석 보고서 탭 ── */}
      {activeTab === 'jd' && (
        <div className={styles.tabContent}>
          {app.jd === 'waiting' ? (
            <div className={styles.emptyState}>
              <p>아직 JD 분석이 완료되지 않았습니다.</p>
              <button className={styles.actionBtn} onClick={() => navigate(ROUTES.ANALYSIS)}>
                분석 시작하기
              </button>
            </div>
          ) : (
            <>
              {/* 점수 카드 2x2 */}
              <div className={styles.scoreGrid}>
                <div className={styles.scoreCard}>
                  <span className={styles.scoreLabel}>종합 적합도</span>
                  <span className={`${styles.scoreValue} ${styles.primary}`}>
                    {report.scores.overall}점
                  </span>
                </div>
                <div className={styles.scoreCard}>
                  <span className={styles.scoreLabel}>기술 매칭도</span>
                  <span className={styles.scoreValue}>{report.scores.tech}점</span>
                </div>
                <div className={styles.scoreCard}>
                  <span className={styles.scoreLabel}>경험 부합도</span>
                  <span className={styles.scoreValue}>{report.scores.experience}점</span>
                </div>
                <div className={styles.scoreCard}>
                  <span className={styles.scoreLabel}>컬처핏</span>
                  <span className={styles.scoreValue}>{report.scores.culture}점</span>
                </div>
              </div>

              {/* 핵심 역량 및 전략 */}
              <div className={styles.strategyCard}>
                <h3 className={styles.strategyTitle}>핵심 역량 및 전략</h3>
                <div className={styles.strategyItem}>
                  <span className={styles.strategyKey}>요구 핵심 기술</span>
                  <p className={styles.strategyValue}>
                    {report.strategy.requiredSkills.join(', ')}
                  </p>
                </div>
                <div className={styles.strategyItem}>
                  <span className={styles.strategyKey}>기업 개요</span>
                  <p className={styles.strategyValue}>{report.strategy.companyOverview}</p>
                </div>
                <div className={styles.strategyItem}>
                  <span className={styles.strategyKey}>인재상</span>
                  <p className={styles.strategyValue}>{report.strategy.talentProfile}</p>
                </div>
                <div className={styles.strategyItem}>
                  <span className={styles.strategyKey}>핵심 전략</span>
                  <p className={styles.strategyValue}>{report.strategy.coreStrategy}</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 자기소개서 탭 ── */}
      {activeTab === 'resume' && (
        <div className={styles.tabContent}>
          <div className={styles.resumeHeader}>
            <h3 className={styles.resumeTitle}>자기소개서 문항</h3>
            <button className={styles.addBtn} onClick={handleAddQuestion}>
              <Plus size={14} />
              새 문항 추가
            </button>
          </div>

          {questions.length === 0 ? (
            <div className={styles.emptyState}>
              <p>등록된 문항이 없습니다.</p>
            </div>
          ) : (
            <div className={styles.questionList}>
              {questions.map((q) => (
                <div
                  key={q.id}
                  className={styles.questionCard}
                  onClick={() =>
                    navigate('/resume/editor', {
                      state: {
                        companyName: app.company,
                        jobTitle: app.role,
                        coverQuestions: [q.text],
                        drafts: {},
                        companyInsights: '',
                        selections: [],
                      },
                    })
                  }
                >
                  <div className={styles.questionLeft}>
                    <p className={styles.questionText}>{q.text}</p>
                    <span className={styles.questionStatus}>상태: {STATUS_TEXT[q.status]}</span>
                  </div>
                  {q.feedbackScore !== null && (
                    <div className={styles.questionRight}>
                      <span className={styles.feedbackLabel}>피드백 점수</span>
                      <span className={styles.feedbackScore}>{q.feedbackScore}점</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 면접 연습 탭 ── */}
      {activeTab === 'interview' && (
        <div className={styles.tabContent}>
          {app.interview === 'waiting' ? (
            <div className={styles.emptyState}>
              <p>아직 면접 연습이 시작되지 않았습니다.</p>
              <button className={styles.actionBtn} onClick={() => navigate(ROUTES.INTERVIEW)}>
                면접 연습 시작하기
              </button>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>면접 세션을 확인하려면 면접 연습 페이지로 이동하세요.</p>
              <button className={styles.actionBtn} onClick={() => navigate(ROUTES.INTERVIEW)}>
                면접 연습 페이지로
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
