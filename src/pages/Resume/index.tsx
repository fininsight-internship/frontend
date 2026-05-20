import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Plus, Trash2, Send, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import styles from './ResumePage.module.css';

// ─── Types ───────────────────────────────────────────────────────
type WizardStep = 'setup' | 'step1' | 'step2' | 'step3' | 'step3_save' | 'step4' | 'done';
type SetupPhase = 'input' | 'analyzing' | 'questions';
type StarStep = 'S' | 'T' | 'A' | 'R';

interface Experience {
  id: string;
  type: '경력/인턴' | '프로젝트' | '교육/부트캠프';
  company: string;
  period: string;
  role: string;
  tags: string[];
  hasDetail: boolean;
  detail?: string;
}

interface StarMessage {
  label: string;
  question: string;
  hint: string;
  answer?: string;
}

interface CoverMessage {
  role: 'assistant' | 'user';
  content: string;
  options?: string[];
  aspect?: string;
}


const STAR_STEPS: StarStep[] = ['S', 'T', 'A', 'R'];
const STAR_LABELS: Record<StarStep, string> = { S: 'S — 상황', T: 'T — 과제', A: 'A — 행동', R: 'R — 결과' };
const STAR_QUESTIONS: Record<StarStep, { question: string; hint: string }> = {
  S: {
    question: '어떤 환경에서 일했나요?\n팀 규모, 서비스 성격, 본인의 역할을 간략히 알려주세요.',
    hint: '예) 3인 팀, B2B SaaS 서비스, 프론트엔드 전담',
  },
  T: {
    question: '그 경험에서 해결해야 했던 핵심 문제나 목표는 무엇이었나요?',
    hint: '예) 레거시 jQuery 코드를 React로 전환하고 배포 파이프라인 구축',
  },
  A: {
    question: '목표를 달성하기 위해 구체적으로 어떤 행동을 취했나요?\n본인이 주도한 부분을 중심으로 설명해주세요.',
    hint: '예) 컴포넌트 단위 마이그레이션 계획 수립, Jest 커버리지 60%→85% 달성',
  },
  R: {
    question: '그 행동의 결과는 어떠했나요?\n가능하면 수치로 표현해주세요.',
    hint: '예) 배포 주기 2주→3일 단축, 버그 발생률 30% 감소',
  },
};

const STEP_LABELS = ['경험 선택', '경험 사항 확인', 'STAR 경험 정리', '자소서 작성'];

export default function ResumePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // ─── Step state ───────────────────────────────────────────────
  const [wizardStep, setWizardStep] = useState<WizardStep>('setup');
  const [setupPhase, setSetupPhase] = useState<SetupPhase>('input');

  // ─── Setup data ───────────────────────────────────────────────
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [coverQuestions, setCoverQuestions] = useState<{ text: string; charLimit: string }[]>([{ text: '', charLimit: '' }]);
  const [companyInsights, setCompanyInsights] = useState('');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [allDrafts, setAllDrafts] = useState<Record<number, string>>({});

  // ─── Experience (Step 1) ──────────────────────────────────────
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [expLoading, setExpLoading] = useState(false);
  const [selectedExp, setSelectedExp] = useState<Experience | null>(null);
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState(false);

  // ─── STAR chat (Step 3) ───────────────────────────────────────
  const [starIdx, setStarIdx] = useState(0);
  const [starMessages, setStarMessages] = useState<StarMessage[]>([]);
  const [starInput, setStarInput] = useState('');
  const [starSummary, setStarSummary] = useState<Record<string, string> | null>(null);
  const [starLoading, setStarLoading] = useState(false);

  // ─── Cover letter chat (Step 4) ───────────────────────────────
  const [coverMessages, setCoverMessages] = useState<CoverMessage[]>([]);
  const [coverInput, setCoverInput] = useState('');
  const [coverSelections, setCoverSelections] = useState<string[]>([]);
  const [coverLoading, setCoverLoading] = useState(false);
  const [finalLetter, setFinalLetter] = useState('');
  const [draftLetter, setDraftLetter] = useState(''); // 진행 중인 자소서

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [starMessages, coverMessages, starLoading, coverLoading]);

  // 경험 DB 로드 (마운트 시 1회)
  useEffect(() => {
    if (!user?.id) return;
    setExpLoading(true);
    api.get('/experience').then((res) => {
      const data = res.data;
      const mapped: Experience[] = [];

      (data['경력인턴'] || []).forEach((c: { id: string; company: string; department: string; startDate: string; endDate: string; detail: string }) => {
        if (!c.company?.trim() && !c.department?.trim()) return;
        mapped.push({
          id: c.id,
          type: '경력/인턴',
          company: c.company || '',
          period: [c.startDate, c.endDate].filter(Boolean).join(' - '),
          role: c.department || '',
          tags: [],
          hasDetail: !!c.detail,
          detail: c.detail || '',
        });
      });

      (data['교육부트캠프'] || []).forEach((b: { id: string; name: string; topic: string; detail: string }) => {
        if (!b.name?.trim()) return;
        mapped.push({
          id: b.id,
          type: '교육/부트캠프',
          company: b.name || '',
          period: '',
          role: b.topic || '',
          tags: [],
          hasDetail: !!b.detail,
          detail: b.detail || '',
        });
      });

      (data['프로젝트'] || []).forEach((p: { id: string; title: string; detail: string }) => {
        if (!p.title?.trim()) return;
        mapped.push({
          id: p.id,
          type: '프로젝트',
          company: p.title || '',
          period: '',
          role: p.title || '',
          tags: [],
          hasDetail: !!p.detail,
          detail: p.detail || '',
        });
      });

      setExperiences(mapped);
    }).catch(() => {
      // DB 로드 실패 시 빈 목록 유지
    }).finally(() => {
      setExpLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 경험 선택 단계 진입 시 현재 문항 기준 매칭율 로딩
  useEffect(() => {
    if (wizardStep !== 'step1') return;
    const question = coverQuestions[currentQuestionIdx]?.text;
    if (!question?.trim() || experiences.length === 0) return;

    setMatchLoading(true);
    setMatchScores({});
    setMatchError(false);
    api.post('/resume/experience-match', {
      question,
      experiences: experiences.map((e) => ({
        id: e.id,
        company: e.company,
        role: e.role,
        tags: e.tags,
        detail: e.detail ?? '',
      })),
    }).then((res) => {
      const scores = res.data.scores || {};
      if (Object.keys(scores).length === 0) {
        setMatchError(true);
      } else {
        setMatchScores(scores);
      }
    }).catch(() => {
      setMatchError(true);
    }).finally(() => {
      setMatchLoading(false);
    });
  }, [wizardStep, currentQuestionIdx, experiences]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Derived values ───────────────────────────────────────────
  const progressStep =
    wizardStep === 'step1' ? 1
    : wizardStep === 'step2' ? 2
    : wizardStep === 'step3' || wizardStep === 'step3_save' ? 3
    : wizardStep === 'step4' || wizardStep === 'done' ? 4
    : 0;

  const currentCoverQ = coverQuestions[currentQuestionIdx]?.text || '';
  const currentCharLimit = parseInt(coverQuestions[currentQuestionIdx]?.charLimit || '0', 10) || 0;

  const getStarData = (): Record<string, string> => {
    if (starSummary) return starSummary;
    if (selectedExp?.detail) return { S: selectedExp.detail, T: '', A: '', R: '' };
    const result: Record<string, string> = {};
    starMessages.forEach((m) => { if (m.answer) result[m.label[0]] = m.answer; });
    return result;
  };

  // ─── Setup handlers ───────────────────────────────────────────
  const handleSetupNext = async () => {
    if (!companyName.trim() || !jobTitle.trim()) return;
    setSetupPhase('analyzing');
    try {
      // 1. DB에서 기존 기업/JD 분석 데이터 확인
      let analysisData: any = null;
      try {
        const reportsRes = await api.get('/api/analysis/reports');
        const reports: any[] = reportsRes.data?.data || [];
        analysisData = reports.find(
          (r: any) => r.company_name?.toLowerCase() === companyName.trim().toLowerCase()
        ) || null;
      } catch (_) {}

      if (!analysisData) {
        // 2. 없으면 기업/JD 분석 실행 + DB 저장
        try {
          const formData = new FormData();
          formData.append('company_name', companyName);
          const analysisRes = await api.post('/api/analysis/report', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (analysisRes.data?.success) {
            analysisData = analysisRes.data.data;
          }
        } catch (_) {}
      }

      // 3. company insights 구성
      if (analysisData) {
        const parts: string[] = [];
        const companyAnalysis = analysisData.company_analysis || {};
        if (companyAnalysis.summary) parts.push(companyAnalysis.summary);
        if (companyAnalysis.culture?.description) parts.push(companyAnalysis.culture.description);
        const jobAnalysis = analysisData.job_analysis || {};
        if (Object.keys(jobAnalysis).length > 0) {
          parts.push(`[JD 분석]\n${JSON.stringify(jobAnalysis)}`);
        }
        if (parts.length > 0) setCompanyInsights(parts.join('\n\n'));
      }
    } catch (_) {
      // 분석 실패해도 다음 단계 진행
    }
    setSetupPhase('questions');
  };

  const handleStartWizard = () => {
    if (coverQuestions.some((q) => q.text.trim())) {
      setWizardStep('step1');
    }
  };

  const addQuestion = () => setCoverQuestions([...coverQuestions, { text: '', charLimit: '' }]);
  const removeQuestion = (i: number) => setCoverQuestions(coverQuestions.filter((_, j) => j !== i));
  const updateQuestion = (i: number, field: 'text' | 'charLimit', val: string) => {
    const next = [...coverQuestions];
    next[i] = { ...next[i], [field]: val };
    setCoverQuestions(next);
  };

  // ─── Step 1 ───────────────────────────────────────────────────
  const handleStep1Next = () => {
    if (selectedExp) setWizardStep('step2');
  };

  // ─── Step 2 ───────────────────────────────────────────────────
  const handleStep2Next = () => {
    if (selectedExp?.hasDetail) {
      startCoverChat();
      setWizardStep('step4');
    } else {
      initStarChat();
      setWizardStep('step3');
    }
  };

  // ─── Step 3: STAR chat ────────────────────────────────────────
  const initStarChat = () => {
    setStarIdx(0);
    const first = STAR_STEPS[0];
    const q = STAR_QUESTIONS[first];
    setStarMessages([{
      label: STAR_LABELS[first],
      question: selectedExp ? `${selectedExp.company} ${selectedExp.role} 기간 동안 어떤 환경에서 일했나요?\n팀 규모, 서비스 성격, 본인의 역할을 간략히 알려주세요.` : q.question,
      hint: q.hint,
    }]);
    setStarInput('');
    setStarSummary(null);
  };

  const handleStarSubmit = async () => {
    if (!starInput.trim() || starLoading) return;
    const answer = starInput.trim();
    const updated = starMessages.map((m, i) => i === starIdx ? { ...m, answer } : m);
    const nextIdx = starIdx + 1;

    if (nextIdx < STAR_STEPS.length) {
      const nextStep = STAR_STEPS[nextIdx];
      const q = STAR_QUESTIONS[nextStep];
      updated.push({ label: STAR_LABELS[nextStep], question: q.question, hint: q.hint });
      setStarMessages(updated);
      setStarIdx(nextIdx);
      setStarInput('');
    } else {
      setStarMessages(updated);
      setStarInput('');
      setStarLoading(true);
      const rawAnswers: Record<string, string> = {};
      updated.forEach((m) => { rawAnswers[m.label[0]] = m.answer || ''; });
      try {
        const res = await api.post('/resume/star-summary', {
          experience_name: selectedExp?.company || '',
          experience_role: selectedExp?.role || '',
          answers: rawAnswers,
        });
        setStarSummary(res.data.summary || rawAnswers);
      } catch (_) {
        setStarSummary(rawAnswers);
      } finally {
        setStarLoading(false);
        setWizardStep('step3_save');
      }
    }
  };

  const handleStarKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleStarSubmit(); }
  };

  // ─── Step 3 Save ──────────────────────────────────────────────
  const handleStep3Continue = () => {
    startCoverChat();
    setWizardStep('step4');
  };

  const handleStep3SaveAndContinue = async () => {
    if (selectedExp && starSummary) {
      try {
        const detailText = Object.entries(starSummary)
          .filter(([, v]) => v?.trim())
          .map(([k, v]) => `[${k}] ${v}`)
          .join('\n\n');
        await api.patch(`/experience/${selectedExp.id}/detail`, { detail: detailText });
        setExperiences((prev) =>
          prev.map((e) =>
            e.id === selectedExp.id ? { ...e, hasDetail: true, detail: detailText } : e
          )
        );
      } catch (_) {
        // 저장 실패해도 자소서 작성은 계속 진행
      }
    }
    handleStep3Continue();
  };

  // ─── Step 4: Cover letter chat ────────────────────────────────
  const startCoverChat = async (questionText?: string, charLimit?: number) => {
    const q = questionText ?? currentCoverQ;
    const limit = charLimit ?? currentCharLimit;
    setCoverMessages([]);
    setCoverSelections([]);
    setCoverInput('');
    setFinalLetter('');
    setDraftLetter('');
    setCoverLoading(true);
    try {
      const res = await api.post('/resume/cover-chat', {
        company_name: companyName,
        job_title: jobTitle,
        cover_question: q,
        char_limit: limit,
        star_data: getStarData(),
        history: [],
        company_insights: companyInsights,
      });
      setCoverMessages([{
        role: 'assistant',
        content: res.data.question,
        options: res.data.options,
        aspect: res.data.aspect,
      }]);
    } catch (_) {
      setCoverMessages([{ role: 'assistant', content: '자소서 작성을 시작하겠습니다. 지원 동기를 알려주세요.', options: [] }]);
    } finally {
      setCoverLoading(false);
    }
  };

  const typeLetterAnimation = async (letter: string) => {
    setDraftLetter('');
    for (let i = 0; i < letter.length; i++) {
      setDraftLetter((prev) => prev + letter[i]);
      await new Promise((resolve) => setTimeout(resolve, 15));
    }
  };

  const handleCoverSend = async (text: string) => {
    if (!text.trim() || coverLoading) return;
    const newMessages: CoverMessage[] = [...coverMessages, { role: 'user', content: text }];
    const newSelections = [...coverSelections, text];
    setCoverMessages(newMessages);
    setCoverSelections(newSelections);
    setCoverInput('');
    setCoverLoading(true);
    try {
      const apiHistory = newMessages.map((m) => ({ role: m.role, content: m.content }));

      // cover-chat + cover-finalize 동시 호출
      const [chatRes, draftRes] = await Promise.all([
        api.post('/resume/cover-chat', {
          company_name: companyName,
          job_title: jobTitle,
          cover_question: currentCoverQ,
          char_limit: currentCharLimit,
          star_data: getStarData(),
          history: apiHistory,
          company_insights: companyInsights,
        }),
        api.post('/resume/cover-finalize', {
          company_name: companyName,
          job_title: jobTitle,
          cover_question: currentCoverQ,
          char_limit: currentCharLimit,
          star_data: getStarData(),
          selections: newSelections,
          company_insights: companyInsights,
        }),
      ]);

      // 중간 초안 타이핑 애니메이션 (백그라운드)
      const draft = draftRes.data.final_letter || '';
      typeLetterAnimation(draft);

      if (chatRes.data.is_complete) {
        setFinalLetter(draft);
        const updatedDrafts = { ...allDrafts, [currentQuestionIdx]: draft };
        setAllDrafts(updatedDrafts);

        const nextIdx = currentQuestionIdx + 1;
        const hasNextQuestion = nextIdx < coverQuestions.length;

        if (hasNextQuestion) {
          // 다음 문항을 위해 경험 재선택
          const nextQ = coverQuestions[nextIdx];
          setCoverMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `✅ ${currentQuestionIdx + 1}번 문항 완료!\n\n📝 문항 ${nextIdx + 1}을 위한 경험을 선택해주세요:\n${nextQ.text}` },
          ]);
          setCurrentQuestionIdx(nextIdx);
          setSelectedExp(null);
          setTimeout(() => {
            setWizardStep('step1');
          }, 1200);
        } else {
          // 모든 문항 완료 → 평가 페이지로 이동 (저장/평가는 에디터 페이지에서 처리)
          setCoverMessages((prev) => [...prev, { role: 'assistant', content: '✅ 모든 문항 작성 완료! 평가 페이지로 이동합니다...' }]);
          setWizardStep('done');

          const qTexts = coverQuestions.map((q) => q.text);
          setTimeout(() => {
            navigate('/resume/editor', {
              state: {
                companyName,
                jobTitle,
                coverQuestions: qTexts,
                drafts: updatedDrafts,
                companyInsights,
                selections: newSelections,
              },
            });
          }, 800);
        }
      } else {
        setCoverMessages((prev) => [...prev, {
          role: 'assistant',
          content: chatRes.data.question,
          options: chatRes.data.options,
          aspect: chatRes.data.aspect,
        }]);
      }
    } catch (_) {
      setCoverMessages((prev) => [...prev, { role: 'assistant', content: '응답을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.' }]);
    } finally {
      setCoverLoading(false);
    }
  };

  const handleCoverKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCoverSend(coverInput); }
  };

  // ─── Back button ──────────────────────────────────────────────
  const handleBack = () => {
    const map: Partial<Record<WizardStep, WizardStep | 'setup'>> = {
      step1: 'setup',
      step2: 'step1',
      step3: 'step2',
      step3_save: 'step3',
      step4: selectedExp?.hasDetail ? 'step2' : 'step3_save',
    };
    const prev = map[wizardStep];
    if (prev) setWizardStep(prev as WizardStep);
  };

  // ─── Setup view ───────────────────────────────────────────────
  if (wizardStep === 'setup') {
    return (
      <div className={styles.setupPage}>
        <h1 className={styles.setupTitle}>자기소개서 작성</h1>
        <p className={styles.setupSubtitle}>AI와 함께 맞춤형 자기소개서를 작성하세요</p>

        {setupPhase === 'input' && (
          <div className={styles.setupCard}>
            <h2 className={styles.cardTitle}>지원 정보 입력</h2>
            <div className={styles.formGroup}>
              <label className={styles.label}>기업명</label>
              <input
                type="text"
                className={styles.input}
                placeholder="예) 카카오, 네이버, 토스"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && companyName.trim() && jobTitle.trim()) handleSetupNext(); }}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>직무 / 공고</label>
              <input
                type="text"
                className={styles.input}
                placeholder="예) 프론트엔드 개발자"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && companyName.trim() && jobTitle.trim()) handleSetupNext(); }}
              />
            </div>
            <button className={styles.primaryBtn} onClick={handleSetupNext} disabled={!companyName.trim() || !jobTitle.trim()}>
              다음
            </button>
          </div>
        )}

        {setupPhase === 'analyzing' && (
          <div className={styles.setupCard}>
            <div className={styles.analyzingState}>
              <Loader2 size={32} className={styles.spinner} color="var(--color-primary)" />
              <p className={styles.analyzingText}>{companyName} 기업분석 데이터를 확인하고 있어요...</p>
              <p className={styles.analyzingSubText}>데이터가 없는 경우 새로운 분석을 진행합니다.</p>
            </div>
          </div>
        )}

        {setupPhase === 'questions' && (
          <div className={styles.setupCard}>
            <div className={styles.analysisDone}>
              <CheckCircle size={16} />
              <span>{companyName} 기업분석 완료</span>
            </div>
            <h2 className={styles.cardTitle}>자소서 문항 입력</h2>
            <p className={styles.cardDesc}>작성할 자소서 문항을 입력해주세요. 여러 문항을 추가할 수 있어요.</p>
            <div className={styles.questionList}>
              {coverQuestions.map((q, i) => (
                <div key={i} className={styles.questionRow}>
                  <span className={styles.questionNum}>{i + 1}</span>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="예) 지원 동기 및 포부를 작성하세요."
                    value={q.text}
                    onChange={(e) => updateQuestion(i, 'text', e.target.value)}
                  />
                  <input
                    type="number"
                    className={styles.charLimitInput}
                    placeholder="글자 수"
                    value={q.charLimit}
                    onChange={(e) => updateQuestion(i, 'charLimit', e.target.value)}
                    min={0}
                  />
                  {coverQuestions.length > 1 && (
                    <button className={styles.deleteBtn} onClick={() => removeQuestion(i)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button className={styles.addBtn} onClick={addQuestion}>
                <Plus size={16} /> 문항 추가
              </button>
            </div>
            <button className={styles.primaryBtn} onClick={handleStartWizard} disabled={!coverQuestions.some((q) => q.text.trim())}>
              자소서 작성 시작
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Wizard view ──────────────────────────────────────────────
  return (
    <div className={styles.wizard}>
      {/* Wizard header */}
      <div className={styles.wizardHeader}>
        <div className={styles.headerLeft}>
          {wizardStep !== 'done' && (
            <button className={styles.backBtn} onClick={handleBack}>
              <ChevronLeft size={20} />
            </button>
          )}
          <div>
            <div className={styles.wizardTitle}>{companyName} · {jobTitle} 자소서 작성</div>
            <div className={styles.wizardSubtitle}>{STEP_LABELS[(progressStep || 1) - 1]}</div>
          </div>
        </div>
        <div className={styles.stepProgress}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={styles.stepItem}>
              <div className={`${styles.stepCircle} ${progressStep > n ? styles.stepDone : progressStep === n ? styles.stepActive : styles.stepFuture}`}>
                {progressStep > n ? <CheckCircle size={13} /> : n}
              </div>
              {n < 4 && <div className={`${styles.stepLine} ${progressStep > n ? styles.stepLineDone : ''}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Wizard body */}
      <div className={styles.wizardBody}>

        {/* Step 1: Experience selection */}
        {wizardStep === 'step1' && (
          <div className={styles.stepContent}>
            <div className={styles.aiMessage}>
              <div className={styles.aiAvatar}>AI</div>
              <div className={styles.aiCard}>
                <div className={styles.aiMeta}>
                  <span className={styles.aiName}>CareerAI 멘토</span>
                  <span className={styles.stepBadge}>경험 선택</span>
                </div>
                <p>
                  <strong>문항 {currentQuestionIdx + 1}</strong>에 활용할 <strong>핵심 경험</strong>을 선택해주세요.<br />
                  <span className={styles.currentQuestionHint}>📝 {coverQuestions[currentQuestionIdx]?.text}</span>
                </p>
                {matchError && !matchLoading && (
                  <p className={styles.matchErrorText}>매칭율 분석에 실패했습니다. 백엔드 서버를 확인해주세요.</p>
                )}
              </div>
            </div>

            <div className={styles.expListWrap}>
              {(matchLoading || expLoading) && (
                <div className={styles.expListOverlay}>
                  <Loader2 size={28} className={styles.spinner} color="var(--color-primary)" />
                  <p className={styles.expListOverlayText}>{expLoading ? '경험 데이터 로딩 중...' : '매칭율 분석 중...'}</p>
                </div>
              )}
              <div className={`${styles.expList} ${(matchLoading || expLoading) ? styles.expListBlur : ''}`}>
                {experiences.length === 0 && !expLoading && (
                  <p className={styles.matchErrorText}>등록된 경험이 없습니다. 마이페이지에서 경험을 먼저 등록해주세요.</p>
                )}
                {experiences.map((exp) => {
                  const score = matchScores[exp.id];
                  const scoreColor =
                    score === undefined ? '' :
                    score >= 75 ? styles.matchHigh :
                    score >= 50 ? styles.matchMid :
                    styles.matchLow;
                  return (
                    <label key={exp.id} className={`${styles.expCard} ${selectedExp?.id === exp.id ? styles.expCardSelected : ''}`}>
                      <input type="radio" name="experience" checked={selectedExp?.id === exp.id} onChange={() => setSelectedExp(exp)} className={styles.radioHidden} />
                      <div className={styles.expCardInner}>
                        <div className={styles.radioCircle}>
                          {selectedExp?.id === exp.id && <div className={styles.radioDot} />}
                        </div>
                        <div className={styles.expInfo}>
                          <div className={styles.expHeader}>
                            <span className={styles.expTypeBadge}>{exp.type}</span>
                            <span className={`${styles.detailBadge} ${exp.hasDetail ? styles.detailDone : styles.detailMissing}`}>
                              세부사항 {exp.hasDetail ? '입력됨' : '미입력'}
                            </span>
                            {score !== undefined && (
                              <span className={`${styles.matchBadge} ${scoreColor}`}>
                                매칭율 {score}%
                              </span>
                            )}
                            {score === undefined && matchError && (
                              <span className={styles.matchBadgePending}>매칭율 없음</span>
                            )}
                          </div>
                          <div className={styles.expTitle}>
                            <strong>{exp.company}</strong>
                            <span className={styles.expPeriod}>{exp.period}</span>
                          </div>
                          <div className={styles.expRole}>{exp.role}</div>
                          <div className={styles.tagList}>
                            {exp.tags.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <button className={styles.primaryBtn} onClick={handleStep1Next} disabled={!selectedExp || matchLoading || expLoading}>
              선택 완료
            </button>
          </div>
        )}

        {/* Step 2: Experience detail check */}
        {wizardStep === 'step2' && selectedExp && (
          <div className={styles.stepContent}>
            <div className={styles.aiMessage}>
              <div className={styles.aiAvatar}>AI</div>
              <div className={styles.aiCard}>
                <div className={styles.aiMeta}>
                  <span className={styles.aiName}>CareerAI 멘토</span>
                  <span className={styles.stepBadge}>경험 사항 확인</span>
                </div>
                {selectedExp.hasDetail ? (
                  <p>선택하신 경험에 STAR 세부사항이 이미 입력되어 있어요.<br />바로 자소서 작성을 시작할게요!</p>
                ) : (
                  <p>
                    <strong style={{ color: 'var(--color-primary)' }}>{selectedExp.company}</strong> 경험의 세부사항이 아직 입력되지 않았어요.<br />
                    AI와 대화하며 STAR 구조에 맞게 경험을 디테일하게 정리한 뒤 자소서를 작성합니다.
                  </p>
                )}
              </div>
            </div>

            <div className={styles.selectedExpCard}>
              <div className={styles.expHeader}>
                <span className={styles.expTypeBadge}>{selectedExp.type}</span>
              </div>
              <div className={styles.expTitle}>
                <strong>{selectedExp.company}</strong>
                <span className={styles.expPeriod}>{selectedExp.period}</span>
              </div>
              <div className={styles.expRole}>{selectedExp.role}</div>
              <div className={styles.tagList}>
                {selectedExp.tags.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
              </div>
            </div>

            <button className={styles.primaryBtn} onClick={handleStep2Next}>
              {selectedExp.hasDetail ? '자소서 작성으로 이동 →' : 'STAR 구조로 경험 정리하기 →'}
            </button>
          </div>
        )}

        {/* Step 3: STAR chat */}
        {wizardStep === 'step3' && (
          <div className={styles.chatView}>
            <div className={styles.chatBadge}>
              <span>{selectedExp?.company} · {selectedExp?.role} 경험을 STAR 구조로 정리 중</span>
            </div>
            <div className={styles.chatMessages}>
              {starMessages.map((msg, i) => (
                <div key={i}>
                  <div className={styles.aiMessage}>
                    <div className={styles.aiAvatar}>AI</div>
                    <div className={styles.aiCard}>
                      <div className={styles.aiMeta}>
                        <span className={styles.aiName}>CareerAI 멘토</span>
                        <span className={styles.stepBadge}>{msg.label}</span>
                      </div>
                      <p style={{ whiteSpace: 'pre-line' }}>{msg.question}</p>
                      <p className={styles.hint}>{msg.hint}</p>
                    </div>
                  </div>
                  {msg.answer && (
                    <div className={styles.userMessage}>
                      <div className={styles.userBubble}>{msg.answer}</div>
                    </div>
                  )}
                </div>
              ))}
              {starLoading && (
                <div className={styles.aiMessage}>
                  <div className={styles.aiAvatar}>AI</div>
                  <div className={styles.aiCard}>
                    <Loader2 size={16} className={styles.spinner} /> STAR 내용을 정리하고 있어요...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            {!starLoading && (
              <div className={styles.chatInputBar}>
                <textarea
                  className={styles.chatTextarea}
                  placeholder="답변을 입력하세요..."
                  value={starInput}
                  onChange={(e) => setStarInput(e.target.value)}
                  onKeyDown={handleStarKey}
                  rows={2}
                />
                <button className={styles.sendBtn} onClick={handleStarSubmit} disabled={!starInput.trim()}>
                  <Send size={18} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3 Save: STAR summary */}
        {wizardStep === 'step3_save' && starSummary && (
          <div className={styles.stepContent}>
            <div className={styles.aiMessage}>
              <div className={styles.aiAvatar}>AI</div>
              <div className={styles.aiCard}>
                <div className={styles.aiMeta}>
                  <span className={styles.aiName}>CareerAI 멘토</span>
                  <span className={`${styles.stepBadge} ${styles.badgeSuccess}`}>STAR 정리 완료</span>
                </div>
                <p>
                  정리된 경험을 마이페이지에 저장할까요?<br />
                  저장하면 다음 자소서 작성 시에도 바로 활용할 수 있어요.
                </p>
              </div>
            </div>

            <div className={styles.starSummaryCard}>
              <div className={styles.starSummaryTitle}>{selectedExp?.company} · {selectedExp?.role} — 정리된 내용</div>
              {(['S', 'T', 'A', 'R'] as const).map((k) => (
                <div key={k} className={styles.starRow}>
                  <span className={`${styles.starLabel} ${styles[`starLabel${k}`]}`}>{k}</span>
                  <span>{starSummary[k]}</span>
                </div>
              ))}
            </div>

            <div className={styles.btnRow}>
              <button className={styles.primaryBtn} onClick={handleStep3SaveAndContinue}>
                마이페이지 업데이트 후 자소서 작성
              </button>
              <button className={styles.secondaryBtn} onClick={handleStep3Continue}>
                업데이트 없이 자소서 작성
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Cover letter chat */}
        {(wizardStep === 'step4' || wizardStep === 'done') && (
          <div className={styles.coverLetterView}>
            {/* Left: Cover letter draft */}
            <div className={styles.coverLetterContent}>
              <div className={styles.coverLetterHeader}>
                <h3 className={styles.coverLetterHeaderTitle}>자소서 작성 중</h3>
                <div className={styles.questionTimeline}>
                  {coverQuestions.map((q, i) => {
                    const isActive = i === currentQuestionIdx;
                    const isCompleted = allDrafts[i] != null;
                    return (
                      <div key={i} className={styles.timelineItem}>
                        <p className={`${styles.coverLetterHeaderQuestion} ${isActive ? styles.timelineActive : ''} ${isCompleted ? styles.timelineCompleted : ''}`}>
                          Q{i + 1}. {q.text}
                        </p>
                        {i < coverQuestions.length - 1 && (
                          <div className={styles.timelineDivider} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {draftLetter ? (
                <div className={styles.finalLetterCard}>
                  <div className={styles.finalLetterContent}>
                    {draftLetter}
                    {!finalLetter && <span className={styles.blinkCursor}>|</span>}
                  </div>
                  {finalLetter && (
                    <button className={styles.primaryBtn} onClick={() => navigator.clipboard.writeText(finalLetter)}>
                      자소서 복사하기
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.draftPlaceholder}>
                  <p>자소서가 여기에 작성됩니다</p>
                  <p className={styles.draftPlaceholderText}>
                    우측 채팅창에서 AI의 질문에 답변하면<br />
                    AI가 자소서를 실시간으로 작성합니다
                  </p>
                </div>
              )}
            </div>

            {/* Right: Chat sidebar */}
            <div className={styles.chatSidebar}>
              {wizardStep !== 'done' && (
                <div className={styles.chatBadge}>
                  <CheckCircle size={14} color="var(--color-success)" />
                  <span>자소서 작성 중</span>
                </div>
              )}

              <div className={styles.chatMessages}>
                {coverMessages.length === 0 && coverLoading && (
                  <div className={styles.aiMessage}>
                    <div className={styles.aiAvatar}>AI</div>
                    <div className={styles.aiCard}>
                      <Loader2 size={16} className={styles.spinner} /> 질문을 준비하고 있어요...
                    </div>
                  </div>
                )}

                {coverMessages.map((msg, i) => (
                  <div key={i}>
                    {msg.role === 'assistant' ? (
                      <div className={styles.aiMessage}>
                        <div className={styles.aiAvatar}>AI</div>
                        <div className={styles.aiCard}>
                          <div className={styles.aiMeta}>
                            <span className={styles.aiName}>CareerAI</span>
                            {msg.aspect && <span className={styles.stepBadge}>{msg.aspect}</span>}
                          </div>
                          <p>{msg.content}</p>
                          {msg.options && msg.options.length > 0 && (
                            <div className={styles.optionGrid}>
                              {msg.options.map((opt, j) => (
                                <button
                                  key={j}
                                  className={styles.optionCard}
                                  onClick={() => handleCoverSend(opt)}
                                  disabled={coverLoading || i < coverMessages.length - 1}
                                >
                                  <span className={styles.optionNum}>{j + 1}</span>
                                  <span>{opt}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className={styles.userMessage}>
                        <div className={styles.userBubble}>{msg.content}</div>
                      </div>
                    )}
                  </div>
                ))}

                {coverLoading && coverMessages.length > 0 && (
                  <div className={styles.aiMessage}>
                    <div className={styles.aiAvatar}>AI</div>
                    <div className={styles.aiCard}>
                      <Loader2 size={16} className={styles.spinner} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {wizardStep === 'step4' && !coverLoading && (
                <div className={styles.chatInputBar}>
                  <textarea
                    className={styles.chatTextarea}
                    placeholder="위 보기를 선택하거나 직접 입력하세요..."
                    value={coverInput}
                    onChange={(e) => setCoverInput(e.target.value)}
                    onKeyDown={handleCoverKey}
                    rows={2}
                  />
                  <button className={styles.sendBtn} onClick={() => handleCoverSend(coverInput)} disabled={!coverInput.trim()}>
                    <Send size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
