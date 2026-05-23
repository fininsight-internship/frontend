import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Copy, RefreshCw, Star, Loader2, Plus, Save, FileSearch, X } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
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
  const evalCardRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const { user } = useAuthStore();
  // user를 ref로도 유지해 stale closure 방지
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);
  // React StrictMode 이중 실행 방지
  const initedRef = useRef(false);
  // 현재 세션의 resume_id (새 세션: create 후 저장, 기존 세션: DB 로드 후 저장)
  const resumeIdRef = useRef<number | null>(null);

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
  const [evaluatingMap, setEvaluatingMap] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [allFeedbackOpen, setAllFeedbackOpen] = useState(false);
  const [allFeedbackLoading, setAllFeedbackLoading] = useState(false);
  const [allFeedbackResult, setAllFeedbackResult] = useState<string | null>(null);

  const currentDraft = drafts[currentIdx] || '';
  const currentEval = evaluations[currentIdx];
  const isCurrentEvaluating = evaluating || !!evaluatingMap[currentIdx];
  const completedCount = questions.filter((_, i) => drafts[i]?.trim()).length;
  const totalProgress = questions.length > 0
    ? Math.round((completedCount / questions.length) * 100)
    : 0;

  const saveDraftToDB = async (
    questionText: string, draftContent: string,
    aiScore?: number, aiFeedback?: string,
  ) => {
    const currentUser = userRef.current;
    if (!currentUser?.id) throw new Error('로그인 정보 없음');
    const res = await api.post('/resume/drafts/save', {
      user_id: Number(currentUser.id),
      company_name: companyName,
      job_title: jobTitle,
      question_text: questionText,
      draft_content: draftContent,
      ai_score: aiScore ?? null,
      ai_feedback: aiFeedback ?? null,
      resume_id: resumeIdRef.current,
    });
    return res.data as { status: string; draft: { id: number; draft_content: string; ai_score: number | null; ai_feedback: string; updated_at: string } };
  };

  const triggerAutoEvaluate = async (idx: number, draftText: string, qText: string) => {
    if (!draftText.trim()) return;
    setEvaluatingMap((prev) => ({ ...prev, [idx]: true }));
    try {
      const res = await api.post('/resume/evaluate-detailed', {
        draft: draftText,
        company_name: companyName,
        job_title: jobTitle,
        cover_question: qText,
        selections,
        company_insights: companyInsights,
      });
      const evalResult = { evaluation: res.data.evaluation, total_score: res.data.total_score };
      setEvaluations((prev) => ({ ...prev, [idx]: evalResult }));
      
      // 평가 결과를 DB에 저장
      await saveDraftToDB(
        qText, draftText,
        evalResult.total_score, evalResult.evaluation
      );
    } catch (e) {
      console.error(`[Auto Evaluation Failed for Q${idx + 1}]`, e);
    } finally {
      setEvaluatingMap((prev) => ({ ...prev, [idx]: false }));
    }
  };

  // 진입 시 초안 저장 → 병렬 평가 순서로 처리
  useEffect(() => {
    if (initedRef.current) return;
    initedRef.current = true;

    const currentUser = userRef.current;
    console.log('[ResumeEditor] init — user:', currentUser?.id, 'company:', companyName, 'job:', jobTitle);
    console.log('[ResumeEditor] state.drafts:', state.drafts);
    if (!currentUser?.id || !companyName || !jobTitle) {
      console.warn('[ResumeEditor] 초기화 중단: user/company/job 누락');
      return;
    }

    const hasStateDrafts = Object.values(state.drafts || {}).some(
      (d) => typeof d === 'string' && d.trim(),
    );
    console.log('[ResumeEditor] hasStateDrafts:', hasStateDrafts);

    const initEditor = async () => {
      if (hasStateDrafts) {
        // 새 세션 (wizard에서 전달된 초안): 새 resume 생성 → 순차 저장 → 병렬 평가
        const activeQuestions = coverQuestions.length > 0 ? coverQuestions : [''];
        const activeDrafts = state.drafts || {};

        // 0단계: 새 resume 행 생성
        try {
          const createRes = await api.post('/resume/create', {
            user_id: Number(currentUser.id),
            company_name: companyName,
            job_title: jobTitle,
          });
          resumeIdRef.current = createRes.data.resume_id;
          console.log(`[initEditor] 새 resume 생성: id=${resumeIdRef.current}`);
        } catch (e) {
          console.error('[initEditor] resume 생성 실패:', e);
          return;
        }

        // 1단계: 모든 초안 순차 저장 (race condition 방지)
        for (let idx = 0; idx < activeQuestions.length; idx++) {
          const draftText = activeDrafts[idx] || '';
          if (draftText.trim()) {
            try {
              await saveDraftToDB(activeQuestions[idx], draftText);
              console.log(`[initEditor] Q${idx + 1} 저장 완료`);
            } catch (e) {
              console.error(`[initEditor] Q${idx + 1} 저장 실패:`, e);
            }
          }
        }

        // 2단계: 항목별 병렬 평가 (각 완료 시 triggerAutoEvaluate 내부에서 DB 저장)
        activeQuestions.forEach((qText, idx) => {
          const draftText = activeDrafts[idx] || '';
          if (draftText.trim()) triggerAutoEvaluate(idx, draftText, qText);
        });
      } else {
        // 기존 세션: DB에서 최신 초안 로드 → resume_id 저장 → 평가 없는 항목 병렬 평가
        try {
          const res = await api.get('/resume/drafts', {
            params: { user_id: currentUser.id, company_name: companyName, job_title: jobTitle },
          });
          resumeIdRef.current = res.data.resume_id ?? null;

          const dbDrafts: Array<{
            id: number; question_text: string; draft_content: string;
            ai_score: number | null; ai_feedback: string;
          }> = res.data.drafts || [];

          const newQuestions: string[] = [];
          const newDrafts: Record<number, string> = {};
          const newEvals: Record<number, EvaluationResult> = {};

          dbDrafts.forEach((d, i) => {
            newQuestions.push(d.question_text);
            newDrafts[i] = d.draft_content;
            if (d.ai_score !== null && d.ai_feedback) {
              newEvals[i] = { evaluation: d.ai_feedback, total_score: d.ai_score };
            }
          });

          if (dbDrafts.length > 0) {
            setQuestions(newQuestions);
            setDrafts(newDrafts);
          }
          setEvaluations(newEvals);

          newQuestions.forEach((qText, idx) => {
            const draftText = newDrafts[idx] || '';
            if (draftText.trim() && !newEvals[idx]) {
              triggerAutoEvaluate(idx, draftText, qText);
            }
          });
        } catch (_) {}
      }
    };

    initEditor();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps



  const handleRefine = async () => {
    if (!currentDraft.trim() || evaluating) return;
    if (!currentEval) {
      alert('먼저 "저장 및 피드백" 버튼을 눌러 평가를 받은 후 재작성할 수 있습니다.');
      return;
    }
    setEvaluating(true);
    try {
      const res = await api.post('/resume/refine', {
        draft: currentDraft,
        evaluation: currentEval.evaluation,
        user_answers: '',
        context: { jd_analysis: companyInsights },
      });
      const refined: string = res.data.refined_draft || '';
      if (refined.trim()) {
        setDrafts((prev) => ({ ...prev, [currentIdx]: refined }));
        await saveDraftToDB(questions[currentIdx], refined);
      }
    } catch {
      alert('재작성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleEvaluate = async () => {
    if (!currentDraft.trim() || evaluating) return;
    setEvaluating(true);
    try {
      // 1단계: 초안 먼저 저장 (평가 실패해도 내용은 보존)
      await saveDraftToDB(questions[currentIdx], currentDraft);

      // 2단계: 평가 실행
      const res = await api.post('/resume/evaluate-detailed', {
        draft: currentDraft,
        company_name: companyName,
        job_title: jobTitle,
        cover_question: questions[currentIdx],
        selections,
        company_insights: companyInsights,
      });
      const evalResult = { evaluation: res.data.evaluation, total_score: res.data.total_score };
      setEvaluations((prev) => ({ ...prev, [currentIdx]: evalResult }));

      // 3단계: 평가 결과와 함께 다시 저장 → resume_question_evaluations
      await saveDraftToDB(
        questions[currentIdx], currentDraft,
        evalResult.total_score, evalResult.evaluation,
      );
    } catch (e) {
      console.error('[저장 및 피드백 오류]', e);
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

  const handleSaveAll = async () => {
    if (!user?.id) {
      alert('로그인이 필요합니다. 다시 로그인해주세요.');
      return;
    }
    try {
      // 순차 저장으로 resume 중복 생성 방지
      for (let i = 0; i < questions.length; i++) {
        await saveDraftToDB(questions[i], drafts[i] || '');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('저장 실패:', e);
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleAllFeedback = async () => {
    setAllFeedbackOpen(true);
    setAllFeedbackResult(null);
    setAllFeedbackLoading(true);
    try {
      // 전체 피드백 전에 모든 현재 초안 순차 저장 (동시 저장 시 resume 중복 생성 방지)
      if (user?.id) {
        for (let i = 0; i < questions.length; i++) {
          await saveDraftToDB(questions[i], drafts[i] || '');
        }
      }
      const res = await api.post('/resume/evaluate-all', {
        company_name: companyName,
        job_title: jobTitle,
        questions,
        drafts: questions.map((_, i) => drafts[i] || ''),
      });
      setAllFeedbackResult(res.data.feedback);
      // 전체 피드백 결과를 resume_evaluations 테이블에 저장
      if (user?.id && res.data.feedback) {
        api.post('/resume/evaluations/save', {
          user_id: Number(user.id),
          company_name: companyName,
          job_title: jobTitle,
          overall_feedback: res.data.feedback,
          resume_id: resumeIdRef.current,
        }).catch(() => {});
      }
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
              <button
                className={styles.regenerateBtn}
                onClick={handleRefine}
                disabled={!currentDraft.trim() || isCurrentEvaluating || !currentEval}
                title={!currentEval ? '먼저 피드백을 받은 후 재작성할 수 있습니다' : 'AI가 평가 피드백을 반영해 다시 작성합니다'}
              >
                <RefreshCw size={14} /> AI 초안 재생성
              </button>
              <button className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`} onClick={handleCopy}>
                <Copy size={14} />
                {copied ? '복사됨' : '복사'}
              </button>
              <button
                className={styles.evaluateBtn}
                onClick={handleEvaluate}
                disabled={!currentDraft.trim() || isCurrentEvaluating}
              >
                {isCurrentEvaluating
                  ? <Loader2 size={14} className={styles.spinner} />
                  : <Star size={14} />}
                저장 및 피드백
              </button>
            </div>
          </div>

          {/* Evaluation card — loading (first time) or result with overlay (re-evaluate) */}
          {(isCurrentEvaluating || currentEval) && (
            <div ref={evalCardRef} className={`${styles.evalCard} ${isCurrentEvaluating ? styles.evalCardLoading : ''}`}>
              {/* Blur overlay shown while evaluating */}
              {isCurrentEvaluating && (
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
