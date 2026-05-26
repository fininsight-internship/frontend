import { useState, type MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { interviewService } from '../../services/interviewService';
import type { AvailablePosition, EvaluationAxis, InterviewQuestion, AnswerFeedback, FollowUpQuestion, OverallInterviewReport } from '../../types';
import styles from './InterviewDetail.module.css';
import { ROUTES } from '../../constants';

type AddQuestionMode = 'ai' | 'manual';
type PendingDeleteQuestion = {
  question: InterviewQuestion;
  index: number;
};

const getFeedbackLogs = (question: InterviewQuestion) => (
  question.feedbackLogs?.length
    ? question.feedbackLogs
    : ((question.feedback as AnswerFeedback & { feedback_logs?: InterviewQuestion['feedbackLogs'] })?.feedback_logs || [])
);

export default function InterviewDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const state = location.state as {
    position: AvailablePosition;
    axesUsed: EvaluationAxis[];
    questions: InterviewQuestion[];
    featureWeights: Record<string, number>;
    analysisId?: number;
    resumeId?: number;
    interviewType?: string;
    axisType?: string;
    isNew: boolean;
    sessionId?: string;
    overallReport?: OverallInterviewReport;
  } | undefined;

  const [questions, setQuestions] = useState<InterviewQuestion[]>(
    state?.questions?.map(q => ({
      ...q,
      feedback: typeof q.feedback === 'string' ? JSON.parse(q.feedback) : q.feedback
    })) || []
  );
  const [activeQuestionId, setActiveQuestionId] = useState<string>(questions[0]?.id || '');
  
  const [loadingFeedback, setLoadingFeedback] = useState<Record<string, boolean>>({});
  const [loadingFollowUp, setLoadingFollowUp] = useState<Record<string, boolean>>({});
  

  const [showAxesModal, setShowAxesModal] = useState(false);
  const [showQuestionGuide, setShowQuestionGuide] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [addQuestionMode, setAddQuestionMode] = useState<AddQuestionMode>('ai');
  const [selectedAddAxisKeys, setSelectedAddAxisKeys] = useState<string[]>([]);
  const [addQuestionCount, setAddQuestionCount] = useState(1);
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualAxisKey, setManualAxisKey] = useState('');
  const [loadingAddQuestions, setLoadingAddQuestions] = useState(false);
  const [questionPendingDelete, setQuestionPendingDelete] = useState<PendingDeleteQuestion | null>(null);
  const [showSaveReportPrompt, setShowSaveReportPrompt] = useState(false);
  const [showOverallReportModal, setShowOverallReportModal] = useState(false);
  const [loadingOverallReport, setLoadingOverallReport] = useState(false);
  const [overallReport, setOverallReport] = useState<OverallInterviewReport | undefined>(state?.overallReport);

  if (!state) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-text)' }}>잘못된 접근입니다.</h2>
        <button className={styles.primaryBtn} onClick={() => navigate(ROUTES.INTERVIEW)}>홈으로 돌아가기</button>
      </div>
    );
  }

  const { position, featureWeights, axesUsed, analysisId, resumeId } = state;
  const interviewType = state.interviewType || '전체';
  const axisType = state.axisType || 'dynamic';
  const behavioralCategories = ['behavioral', 'situational', 'values', 'growth', 'communication'];
  const practicalCategories = ['technical', 'problem_solving', 'project', 'design', 'impact'];
  const inferInterviewType = () => {
    if (interviewType === '인성' || interviewType === '실무') return interviewType;

    const practicalCount = questions.filter(q => practicalCategories.includes(q.category)).length;
    const behavioralCount = questions.filter(q => behavioralCategories.includes(q.category)).length;
    if (practicalCount > behavioralCount) return '실무';
    if (behavioralCount > practicalCount) return '인성';
    return interviewType;
  };
  const effectiveInterviewType = inferInterviewType();

  const activeQuestionIndex = questions.findIndex(q => q.id === activeQuestionId);
  const activeQuestion = questions[activeQuestionIndex];
  const activeAxis = axesUsed?.find(ax =>
    ax.key === activeQuestion?.evaluation_axis ||
    ax.name === activeQuestion?.axis_name
  );

  const handleAnswerChange = (text: string) => {
    setQuestions(prev => prev.map(q => q.id === activeQuestionId ? { ...q, userAnswer: text } : q));
  };

  const handleSelectQuestion = (questionId: string) => {
    setActiveQuestionId(questionId);
    setShowQuestionGuide(false);
  };

  const deleteQuestion = (questionId: string, questionIndex: number) => {
    setQuestions(prev => {
      const deletedIndex = prev[questionIndex]?.id === questionId
        ? questionIndex
        : prev.findIndex(q => q.id === questionId);
      if (deletedIndex < 0) return prev;

      const next = prev.filter((_, idx) => idx !== deletedIndex);

      if (questionId === activeQuestionId) {
        const nextActiveQuestion = next[deletedIndex] || next[deletedIndex - 1];
        setActiveQuestionId(nextActiveQuestion?.id || '');
        setShowQuestionGuide(false);
      }

      return next;
    });
    setLoadingFeedback(prev => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    setLoadingFollowUp(prev => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    if (state.sessionId) {
      interviewService.deleteSessionQuestion(state.sessionId, questionId).catch(() => {
        alert('질문 삭제 저장에 실패했습니다. 전체 저장하기를 눌러 다시 저장해주세요.');
      });
    }
  };

  const requestDeleteQuestion = (question: InterviewQuestion, index: number, event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setQuestionPendingDelete({ question, index });
  };

  const confirmDeleteQuestion = () => {
    if (!questionPendingDelete) return;
    deleteQuestion(questionPendingDelete.question.id, questionPendingDelete.index);
    setQuestionPendingDelete(null);
  };

  const handleFeedback = async () => {
    if (!activeQuestion || !activeQuestion.userAnswer?.trim()) return;
    setLoadingFeedback(prev => ({ ...prev, [activeQuestion.id]: true }));
    try {
      const fb = await interviewService.getFeedback(
        position.company, position.job_role,
        activeQuestion.question, activeQuestion.userAnswer, featureWeights,
        analysisId, resumeId,
        activeQuestion.evaluation_axis ? axesUsed.filter(ax => ax.key === activeQuestion.evaluation_axis) : []
      );
      setQuestions(prev => prev.map(item => {
        if (item.id !== activeQuestion.id) return item;
        const feedbackLog = {
          score: fb.overall_score,
          answer: activeQuestion.userAnswer || '',
          strengths: fb.strengths || [],
          improvement: fb.improvement || '',
          risk_points: fb.risk_points || [],
          created_at: new Date().toISOString(),
        };
        return {
          ...item,
          feedback: fb,
          feedbackLogs: [...(item.feedbackLogs || []), feedbackLog],
        };
      }));
    } catch {
      alert('피드백 요청에 실패했습니다.');
    } finally {
      setLoadingFeedback(prev => ({ ...prev, [activeQuestion.id]: false }));
    }
  };

  const handleFollowUp = async () => {
    if (!activeQuestion || !activeQuestion.userAnswer?.trim() || !activeQuestion.feedback) return;
    setLoadingFollowUp(prev => ({ ...prev, [activeQuestion.id]: true }));
    try {
      const existingFollowUps = (activeQuestion.followUps || []).map(fu => fu.question);
      const res = await interviewService.getFollowUp(
        position.company, position.job_role,
        activeQuestion.question, activeQuestion.userAnswer,
        undefined, analysisId, resumeId, existingFollowUps
      );
      const nextFollowUp = res.follow_up_questions?.[0];
      if (!nextFollowUp) return;
      setQuestions(prev => prev.map(item =>
        item.id === activeQuestion.id
          ? { ...item, followUps: [...(item.followUps || []), nextFollowUp] }
          : item
      ));
    } catch {
      alert('꼬리질문 요청에 실패했습니다.');
    } finally {
      setLoadingFollowUp(prev => ({ ...prev, [activeQuestion.id]: false }));
    }
  };

  const handleFollowUpAnswerChange = (qId: string, fuIndex: number, text: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === qId && q.followUps) {
        const newFu = [...q.followUps];
        newFu[fuIndex] = { ...newFu[fuIndex], userAnswer: text };
        return { ...q, followUps: newFu };
      }
      return q;
    }));
  };

  const handleFollowUpFeedback = async (qId: string, fuIndex: number) => {
    const q = questions.find(x => x.id === qId);
    if (!q || !q.followUps) return;
    const fu = q.followUps[fuIndex];
    if (!fu.userAnswer?.trim()) return;

    setQuestions(prev => prev.map(x => {
      if (x.id === qId && x.followUps) {
        const newFu = [...x.followUps];
        newFu[fuIndex] = { ...newFu[fuIndex], isLoading: true };
        return { ...x, followUps: newFu };
      }
      return x;
    }));

    try {
      const res = await interviewService.getFollowUpFeedback(
        position.company,
        position.job_role,
        q.question,
        fu.question,
        fu.intent,
        fu.userAnswer
      );
      setQuestions(prev => prev.map(x => {
        if (x.id === qId && x.followUps) {
          const newFu = [...x.followUps];
          newFu[fuIndex] = { ...newFu[fuIndex], feedback: res.feedback, isLoading: false };
          return { ...x, followUps: newFu };
        }
        return x;
      }));
    } catch {
      alert("피드백 분석에 실패했습니다.");
      setQuestions(prev => prev.map(x => {
        if (x.id === qId && x.followUps) {
          const newFu = [...x.followUps];
          newFu[fuIndex] = { ...newFu[fuIndex], isLoading: false };
          return { ...x, followUps: newFu };
        }
        return x;
      }));
    }
  };

  const handleDeleteFollowUp = (questionIndex: number, fuIndex: number) => {
    const question = questions[questionIndex];
    const followUp = question?.followUps?.[fuIndex];
    if (!question || !followUp) return;
    if (!window.confirm('꼬리질문과 작성한 답변, 피드백을 삭제할까요?')) return;

    setQuestions(prev => prev.map((item, idx) => (
      idx === questionIndex
        ? { ...item, followUps: (item.followUps || []).filter((_, itemIndex) => itemIndex !== fuIndex) }
        : item
    )));

    if (state.sessionId && followUp.id) {
      interviewService.deleteSessionFollowUp(state.sessionId, question.id, followUp.id).catch(() => {
        alert('꼬리질문 삭제에 실패했습니다. 새로고침 후 다시 시도해주세요.');
      });
    }
  };

  const saveSession = async (report?: OverallInterviewReport) => {
    try {
      await interviewService.saveSession(position.company, position.job_role, questions, state.sessionId, axesUsed, effectiveInterviewType, axisType, report);
      alert('저장되었습니다! 면접 목록으로 이동합니다.');
      navigate(ROUTES.INTERVIEW);
    } catch {
      alert('저장에 실패했습니다.');
    }
  };

  const handleSave = () => {
    setShowSaveReportPrompt(true);
  };

  const handleSaveWithoutReport = () => {
    setShowSaveReportPrompt(false);
    const reportToSave = overallReport ? { ...overallReport, is_outdated: true } : undefined;
    if (reportToSave) setOverallReport(reportToSave);
    saveSession(reportToSave);
  };

  const handleGenerateOverallReport = async () => {
    setLoadingOverallReport(true);
    try {
      const report = await interviewService.getOverallReport(
        position.company,
        position.job_role,
        effectiveInterviewType,
        questions,
        axesUsed,
        analysisId,
        resumeId
      );
      setOverallReport({ ...report, is_outdated: false });
      setShowSaveReportPrompt(false);
      setShowOverallReportModal(true);
    } catch {
      alert('전체 면접 리포트 생성에 실패했습니다.');
    } finally {
      setLoadingOverallReport(false);
    }
  };

  const handleSaveWithReport = () => {
    saveSession(overallReport ? { ...overallReport, is_outdated: false } : undefined);
  };

  const categoryLabel = (c: string) => {
    if (c === 'behavioral') return { label: '인성/경험', style: styles.typeCompany };
    if (c === 'situational') return { label: '상황 판단', style: styles.typeSituational };
    if (c === 'values') return { label: '가치관', style: styles.typeValues };
    if (c === 'growth') return { label: '성장 가능성', style: styles.typeGrowth };
    if (c === 'communication') return { label: '커뮤니케이션', style: styles.typeCommunication };
    if (c === 'technical') return { label: '직무/기술', style: styles.typeJob };
    if (c === 'problem_solving') return { label: '문제 해결', style: styles.typeProblemSolving };
    if (c === 'project') return { label: '프로젝트', style: styles.typeProject };
    if (c === 'design') return { label: '설계/구조화', style: styles.typeDesign };
    if (c === 'impact') return { label: '성과/임팩트', style: styles.typeImpact };
    return { label: '기본', style: styles.typeDefault };
  };

  const createQuestionId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return `q-${crypto.randomUUID().slice(0, 8)}`;
    }
    return `q-${Date.now().toString(36)}`;
  };

  const getDefaultCategory = () => {
    if (effectiveInterviewType === '실무') return 'technical';
    if (effectiveInterviewType === '인성') return 'behavioral';
    return activeQuestion?.category || questions[0]?.category || 'behavioral';
  };

  const openAddQuestionModal = () => {
    const firstAxisKey = axesUsed?.[0]?.key || '';
    setAddQuestionMode('ai');
    setSelectedAddAxisKeys(firstAxisKey ? [firstAxisKey] : []);
    setAddQuestionCount(1);
    setManualQuestion('');
    setManualAxisKey('');
    setShowAddQuestionModal(true);
  };

  const toggleAddAxis = (axisKey: string) => {
    setSelectedAddAxisKeys(prev => {
      const next = prev.includes(axisKey)
        ? prev.filter(key => key !== axisKey)
        : [...prev, axisKey];
      setAddQuestionCount(count => Math.max(count, next.length || 1));
      return next;
    });
  };

  const handleAddQuestionCountChange = (value: string) => {
    const next = Number(value);
    if (Number.isNaN(next)) return;
    setAddQuestionCount(Math.max(1, next));
  };

  const handleGenerateAdditionalQuestions = async () => {
    if (selectedAddAxisKeys.length === 0) {
      alert('평가 기준을 1개 이상 선택해주세요.');
      return;
    }
    if (addQuestionCount < selectedAddAxisKeys.length) {
      alert(`선택한 평가 기준이 ${selectedAddAxisKeys.length}개이므로 ${selectedAddAxisKeys.length}개 이상 생성해야 합니다.`);
      return;
    }

    const selectedAxes = axesUsed.filter(ax => selectedAddAxisKeys.includes(ax.key));
    setLoadingAddQuestions(true);
    try {
      const res = await interviewService.getAdditionalQuestions(
        position.company,
        position.job_role,
        effectiveInterviewType,
        selectedAxes,
        addQuestionCount,
        questions.map(q => q.question),
        analysisId,
        resumeId
      );
      const newQuestions = res.questions.map(q => ({ ...q, userAnswer: '' }));
      setQuestions(prev => [...prev, ...newQuestions]);
      if (newQuestions[0]) {
        setActiveQuestionId(newQuestions[0].id);
        setShowQuestionGuide(false);
      }
      setShowAddQuestionModal(false);
    } catch {
      alert('추가 질문 생성에 실패했습니다.');
    } finally {
      setLoadingAddQuestions(false);
    }
  };

  const handleAddManualQuestion = () => {
    const questionText = manualQuestion.trim();
    if (!questionText) {
      alert('추가할 질문을 입력해주세요.');
      return;
    }

    const selectedAxis = axesUsed.find(ax => ax.key === manualAxisKey);
    const newQuestion: InterviewQuestion = {
      id: createQuestionId(),
      question: questionText,
      category: getDefaultCategory(),
      tips: selectedAxis
        ? `${selectedAxis.name} 관점에서 답변의 근거와 구체성을 확인합니다.`
        : '직접 추가한 질문입니다. 답변의 구체성, 논리성, 직무 연관성, 자기 이해도를 중심으로 확인합니다.',
      evaluation_axis: selectedAxis?.key,
      axis_name: selectedAxis?.name,
      axis_weight: selectedAxis?.weight,
      userAnswer: '',
    };

    setQuestions(prev => [...prev, newQuestion]);
    setActiveQuestionId(newQuestion.id);
    setShowQuestionGuide(false);
    setShowAddQuestionModal(false);
  };

  const answeredCount = questions.filter(q => (q.userAnswer || '').trim().length > 0).length;
  const minimumQuestionCount = Math.max(1, selectedAddAxisKeys.length);
  const dimensionChartData = overallReport
    ? Object.entries(overallReport.dimension_scores || {}).map(([name, score]) => ({ name, score }))
    : [];
  const questionScoreData = overallReport?.question_reviews?.map((item, idx) => ({
    name: `Q${idx + 1}`,
    score: item.score ?? 0,
  })) || [];
  const feedbackMaxRound = Math.max(0, ...questions.map(question => getFeedbackLogs(question).length));
  const averageFeedbackTrendData = Array.from({ length: feedbackMaxRound }, (_, roundIdx) => {
    const scores = questions
      .map(question => getFeedbackLogs(question)[roundIdx]?.score)
      .filter((score): score is number => typeof score === 'number');
    return {
      name: `${roundIdx + 1}회`,
      average: scores.length ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)) : undefined,
    };
  });
  const answerFeedbackLineKeys = questions
    .map((question, idx) => ({ key: `Q${idx + 1}`, hasLogs: Boolean(getFeedbackLogs(question).length) }))
    .filter(item => item.hasLogs)
    .map(item => item.key);
  const answerFeedbackTrendData = Array.from({ length: feedbackMaxRound }, (_, roundIdx) => {
    const row: Record<string, string | number | undefined> = { name: `${roundIdx + 1}회` };
    questions.forEach((question, idx) => {
      row[`Q${idx + 1}`] = getFeedbackLogs(question)[roundIdx]?.score;
    });
    return row;
  });
  const answerLineColors = ['#2563eb', '#14b8a6', '#f97316', '#8b5cf6', '#ef4444', '#0ea5e9', '#84cc16', '#f59e0b'];

  return (
    <div className={styles.container}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate(ROUTES.INTERVIEW)}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className={styles.topInfo}>
          <div className={styles.topTitle}>{position.company} · {position.job_role} · 면접 진행</div>
          <div className={styles.topSubtitle}>질문 {answeredCount}/{questions.length} 진행 중</div>
        </div>
        <div className={styles.topActions}>
          {axesUsed && axesUsed.length > 0 && (
            <button className={styles.secondaryBtn} onClick={() => setShowAxesModal(true)}>평가기준 보기</button>
          )}
          <button className={styles.primaryBtn} onClick={handleSave}>전체 저장하기</button>
        </div>
      </div>

      {showSaveReportPrompt && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="save-report-modal-title">
          <div className={styles.deleteModalPanel}>
            <div className={styles.deleteModalHeader}>
              <h2 id="save-report-modal-title" className={styles.deleteModalTitle}>
                {overallReport ? '종합 리포트를 업데이트할까요?' : '전체 면접 피드백을 받을까요?'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={() => setShowSaveReportPrompt(false)} aria-label="저장 확인 닫기">×</button>
            </div>
            <div className={styles.deleteModalBody}>
              <p className={styles.deleteModalText}>
                {overallReport
                  ? '업데이트 없이 저장하면 기존 리포트는 이전 답변과 피드백 기준으로 남습니다. 리포트 보기에서 최신 내용이 반영되지 않았다고 표시됩니다.'
                  : '현재 답변과 질문별 피드백을 바탕으로 면접왕 이형 스타일의 종합 평가 리포트를 생성할 수 있습니다.'}
              </p>
            </div>
            <div className={styles.deleteModalFooter}>
              <button className={styles.secondaryBtn} onClick={handleSaveWithoutReport} type="button" disabled={loadingOverallReport}>
                {overallReport ? '아니오, 저장만' : '아니오, 그냥 저장'}
              </button>
              <button className={styles.primaryBtn} onClick={handleGenerateOverallReport} type="button" disabled={loadingOverallReport}>
                {loadingOverallReport
                  ? (overallReport ? '업데이트 중...' : '리포트 생성 중...')
                  : (overallReport ? '예, 업데이트하기' : '예, 리포트 받기')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showOverallReportModal && overallReport && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="overall-report-modal-title">
          <div className={styles.reportModalPanel}>
            <div className={styles.modalHeader}>
              <div>
                <h2 id="overall-report-modal-title" className={styles.modalTitle}>전체 면접 평가 리포트</h2>
                <p className={styles.reportSubtitle}>{position.company} · {position.job_role}</p>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setShowOverallReportModal(false)} aria-label="리포트 닫기">×</button>
            </div>

            <div className={styles.reportBody}>
              {overallReport.is_outdated && (
                <div className={styles.reportStaleNotice}>
                  <div>
                    <strong>이 리포트는 최신 저장 내용이 반영되지 않았습니다.</strong>
                    <p>업데이트 없이 저장해서 이전 답변과 피드백 기준의 리포트가 표시되고 있습니다.</p>
                  </div>
                  <button className={styles.primaryBtn} onClick={handleGenerateOverallReport} type="button" disabled={loadingOverallReport}>
                    {loadingOverallReport ? '업데이트 중...' : '리포트 업데이트'}
                  </button>
                </div>
              )}

              <section className={styles.reportHero}>
                <div className={styles.reportScoreBox}>
                  <div className={styles.reportScore}>{overallReport.overall_score}</div>
                  <div className={styles.reportScoreLabel}>{overallReport.readiness_label}</div>
                </div>
                <div className={styles.reportSummary}>
                  <div className={styles.reportSectionLabel}>면접관 한줄평</div>
                  <p>{overallReport.interviewer_one_liner}</p>
                  <div className={styles.reportSectionLabel}>코치 총평</div>
                  <p>{overallReport.coach_summary}</p>
                </div>
              </section>

              <section className={styles.reportGrid}>
                <div className={styles.reportChartCard}>
                  <h3>역량 분포</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={dimensionChartData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.28} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.reportChartCard}>
                  <h3>질문별 점수 (5점 만점)</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={questionScoreData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                      <Bar dataKey="score" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {(averageFeedbackTrendData.length > 0 || answerFeedbackLineKeys.length > 0) && (
                <section className={styles.reportSection}>
                  <h3>답변 완성도 변화</h3>
                  <div className={styles.reportGrid}>
                    {averageFeedbackTrendData.length > 0 && (
                      <div className={styles.reportChartCard}>
                        <h3>전체 답변 평균 점수 변화</h3>
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={averageFeedbackTrendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(value) => [`${value}점`, '평균']} />
                            <Line type="monotone" dataKey="average" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {answerFeedbackLineKeys.length > 0 && (
                      <div className={styles.reportChartCard}>
                        <h3>답변별 점수 변화</h3>
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={answerFeedbackTrendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(value, name) => [`${value}점`, name]} />
                            {answerFeedbackLineKeys.map((key, idx) => (
                              <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={answerLineColors[idx % answerLineColors.length]}
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                connectNulls
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                  {averageFeedbackTrendData.length < 2 && (
                    <p className={styles.reportMutedText}>같은 질문이나 여러 답변에 대해 피드백 로그가 더 쌓이면 변화 추이가 더 선명하게 표시됩니다.</p>
                  )}
                </section>
              )}

              <section className={styles.reportColumns}>
                <div>
                  <h3>강점 TOP 3</h3>
                  {(overallReport.strengths || []).map((item, idx) => (
                    <div className={styles.reportListItem} key={`strength-${idx}`}>
                      <strong>{item.title}</strong>
                      <p>{item.evidence}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <h3>감점 리스크 TOP 3</h3>
                  {(overallReport.risks || []).map((item, idx) => (
                    <div className={styles.reportListItem} key={`risk-${idx}`}>
                      <strong>{item.title}</strong>
                      <p>{item.reason}</p>
                      <span>{item.fix}</span>
                    </div>
                  ))}
                </div>
              </section>

              {overallReport.answer_growth && (
                <section className={styles.reportSection}>
                  <h3>답변 향상 추이</h3>
                  <div className={styles.reportGrowthBox}>
                    <p>{overallReport.answer_growth.summary}</p>
                    <span>{overallReport.answer_growth.score_trend}</span>
                  </div>
                  <div className={styles.reportColumns}>
                    <div>
                      <h3>좋아지고 있는 부분</h3>
                      {(overallReport.answer_growth.improved_points || []).map((item, idx) => (
                        <div className={styles.reportListItem} key={`growth-good-${idx}`}>
                          <p>{item}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h3>아직 남은 보완점</h3>
                      {(overallReport.answer_growth.remaining_gaps || []).map((item, idx) => (
                        <div className={styles.reportListItem} key={`growth-gap-${idx}`}>
                          <p>{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              <section className={styles.reportSection}>
                <h3>다음 연습 우선순위</h3>
                {(overallReport.next_actions || []).map((item, idx) => (
                  <div className={styles.reportActionItem} key={`action-${idx}`}>
                    <span>{idx + 1}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                    </div>
                  </div>
                ))}
              </section>

              <section className={styles.reportSection}>
                <h3>질문별 요약 피드백</h3>
                {(overallReport.question_reviews || []).map((item, idx) => (
                  <div className={styles.reportQuestionItem} key={`q-review-${idx}`}>
                    <div>
                      <strong>Q{idx + 1}. {item.question}</strong>
                      <p>{item.summary}</p>
                    </div>
                    <span>{item.score === null ? '미평가' : `${item.score}/5점`} · {item.priority}</span>
                  </div>
                ))}
              </section>
            </div>

            <div className={styles.reportFooter}>
              <button className={styles.secondaryBtn} onClick={() => setShowOverallReportModal(false)} type="button">닫기</button>
              <button className={styles.primaryBtn} onClick={handleSaveWithReport} type="button">리포트와 함께 저장</button>
            </div>
          </div>
        </div>
      )}

      {showAxesModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="axes-modal-title">
          <div className={styles.modalPanel}>
            <div className={styles.modalHeader}>
              <h2 id="axes-modal-title" className={styles.modalTitle}>전체 평가기준</h2>
              <button className={styles.modalCloseBtn} onClick={() => setShowAxesModal(false)} aria-label="평가기준 닫기">×</button>
            </div>
            <div className={styles.modalAxesList}>
              {axesUsed.map((ax, idx) => (
                <div key={`${ax.key}-${idx}`} className={styles.modalAxisItem}>
                  <div className={styles.modalAxisTop}>
                    <span className={styles.modalAxisName}>{ax.name}</span>
                    {ax.weight !== undefined && <span className={styles.modalAxisWeight}>{ax.weight}</span>}
                  </div>
                  <p className={styles.modalAxisDesc}>{ax.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {questionPendingDelete && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="delete-question-modal-title">
          <div className={styles.deleteModalPanel}>
            <div className={styles.deleteModalHeader}>
              <h2 id="delete-question-modal-title" className={styles.deleteModalTitle}>질문을 삭제할까요?</h2>
              <button className={styles.modalCloseBtn} onClick={() => setQuestionPendingDelete(null)} aria-label="삭제 확인 닫기">×</button>
            </div>
            <div className={styles.deleteModalBody}>
              <p className={styles.deleteModalText}>
                이 질문과 함께 작성한 답변, 피드백, 꼬리질문 기록이 모두 삭제됩니다.
              </p>
            </div>
            <div className={styles.deleteModalFooter}>
              <button className={styles.cancelBtn} onClick={() => setQuestionPendingDelete(null)} type="button">취소</button>
              <button className={styles.deleteConfirmBtn} onClick={confirmDeleteQuestion} type="button">삭제</button>
            </div>
          </div>
        </div>
      )}

      {showAddQuestionModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="add-question-modal-title">
          <div className={styles.addQuestionModalPanel}>
            <div className={styles.addQuestionHeader}>
              <div>
                <h2 id="add-question-modal-title" className={styles.addQuestionTitle}>추가 질문 생성</h2>
                <p className={styles.addQuestionSubtitle}>{position.company} · {position.job_role} 기준</p>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setShowAddQuestionModal(false)} aria-label="추가 질문 닫기">×</button>
            </div>

            <div className={styles.addQuestionBody}>
              <div className={styles.segmentedControl} role="tablist" aria-label="질문 추가 방식">
                <button
                  className={`${styles.segmentedButton} ${addQuestionMode === 'ai' ? styles.segmentedButtonActive : ''}`}
                  onClick={() => setAddQuestionMode('ai')}
                  type="button"
                >
                  AI 자동 생성
                </button>
                <button
                  className={`${styles.segmentedButton} ${addQuestionMode === 'manual' ? styles.segmentedButtonActive : ''}`}
                  onClick={() => setAddQuestionMode('manual')}
                  type="button"
                >
                  직접 입력
                </button>
              </div>

              {addQuestionMode === 'ai' ? (
                <>
                  <section className={styles.addQuestionSection}>
                    <h3 className={styles.addQuestionSectionTitle}>평가 기준 선택</h3>
                    <div className={styles.axisChoiceGrid}>
                      {axesUsed.map(axis => {
                        const selected = selectedAddAxisKeys.includes(axis.key);
                        return (
                          <button
                            key={axis.key}
                            type="button"
                            className={`${styles.axisChoice} ${selected ? styles.axisChoiceSelected : ''}`}
                            onClick={() => toggleAddAxis(axis.key)}
                          >
                            <span className={styles.axisChoiceName}>{axis.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className={styles.addQuestionSection}>
                    <h3 className={styles.addQuestionSectionTitle}>생성 개수</h3>
                    <p className={styles.addQuestionHint}>{minimumQuestionCount}개 이상 질문을 생성해주세요</p>
                    <input
                      className={styles.countInput}
                      type="number"
                      min={minimumQuestionCount}
                      max={10}
                      value={addQuestionCount}
                      onChange={(e) => handleAddQuestionCountChange(e.target.value)}
                    />
                  </section>
                </>
              ) : (
                <>
                  <section className={styles.addQuestionSection}>
                    <h3 className={styles.addQuestionSectionTitle}>질문 입력</h3>
                    <textarea
                      className={styles.manualQuestionTextarea}
                      value={manualQuestion}
                      onChange={(e) => setManualQuestion(e.target.value)}
                      placeholder="추가할 면접 질문을 입력해주세요."
                    />
                  </section>

                  <section className={styles.addQuestionSection}>
                    <h3 className={styles.addQuestionSectionTitle}>평가 기준 연결</h3>
                    <p className={styles.addQuestionHint}>평가 기준을 선택하지 않으면 구체성, 논리성, 직무 연관성 등 공통 기준으로 평가됩니다.</p>
                    <div className={styles.axisChoiceGrid}>
                      {axesUsed.map(axis => {
                        const selected = manualAxisKey === axis.key;
                        return (
                          <button
                            key={axis.key}
                            type="button"
                            className={`${styles.axisChoice} ${selected ? styles.axisChoiceSelected : ''}`}
                            onClick={() => setManualAxisKey(selected ? '' : axis.key)}
                          >
                            <span className={styles.axisChoiceName}>{axis.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </>
              )}
            </div>

            <div className={styles.addQuestionFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowAddQuestionModal(false)} type="button">취소</button>
              <button
                className={styles.addQuestionSubmitBtn}
                onClick={addQuestionMode === 'ai' ? handleGenerateAdditionalQuestions : handleAddManualQuestion}
                disabled={loadingAddQuestions}
                type="button"
              >
                {loadingAddQuestions ? '생성 중...' : '질문 추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.contentWrapper}>
        {/* Question nav sidebar */}
        <aside className={styles.sidebar}>
          <p className={styles.sidebarTitle}>질문 목록</p>
          <div className={styles.questionList}>
            {questions.map((q, i) => {
              const isActive = q.id === activeQuestionId;
              const hasAnswer = (q.userAnswer || '').trim().length > 0;
              const cat = categoryLabel(q.category);
              const score = (q.feedback as AnswerFeedback | undefined)?.overall_score;

              return (
                <div 
                  key={q.id} 
                  className={`${styles.qItem} ${isActive ? styles.qItemActive : ''}`}
                  onClick={() => handleSelectQuestion(q.id)}
                >
                  <button
                    className={styles.qDeleteBtn}
                    onClick={(event) => requestDeleteQuestion(q, i, event)}
                    type="button"
                    aria-label={`${i + 1}번 질문 삭제`}
                  >
                    ×
                  </button>
                  <div className={styles.qItemHeader}>
                    <div className={`${styles.qNum} ${hasAnswer ? styles.qNumDone : isActive ? styles.qNumActive : styles.qNumPending}`}>
                      {hasAnswer ? "✓" : i + 1}
                    </div>
                    <span className={`${styles.qType} ${cat.style}`}>{cat.label}</span>
                    {score !== undefined && <span className={styles.qScore}>{score}점</span>}
                  </div>
                  <div className={`${styles.qText} ${isActive ? styles.qTextActive : styles.qTextInactive}`}>
                    {q.question}
                  </div>
                </div>
              );
            })}
            <button className={styles.addQuestionButton} onClick={openAddQuestionModal} type="button">
              <span className={styles.addQuestionButtonIcon}>+</span>
              질문 추가
            </button>
          </div>
        </aside>

        {/* Main area */}
        {activeQuestion && (
          <div className={styles.mainArea}>
            {/* Question card */}
            <div className={`${styles.card} ${styles.qCard}`}>
              <div className={styles.qCardHeader}>
                <div className={styles.qCardTypeInfo}>
                  <span className={`${styles.qCardTypeBadge} ${categoryLabel(activeQuestion.category).style}`}>
                    {categoryLabel(activeQuestion.category).label} 질문
                  </span>
                  <span className={styles.qCardNum}>Q{activeQuestionIndex + 1}</span>
                </div>
                {activeQuestion.axis_name && (
                  <div className={styles.qCardAxis}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    {activeQuestion.axis_name}
                  </div>
                )}
              </div>
              <h2 className={styles.qCardQuestion}>
                {activeQuestion.question}
              </h2>
              {(activeQuestion.tips || activeAxis) && (
                <div className={styles.questionGuide}>
                  <button className={styles.guideToggleBtn} onClick={() => setShowQuestionGuide(v => !v)}>
                    <span>평가기준과 면접관 포인트</span>
                    <span>{showQuestionGuide ? '접기 ▲' : '보기 ▼'}</span>
                  </button>
                  {showQuestionGuide && (
                    <div className={styles.guideContent}>
                      <div className={styles.guideBlock}>
                        {activeAxis && (
                          <>
                            <div className={styles.guideLabel}>
                              <span>이 질문의 평가 기준 :</span>
                              <span className={styles.axisNameBox}>{activeAxis.name}</span>
                            </div>
                            {activeAxis.description && (
                              <p className={styles.guideText}>{activeAxis.description}</p>
                            )}
                          </>
                        )}
                        {activeQuestion.tips && (
                          <>
                            <div className={styles.guideLabel}>면접관 포인트</div>
                            <p className={styles.guideText}>{activeQuestion.tips}</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Answer area */}
            <div className={styles.card}>
              <div className={styles.answerHeader}>
                <h3 className={styles.answerTitle}>내 답변</h3>
                <div className={styles.starGuide}>
                  <span className={styles.starGuideText}>STAR 가이드</span>
                  <div className={styles.starBlocks}>
                    {["S", "T", "A", "R"].map((s) => {
                      const text = activeQuestion.userAnswer || '';
                      let isActive = false;
                      if (s === "S" && text.includes('[상황]')) isActive = true;
                      if (s === "T" && text.includes('[과제]')) isActive = true;
                      if (s === "A" && text.includes('[행동]')) isActive = true;
                      if (s === "R" && text.includes('[결과]')) isActive = true;
                      
                      return (
                        <span key={s} className={`${styles.starBlock} ${isActive ? styles.starBlockActive : styles.starBlockInactive}`}>{s}</span>
                      );
                    })}
                  </div>
                </div>
              </div>
              <textarea 
                className={styles.textarea}
                rows={8}
                value={activeQuestion.userAnswer || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="STAR 기법을 활용하여 답변을 작성해보세요.&#10;&#10;[상황] 어떤 상황이었나요?&#10;[과제] 어떤 문제를 해결해야 했나요?&#10;[행동] 구체적으로 어떻게 행동했나요?&#10;[결과] 어떤 결과를 얻었나요?"
              ></textarea>
              <div className={styles.answerFooter}>
                <div className={styles.charCount}>{(activeQuestion.userAnswer || '').length} / 400자 권장</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className={styles.feedbackBtn}
                    onClick={handleFeedback}
                    disabled={!(activeQuestion.userAnswer || '').trim() || loadingFeedback[activeQuestion.id]}
                  >
                    {loadingFeedback[activeQuestion.id] ? (
                      <><span className={styles.spin} style={{ marginRight: '8px' }}></span> 분석 중...</>
                    ) : '저장 및 피드백 받기'}
                  </button>
                </div>
              </div>
            </div>

            {/* Previous answer feedback */}
            {activeQuestion.feedback && (
              <div className={styles.card}>
                <div className={styles.fbHeader}>
                  <h3 className={styles.fbTitle}>답변 피드백 분석 결과</h3>
                  <div className={styles.fbScore}>{(activeQuestion.feedback as AnswerFeedback).overall_score}점</div>
                </div>
                
                <ul className={styles.feedbackList}>
                  {((activeQuestion.feedback as AnswerFeedback).strengths || []).map((s, i) => (
                    <li key={`s-${i}`}>
                      <span className={styles.goodTag}>[강점]</span> {s}
                    </li>
                  ))}
                  {((activeQuestion.feedback as AnswerFeedback).improvement) && (
                    <li>
                      <span className={styles.improveTag}>[보완점]</span> {(activeQuestion.feedback as AnswerFeedback).improvement}
                    </li>
                  )}
                  {((activeQuestion.feedback as AnswerFeedback).risk_points || []).map((rp, i) => (
                    <li key={`rp-${i}`}>
                      <span className={styles.riskTag}>[리스크]</span> {rp.issue} — {rp.reason}
                    </li>
                  ))}
                </ul>
                
                {((activeQuestion.feedback as AnswerFeedback).follow_up_hint) && (
                  <div className={styles.riskAlert} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'transparent', marginBottom: 0 }}>
                    <span className={styles.riskIcon} style={{ color: '#60a5fa' }}>💬</span>
                    <p className={styles.riskText} style={{ color: '#60a5fa' }}>
                      <strong>예상 꼬리질문 힌트:</strong> {(activeQuestion.feedback as AnswerFeedback).follow_up_hint}
                    </p>
                    <button
                      className={styles.followUpHintBtn}
                      onClick={handleFollowUp}
                      disabled={!(activeQuestion.userAnswer || '').trim() || loadingFollowUp[activeQuestion.id]}
                    >
                      {loadingFollowUp[activeQuestion.id]
                        ? '생성 중...'
                        : '꼬리질문 받기'}
                    </button>
                  </div>
                )}
                {!((activeQuestion.feedback as AnswerFeedback).follow_up_hint) && (
                  <div className={styles.feedbackActionRow}>
                    <button
                      className={styles.followUpHintBtn}
                      onClick={handleFollowUp}
                      disabled={!(activeQuestion.userAnswer || '').trim() || loadingFollowUp[activeQuestion.id]}
                    >
                      {loadingFollowUp[activeQuestion.id]
                        ? '생성 중...'
                        : '꼬리질문 받기'}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Follow-up questions */}
            {activeQuestion.followUps && (activeQuestion.followUps as FollowUpQuestion[]).length > 0 && (
              <div className={styles.followUpSection}>
                <div className={styles.followUpHeader}>
                  <h3 className={styles.followUpTitle}>예상 꼬리질문</h3>
                  <button
                    className={styles.followUpMoreBtn}
                    onClick={handleFollowUp}
                    disabled={!(activeQuestion.userAnswer || '').trim() || loadingFollowUp[activeQuestion.id]}
                  >
                    {loadingFollowUp[activeQuestion.id] ? '생성 중...' : '다른 꼬리질문 받기'}
                  </button>
                </div>
                {(activeQuestion.followUps as FollowUpQuestion[]).map((fu, idx) => (
                  <div key={idx} className={styles.followUpItem}>
                    <div className={styles.followUpItemHeader}>
                      <div className={styles.followUpQ}>Q. {fu.question}</div>
                      <button
                        className={styles.followUpDeleteBtn}
                        onClick={() => handleDeleteFollowUp(activeQuestionIndex, idx)}
                        aria-label="꼬리질문 삭제"
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                    <div className={styles.followUpIntent}>확인 포인트: {fu.intent}</div>
                    
                    <div className={styles.fuAnswerArea}>
                      <textarea
                        className={styles.fuTextarea}
                        placeholder="꼬리질문에 대한 답변을 입력해보세요."
                        value={fu.userAnswer || ''}
                        onChange={(e) => handleFollowUpAnswerChange(activeQuestion.id, idx, e.target.value)}
                      />
                      <div className={styles.fuAction}>
                        <button 
                          className={styles.secondaryBtn} 
                          disabled={!(fu.userAnswer || '').trim() || fu.isLoading}
                          onClick={() => handleFollowUpFeedback(activeQuestion.id, idx)}
                        >
                          {fu.isLoading ? '분석 중...' : '피드백 받기'}
                        </button>
                      </div>
                    </div>
                    
                    {fu.feedback && (
                      <div className={styles.fuFeedback}>
                        <strong>피드백:</strong> {fu.feedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
