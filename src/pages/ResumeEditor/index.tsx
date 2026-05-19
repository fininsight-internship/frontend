import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Copy, RefreshCw, Star, Loader2, Plus, Save, FileSearch, X } from 'lucide-react';
import api from '../../services/api';
import styles from './ResumeEditor.module.css';

interface EditorLocationState {
  companyName: string;
  jobTitle: string;
  coverQuestions: string[];
  drafts: Record<number, string>;
  companyInsights: string;
  selections: string[];
}

interface EvaluationResult {
  evaluation: string;
  total_score: number;
}

// ─── Simple inline markdown renderer ──────────────────────────────
function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('### ')) {
      return <h3 key={i} className={styles.mdH3}>{line.slice(4)}</h3>;
    }
    if (line.startsWith('#### ')) {
      return <h4 key={i} className={styles.mdH4}>{line.slice(5)}</h4>;
    }
    if (/^-{3,}$/.test(line.trim())) {
      return <hr key={i} className={styles.mdHr} />;
    }
    if (line === '') {
      return <div key={i} className={styles.mdSpacer} />;
    }
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const content = parts.map((p, j) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={j}>{p.slice(2, -2)}</strong>
        : p,
    );
    if (line.startsWith('- ')) {
      return <div key={i} className={styles.mdBullet}>{content}</div>;
    }
    return <div key={i} className={styles.mdLine}>{content}</div>;
  });
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? 'var(--color-success)' : score >= 60 ? 'var(--color-primary)' : '#f59e0b';
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className={styles.scoreRingWrap}>
      <svg viewBox="0 0 72 72" className={styles.scoreRingSvg}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--color-border)" strokeWidth="7" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
      </svg>
      <div className={styles.scoreRingText}>
        <span className={styles.scoreNum} style={{ color }}>{score}</span>
        <span className={styles.scoreMax}>/ 100</span>
      </div>
    </div>
  );
}

export default function ResumeEditorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as EditorLocationState;
  const autoEvalDone = useRef(false);
  const evalCardRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const {
    companyName = '',
    jobTitle = '',
    coverQuestions = [''],
    companyInsights = '',
    selections = [],
  } = state;

  const [questions, setQuestions] = useState<string[]>(coverQuestions.length > 0 ? coverQuestions : ['']);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [drafts, setDrafts] = useState<Record<number, string>>(state.drafts || {});
  const [evaluations, setEvaluations] = useState<Record<number, EvaluationResult>>({});
  const [evaluating, setEvaluating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [allFeedbackOpen, setAllFeedbackOpen] = useState(false);
  const [allFeedbackLoading, setAllFeedbackLoading] = useState(false);
  const [allFeedbackResult, setAllFeedbackResult] = useState<string | null>(null);

  const currentDraft = drafts[currentIdx] || '';
  const currentEval = evaluations[currentIdx];
  const completedCount = questions.filter((_, i) => drafts[i]?.trim()).length;
  const totalProgress = questions.length > 0
    ? Math.round((completedCount / questions.length) * 100)
    : 0;

  // Auto-evaluate the first question when page mounts
  useEffect(() => {
    if (autoEvalDone.current) return;
    const draft = (state.drafts || {})[0];
    if (!draft?.trim() || !coverQuestions[0]) return;
    autoEvalDone.current = true;

    const run = async () => {
      setEvaluating(true);
      try {
        const res = await api.post('/resume/evaluate-detailed', {
          draft,
          company_name: companyName,
          job_title: jobTitle,
          cover_question: questions[0],
          selections,
          company_insights: companyInsights,
        });
        setEvaluations({ 0: { evaluation: res.data.evaluation, total_score: res.data.total_score } });
      } catch {
        // fail silently — user can retry manually
      } finally {
        setEvaluating(false);
      }
    };
    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEvaluate = async () => {
    if (!currentDraft.trim() || evaluating) return;
    setEvaluating(true);
    try {
      const res = await api.post('/resume/evaluate-detailed', {
        draft: currentDraft,
        company_name: companyName,
        job_title: jobTitle,
        cover_question: questions[currentIdx],
        selections,
        company_insights: companyInsights,
      });
      setEvaluations((prev) => ({
        ...prev,
        [currentIdx]: { evaluation: res.data.evaluation, total_score: res.data.total_score },
      }));
    } catch {
      // fail silently
    } finally {
      setEvaluating(false);
    }
  };

  const handleCopy = async () => {
    if (!currentDraft.trim()) return;
    await navigator.clipboard.writeText(currentDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddQuestion = () => {
    const text = prompt('새 문항을 입력하세요.');
    if (!text?.trim()) return;
    setQuestions((prev) => [...prev, text.trim()]);
  };

  const handleSaveAll = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // TODO: DB 연동 시 실제 저장 API 호출
  };

  const handleAllFeedback = async () => {
    setAllFeedbackOpen(true);
    setAllFeedbackResult(null);
    setAllFeedbackLoading(true);
    try {
      const res = await api.post('/resume/evaluate-all', {
        company_name: companyName,
        job_title: jobTitle,
        questions,
        drafts: questions.map((_, i) => drafts[i] || ''),
      });
      setAllFeedbackResult(res.data.feedback);
    } catch {
      setAllFeedbackResult('피드백 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setAllFeedbackLoading(false);
    }
  };

  // 피드백 결과 나오면 main 영역 하단으로 스크롤
  useEffect(() => {
    if (currentEval && mainRef.current) {
      setTimeout(() => {
        mainRef.current!.scrollTop = mainRef.current!.scrollHeight;
      }, 50);
    }
  }, [currentEval]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </button>
        <div className={styles.headerInfo}>
          <h1 className={styles.headerTitle}>{companyName} · {jobTitle}</h1>
          <span className={styles.headerSub}>자기소개서 편집 및 평가</span>
        </div>
        <button className={styles.allFeedbackBtn} onClick={handleAllFeedback}>
          <FileSearch size={15} />
          전체 피드백
        </button>
        <button className={`${styles.saveAllBtn} ${saved ? styles.saveAllBtnDone : ''}`} onClick={handleSaveAll}>
          <Save size={15} />
          {saved ? '저장됨' : '전체 저장'}
        </button>
      </header>

      {/* Body */}
      <div className={styles.body}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sideSection}>
            <h3 className={styles.sideTitle}>문항 목록</h3>
            <div className={styles.questionList}>
              {questions.map((q, i) => (
                <button
                  key={i}
                  className={`${styles.questionItem} ${currentIdx === i ? styles.questionItemActive : ''}`}
                  onClick={() => setCurrentIdx(i)}
                >
                  <div className={styles.questionItemLeft}>
                    <span className={styles.questionNum}>{i + 1}</span>
                    <span className={styles.questionPreview}>
                      {q.length > 28 ? q.slice(0, 28) + '…' : q}
                    </span>
                  </div>
                  {drafts[i]?.trim()
                    ? <CheckCircle size={14} className={styles.doneIcon} />
                    : <div className={styles.pendingDot} />}
                </button>
              ))}
            </div>
            <button className={styles.addQuestionBtn} onClick={handleAddQuestion}>
              <Plus size={13} />
              문항 추가
            </button>
          </div>

          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>전체 진행률</span>
              <span className={styles.progressPct}>{totalProgress}%</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${totalProgress}%` }} />
            </div>
            <p className={styles.progressSub}>{completedCount} / {questions.length} 문항 완료</p>
          </div>
        </aside>

        {/* Main */}
        <main ref={mainRef} className={styles.main}>
          {/* Editor card */}
          <div className={styles.editorCard}>
            <div className={styles.editorTop}>
              <div className={styles.questionLabel}>
                <span className={styles.questionBadge}>문항 {currentIdx + 1}</span>
                <span className={styles.questionFull}>{questions[currentIdx]}</span>
              </div>
              <span className={styles.charCount}>{currentDraft.length}자</span>
            </div>

            <textarea
              className={styles.editorTextarea}
              value={currentDraft}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [currentIdx]: e.target.value }))}
              placeholder="자소서 내용을 입력하거나 편집하세요..."
            />

            <div className={styles.actionBar}>
              <button className={styles.regenerateBtn} disabled>
                <RefreshCw size={14} /> AI 초안 재생성
              </button>
              <button className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`} onClick={handleCopy}>
                <Copy size={14} />
                {copied ? '복사됨' : '복사'}
              </button>
              <button
                className={styles.evaluateBtn}
                onClick={handleEvaluate}
                disabled={!currentDraft.trim() || evaluating}
              >
                {evaluating
                  ? <Loader2 size={14} className={styles.spinner} />
                  : <Star size={14} />}
                저장 및 피드백
              </button>
            </div>
          </div>

          {/* Evaluation card — loading (first time) or result with overlay (re-evaluate) */}
          {(evaluating || currentEval) && (
            <div ref={evalCardRef} className={`${styles.evalCard} ${evaluating ? styles.evalCardLoading : ''}`}>
              {/* Blur overlay shown while evaluating */}
              {evaluating && (
                <div className={styles.evalOverlay}>
                  <Loader2 size={28} className={styles.spinner} color="var(--color-primary)" />
                  <p className={styles.evalOverlayText}>면접왕 이형이 자소서를 분석하고 있어요...</p>
                </div>
              )}

              <div className={styles.evalHeader}>
                <div className={styles.evalTitleWrap}>
                  <span className={styles.evalTag}>AI 평가</span>
                  <h3 className={styles.evalTitle}>면접왕 이형의 합격 성적표</h3>
                </div>
                {currentEval && <ScoreRing score={currentEval.total_score} />}
              </div>

              <div className={styles.evalBody}>
                {currentEval
                  ? renderMarkdown(currentEval.evaluation)
                  : <div className={styles.evalBodyPlaceholder} />}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 전체 피드백 모달 */}
      {allFeedbackOpen && (
        <div className={styles.modalOverlay} onClick={() => setAllFeedbackOpen(false)}>
          <div className={styles.modalPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrap}>
                <FileSearch size={18} color="var(--color-primary)" />
                <h2 className={styles.modalTitle}>전체 자기소개서 피드백</h2>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setAllFeedbackOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {allFeedbackLoading ? (
                <div className={styles.modalLoading}>
                  <Loader2 size={32} className={styles.spinner} color="var(--color-primary)" />
                  <p>전체 자기소개서를 분석하고 있어요...</p>
                  <span>반복 경험·표현 검사 중</span>
                </div>
              ) : (
                <div className={styles.modalResult}>
                  {renderMarkdown(allFeedbackResult || '')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
