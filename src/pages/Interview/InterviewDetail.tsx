import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { interviewService } from '../../services/interviewService';
import type { AvailablePosition, EvaluationAxis, InterviewQuestion, AnswerFeedback, FollowUpQuestion } from '../../types';
import styles from './InterviewDetail.module.css';
import { ROUTES } from '../../constants';

export default function InterviewDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const state = location.state as {
    position: AvailablePosition;
    axesUsed: EvaluationAxis[];
    questions: InterviewQuestion[];
    featureWeights: Record<string, number>;
    isNew: boolean;
    sessionId?: string;
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
  
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [showAxes, setShowAxes] = useState(false);

  if (!state) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-h)' }}>잘못된 접근입니다.</h2>
        <button className={styles.primaryBtn} onClick={() => navigate(ROUTES.INTERVIEW)}>홈으로 돌아가기</button>
      </div>
    );
  }

  const { position, featureWeights, axesUsed } = state;

  const activeQuestionIndex = questions.findIndex(q => q.id === activeQuestionId);
  const activeQuestion = questions[activeQuestionIndex];

  const handleAnswerChange = (text: string) => {
    setQuestions(prev => prev.map(q => q.id === activeQuestionId ? { ...q, userAnswer: text } : q));
  };

  const handleFeedback = async () => {
    if (!activeQuestion || !activeQuestion.userAnswer?.trim()) return;
    setLoadingFeedback(prev => ({ ...prev, [activeQuestion.id]: true }));
    try {
      const fb = await interviewService.getFeedback(
        position.company, position.job_role,
        activeQuestion.question, activeQuestion.userAnswer, featureWeights
      );
      setQuestions(prev => prev.map(item => item.id === activeQuestion.id ? { ...item, feedback: fb } : item));
    } catch {
      alert('피드백 요청에 실패했습니다.');
    } finally {
      setLoadingFeedback(prev => ({ ...prev, [activeQuestion.id]: false }));
    }
  };

  const handleFollowUp = async () => {
    if (!activeQuestion || !activeQuestion.userAnswer?.trim()) return;
    setLoadingFollowUp(prev => ({ ...prev, [activeQuestion.id]: true }));
    try {
      const res = await interviewService.getFollowUp(
        position.company, position.job_role,
        activeQuestion.question, activeQuestion.userAnswer
      );
      setQuestions(prev => prev.map(item =>
        item.id === activeQuestion.id ? { ...item, followUps: res.follow_up_questions } : item
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

  const handleSave = async () => {
    try {
      const res = await interviewService.saveSession(position.company, position.job_role, questions, state.sessionId, axesUsed);
      setSaveSuccess(res.message);
      alert('저장되었습니다! 면접 목록으로 이동합니다.');
      navigate(ROUTES.INTERVIEW);
    } catch {
      alert('저장에 실패했습니다.');
    }
  };

  const categoryLabel = (c: string) => {
    if (c === 'behavioral') return { label: '인성/경험', style: styles.typeCompany };
    if (c === 'technical') return { label: '직무/기술', style: styles.typeJob };
    if (c === 'resume') return { label: '자소서', style: styles.typeResume };
    return { label: '기본', style: styles.typeDefault };
  };

  const answeredCount = questions.filter(q => (q.userAnswer || '').trim().length > 0).length;

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
          <button className={styles.primaryBtn} onClick={handleSave}>전체 저장하기</button>
        </div>
      </div>

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
                  onClick={() => setActiveQuestionId(q.id)}
                >
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
          </div>
        </aside>

        {/* Main area */}
        {activeQuestion && (
          <div className={styles.mainArea}>
            {/* Question card */}
            <div className={`${styles.card} ${styles.qCard}`}>
              <div className={styles.qCardHeader}>
                <div className={styles.qCardTypeInfo}>
                  <span className={styles.qCardTypeBadge}>{categoryLabel(activeQuestion.category).label} 질문</span>
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
              {activeQuestion.tips && (
                <div className={styles.qCardTip}>
                  <span>💡 면접관 포인트:</span> {activeQuestion.tips}
                </div>
              )}
              
              {/* Axes Toggle Viewer */}
              {axesUsed && axesUsed.length > 0 && (
                <div className={styles.axesSection}>
                  <div className={styles.axesTitle}>
                    핵심 평가축
                    <button className={styles.axesRevealBtn} onClick={() => setShowAxes(v => !v)}>
                      {showAxes ? '평가축 숨기기 ▲' : '평가축 보기 ▼'}
                    </button>
                  </div>
                  <div className={showAxes ? styles.axesRevealed : styles.axesBlurred}>
                    <div className={styles.axesGrid}>
                      {axesUsed.map((ax, idx) => (
                        <div key={idx} className={styles.axesCard}>
                          <div className={styles.axesCardName}>{ax.name}</div>
                          <div className={styles.axesCardDesc}>{ax.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
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
                    className={styles.secondaryBtn}
                    onClick={handleFollowUp}
                    disabled={!(activeQuestion.userAnswer || '').trim() || loadingFollowUp[activeQuestion.id]}
                  >
                    {loadingFollowUp[activeQuestion.id] ? '생성 중...' : '⚡ 꼬리질문 예측'}
                  </button>
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
                
                <div className={styles.fbGrid}>
                  <div className={styles.fbGridItem}>
                    <div className={styles.fbGridLabel}>강점</div>
                    <ul className={styles.listContainer}>
                      {((activeQuestion.feedback as AnswerFeedback).strengths || []).map((s, i) => (
                        <li key={`s-${i}`}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className={styles.fbGridItem}>
                    <div className={styles.fbGridLabel}>보완점 (개선 및 감점 리스크)</div>
                    <ul className={styles.listContainer}>
                      {((activeQuestion.feedback as AnswerFeedback).improvement) && (
                        <li>{(activeQuestion.feedback as AnswerFeedback).improvement}</li>
                      )}
                      {((activeQuestion.feedback as AnswerFeedback).risk_points || []).map((rp, i) => (
                        <li key={`rp-${i}`}>
                           <span style={{color: '#fb923c'}}>[리스크]</span> {rp.issue} — {rp.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {((activeQuestion.feedback as AnswerFeedback).follow_up_hint) && (
                  <div className={styles.riskAlert} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'transparent', marginBottom: 0 }}>
                    <span className={styles.riskIcon} style={{ color: '#60a5fa' }}>💬</span>
                    <p className={styles.riskText} style={{ color: '#60a5fa' }}>
                      <strong>예상 꼬리질문 힌트:</strong> {(activeQuestion.feedback as AnswerFeedback).follow_up_hint}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Follow-up questions */}
            {activeQuestion.followUps && (activeQuestion.followUps as FollowUpQuestion[]).length > 0 && (
              <div className={styles.followUpSection}>
                <h3 className={styles.followUpTitle}>⚡ 예상 압박 꼬리질문</h3>
                {(activeQuestion.followUps as FollowUpQuestion[]).map((fu, idx) => (
                  <div key={idx} className={styles.followUpItem}>
                    <div className={styles.followUpQ}>Q. {fu.question}</div>
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
