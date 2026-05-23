import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { interviewService } from '../../services/interviewService';
import type { AvailablePosition, InterviewAnalysisSource, InterviewResumeSource, InterviewSession, OverallInterviewReport } from '../../types';
import styles from './InterviewHome.module.css';

const getFeedbackLogs = (question: InterviewSession['answers'][number]) => (
  question.feedbackLogs?.length
    ? question.feedbackLogs
    : ((question.feedback as NonNullable<typeof question.feedback> & { feedback_logs?: typeof question.feedbackLogs })?.feedback_logs || [])
);

export default function InterviewHome() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<InterviewAnalysisSource[]>([]);
  const [resumes, setResumes] = useState<InterviewResumeSource[]>([]);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>('');
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [interviewType, setInterviewType] = useState<string>('인성');
  const [loading, setLoading] = useState(false);
  const [sessionPendingDelete, setSessionPendingDelete] = useState<InterviewSession | null>(null);
  const [reportSession, setReportSession] = useState<InterviewSession | null>(null);
  const [loadingReportSessionId, setLoadingReportSessionId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [sourceData, sessData] = await Promise.all([
          interviewService.getSources(),
          interviewService.getSessions()
        ]);
        setAnalyses(sourceData.analyses);
        setResumes(sourceData.resumes);
        setSessions(sessData);
      } catch (err) {
        console.error('Failed to load data', err);
      }
    }
    loadData();
  }, []);

  const handleStartInterview = async (axisType: "static" | "dynamic") => {
    const selectedAnalysis = analyses.find(item => String(item.id) === selectedAnalysisId);
    const selectedResume = resumes.find(item => String(item.id) === selectedResumeId);
    if (!selectedAnalysis) {
      alert('JD/기업분석을 선택해주세요. 자소서는 선택하지 않아도 됩니다.');
      return;
    }

    const company = selectedAnalysis.company_name;
    const jobRole = selectedAnalysis.job_role;
    const position: AvailablePosition = {
      id: `analysis-${selectedAnalysis.id}`,
      company,
      job_role: jobRole,
      description: 'DB에 저장된 JD/기업분석 기반 면접',
      required_skills: [],
      company_culture: '',
      doc_ids: [
        `analysis-${selectedAnalysis.id}`,
        ...(selectedResume ? [`resume-${selectedResume.id}`] : []),
      ],
    };

    const analysisId = selectedAnalysis.id;
    const resumeId = selectedResume ? selectedResume.id : undefined;
    
    setLoading(true);
    try {
      // Generate questions
      const qRes = await interviewService.getQuestions(
        company, 
        jobRole,
        interviewType,
        axisType,
        analysisId,
        resumeId
      );
      
      const questionsWithAnswer = qRes.questions.map(q => ({ ...q, userAnswer: '' }));
      
      // Navigate to detail page with generated data
      navigate(`/interview/new`, {
        state: {
          position,
          axesUsed: qRes.axes_used, // pass the axes used
          questions: questionsWithAnswer,
          featureWeights: qRes.feature_weights,
          analysisId,
          resumeId,
          interviewType,
          axisType,
          isNew: true
        }
      });
    } catch (err) {
      alert('면접 질문 생성에 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSession = (session: InterviewSession) => {
    const position: AvailablePosition = {
      id: session.id,
      company: session.company,
      job_role: session.job_role,
      description: '저장된 면접 세션',
      required_skills: [],
      company_culture: '',
      doc_ids: [],
    };
    
    navigate(`/interview/${session.id}`, {
      state: {
        position,
        axesUsed: session.axes_used || [],
        questions: session.answers,
        featureWeights: {},
        interviewType: session.interview_type || '전체',
        axisType: session.axis_type || 'dynamic',
        isNew: false,
        sessionId: session.id,
        overallReport: session.overall_report || session.stats?.overall_report
      }
    });
  };

  const handleDeleteSession = async () => {
    if (!sessionPendingDelete) return;
    const sessionId = sessionPendingDelete.id;
    try {
      await interviewService.deleteSession(sessionId);
      setSessions(prev => prev.filter(item => item.id !== sessionId));
      setSessionPendingDelete(null);
    } catch (err) {
      alert('면접 세션 삭제에 실패했습니다.');
      console.error(err);
    }
  };

  const getSessionInterviewType = (session: InterviewSession) => {
    if (session.interview_type === '인성' || session.interview_type === '실무') return session.interview_type;

    const behavioralCategories = ['behavioral', 'situational', 'values', 'growth', 'communication'];
    const practicalCategories = ['technical', 'problem_solving', 'project', 'design', 'impact'];
    const behavioralCount = session.answers.filter(q => behavioralCategories.includes(q.category)).length;
    const practicalCount = session.answers.filter(q => practicalCategories.includes(q.category)).length;

    if (practicalCount > behavioralCount) return '실무';
    if (behavioralCount > practicalCount) return '인성';
    return '혼합';
  };

  const getSessionReport = (session: InterviewSession | null): OverallInterviewReport | undefined => (
    session?.overall_report || session?.stats?.overall_report
  );

  const handleUpdateSessionReport = async (session: InterviewSession) => {
    setLoadingReportSessionId(session.id);
    try {
      const report = await interviewService.getOverallReport(
        session.company,
        session.job_role,
        getSessionInterviewType(session),
        session.answers,
        session.axes_used || []
      );
      const updatedReport = { ...report, is_outdated: false };
      await interviewService.saveSession(
        session.company,
        session.job_role,
        session.answers,
        session.id,
        session.axes_used || [],
        session.interview_type || getSessionInterviewType(session),
        session.axis_type || 'dynamic',
        updatedReport
      );
      setSessions(prev => prev.map(item => (
        item.id === session.id
          ? {
              ...item,
              overall_report: updatedReport,
              stats: item.stats ? { ...item.stats, overall_report: updatedReport } : item.stats,
            }
          : item
      )));
      setReportSession(prev => prev && prev.id === session.id
        ? {
            ...prev,
            overall_report: updatedReport,
            stats: prev.stats ? { ...prev.stats, overall_report: updatedReport } : prev.stats,
          }
        : prev
      );
    } catch (err) {
      alert('종합 리포트 업데이트에 실패했습니다.');
      console.error(err);
    } finally {
      setLoadingReportSessionId(null);
    }
  };

  const activeReport = getSessionReport(reportSession);
  const dimensionChartData = activeReport
    ? Object.entries(activeReport.dimension_scores || {}).map(([name, score]) => ({ name, score }))
    : [];
  const questionScoreData = activeReport?.question_reviews?.map((item, idx) => ({
    name: `Q${idx + 1}`,
    score: item.score ?? 0,
  })) || [];
  const reportAnswers = reportSession?.answers || [];
  const feedbackMaxRound = Math.max(0, ...reportAnswers.map(question => getFeedbackLogs(question).length));
  const averageFeedbackTrendData = Array.from({ length: feedbackMaxRound }, (_, roundIdx) => {
    const scores = reportAnswers
      .map(question => getFeedbackLogs(question)[roundIdx]?.score)
      .filter((score): score is number => typeof score === 'number');
    return {
      name: `${roundIdx + 1}회`,
      average: scores.length ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)) : undefined,
    };
  });
  const answerFeedbackLineKeys = reportAnswers
    .map((question, idx) => ({ key: `Q${idx + 1}`, hasLogs: Boolean(getFeedbackLogs(question).length) }))
    .filter(item => item.hasLogs)
    .map(item => item.key);
  const answerFeedbackTrendData = Array.from({ length: feedbackMaxRound }, (_, roundIdx) => {
    const row: Record<string, string | number | undefined> = { name: `${roundIdx + 1}회` };
    reportAnswers.forEach((question, idx) => {
      row[`Q${idx + 1}`] = getFeedbackLogs(question)[roundIdx]?.score;
    });
    return row;
  });
  const answerLineColors = ['#2563eb', '#14b8a6', '#f97316', '#8b5cf6', '#ef4444', '#0ea5e9', '#84cc16', '#f59e0b'];

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>면접 준비</h1>
            <p className={styles.subtitle}>JD·자소서 기반 예상 질문으로 면접을 준비하세요</p>
          </div>
        </div>

        {sessionPendingDelete && (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="delete-session-modal-title">
            <div className={styles.deleteModalPanel}>
              <div className={styles.deleteModalHeader}>
                <h2 id="delete-session-modal-title" className={styles.deleteModalTitle}>면접 이력을 삭제할까요?</h2>
                <button className={styles.modalCloseBtn} onClick={() => setSessionPendingDelete(null)} aria-label="삭제 확인 닫기">×</button>
              </div>
              <div className={styles.deleteModalBody}>
                <p className={styles.deleteModalText}>
                  이 면접의 질문, 답변, 피드백, 꼬리질문 기록이 모두 삭제됩니다.
                </p>
              </div>
              <div className={styles.deleteModalFooter}>
                <button className={styles.cancelBtn} onClick={() => setSessionPendingDelete(null)} type="button">취소</button>
                <button className={styles.deleteConfirmBtn} onClick={handleDeleteSession} type="button">삭제</button>
              </div>
            </div>
          </div>
        )}

        {reportSession && activeReport && (
          <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="history-report-modal-title">
            <div className={styles.reportModalPanel}>
              <div className={styles.deleteModalHeader}>
                <div>
                  <h2 id="history-report-modal-title" className={styles.deleteModalTitle}>전체 면접 평가 리포트</h2>
                  <p className={styles.reportSubtitle}>{reportSession.company} · {reportSession.job_role}</p>
                </div>
                <button className={styles.modalCloseBtn} onClick={() => setReportSession(null)} aria-label="리포트 닫기">×</button>
              </div>
              <div className={styles.reportBody}>
                {activeReport.is_outdated && (
                  <div className={styles.reportStaleNotice}>
                    <div>
                      <strong>이 리포트는 최신 저장 내용이 반영되지 않았습니다.</strong>
                      <p>이전 답변과 피드백 기준의 리포트입니다. 최신 저장 내용 기준으로 다시 업데이트할 수 있습니다.</p>
                    </div>
                    <button
                      className={styles.submitButton}
                      onClick={() => handleUpdateSessionReport(reportSession)}
                      disabled={loadingReportSessionId === reportSession.id}
                      type="button"
                    >
                      {loadingReportSessionId === reportSession.id ? '업데이트 중...' : '리포트 업데이트'}
                    </button>
                  </div>
                )}

                <section className={styles.reportHero}>
                  <div className={styles.reportScoreBox}>
                    <div className={styles.reportScore}>{activeReport.overall_score}</div>
                    <div className={styles.reportScoreLabel}>{activeReport.readiness_label}</div>
                  </div>
                  <div className={styles.reportSummary}>
                    <div className={styles.reportSectionLabel}>면접관 한줄평</div>
                    <p>{activeReport.interviewer_one_liner}</p>
                    <div className={styles.reportSectionLabel}>코치 총평</div>
                    <p>{activeReport.coach_summary}</p>
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
                    {(activeReport.strengths || []).map((item, idx) => (
                      <div className={styles.reportListItem} key={`strength-${idx}`}>
                        <strong>{item.title}</strong>
                        <p>{item.evidence}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h3>감점 리스크 TOP 3</h3>
                    {(activeReport.risks || []).map((item, idx) => (
                      <div className={styles.reportListItem} key={`risk-${idx}`}>
                        <strong>{item.title}</strong>
                        <p>{item.reason}</p>
                        <span>{item.fix}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {activeReport.answer_growth && (
                  <section className={styles.reportSection}>
                    <h3>답변 향상 추이</h3>
                    <div className={styles.reportGrowthBox}>
                      <p>{activeReport.answer_growth.summary}</p>
                      <span>{activeReport.answer_growth.score_trend}</span>
                    </div>
                    <div className={styles.reportColumns}>
                      <div>
                        <h3>좋아지고 있는 부분</h3>
                        {(activeReport.answer_growth.improved_points || []).map((item, idx) => (
                          <div className={styles.reportListItem} key={`growth-good-${idx}`}>
                            <p>{item}</p>
                          </div>
                        ))}
                      </div>
                      <div>
                        <h3>아직 남은 보완점</h3>
                        {(activeReport.answer_growth.remaining_gaps || []).map((item, idx) => (
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
                  {(activeReport.next_actions || []).map((item, idx) => (
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
                  {(activeReport.question_reviews || []).map((item, idx) => (
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
            </div>
          </div>
        )}

        {/* Start new */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>맞춤형 면접 질문 생성하기</h2>
          <p className={styles.cardHint}>JD/기업분석은 필수입니다. 평가축은 이 데이터로만 만들고, 자소서는 선택 시 질문 내용에 함께 반영합니다.</p>
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label>JD/기업분석 선택</label>
              <select 
                className={styles.select}
                value={selectedAnalysisId}
                onChange={(e) => setSelectedAnalysisId(e.target.value)}
              >
                <option value="">선택 안 함</option>
                {analyses.map(item => (
                  <option key={item.id} value={item.id}>{item.company_name} - {item.job_role}</option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>자소서 선택</label>
              <select 
                className={styles.select}
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
              >
                <option value="">선택 안 함</option>
                {resumes.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.company_name && item.job_role ? `${item.company_name} - ${item.job_role}` : item.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.inputGroup}>
              <label>면접 유형</label>
              <select 
                className={styles.select}
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
              >
                <option value="인성">인성 면접 (경험/상황 위주)</option>
                <option value="실무">실무 면접 (기술/직무 지식 위주)</option>
              </select>
            </div>

            <div className={styles.inputGroup} style={{ alignSelf: 'flex-end' }}>
              <button 
                className={styles.submitButton}
                onClick={() => handleStartInterview("dynamic")}
                disabled={loading || !selectedAnalysisId}
              >
                {loading ? (
                  <><span className={styles.spin} style={{ marginRight: '8px' }}></span> 생성 중...</>
                ) : (
    <>
      평가기준 추출 및 질문 생성 ✨
    </>
  )}
              </button>
            </div>
          </div>
        </div>

        {/* Interview sessions */}
        <span className={styles.sectionTitle}>면접 준비 이력</span>
        
        {sessions.length === 0 ? (
          <div className={styles.card} style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>저장된 면접 세션이 없습니다.</p>
          </div>
        ) : (
          <div className={styles.sessionList}>
            {sessions.map((item) => {
              const sessionInterviewType = getSessionInterviewType(item);
              const sessionReport = getSessionReport(item);
              const sessionTypeStyle = sessionInterviewType === '실무'
                ? styles.sessionTypePractical
                : sessionInterviewType === '인성'
                  ? styles.sessionTypeBehavioral
                  : styles.sessionTypeMixed;

              return (
                <div key={item.id} className={styles.sessionItem}>
                  <div className={styles.sessionTop}>
                    <div className={styles.sessionCompanyInfo}>
                      <div className={styles.companyLogo}>
                        {item.company[0]}
                      </div>
                      <div>
                        <div className={styles.sessionTitle}>{item.company} · {item.job_role}</div>
                        <div className={styles.sessionMeta}>
                          <span className={`${styles.sessionType} ${sessionTypeStyle}`}>
                            {sessionInterviewType} 면접
                          </span>
                          <span className={styles.sessionDate}>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.sessionStats}>
                      {item.stats && (
                        <>
                          <div className={styles.statCol}>
                            <div className={styles.statLabel}>답변 완료</div>
                            <div className={styles.statValue}>{item.stats.answered_questions}/{item.stats.total_questions}</div>
                          </div>
                          {item.stats.score !== null && (
                            <div className={styles.statCol}>
                              <div className={styles.statLabel}>종합 점수</div>
                              <div className={`${styles.statValueScore} ${item.stats.score >= 85 ? styles.statScoreGood : styles.statScoreNormal}`}>
                                {Math.round(item.stats.score)}점
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      <button className={styles.actionButton} onClick={() => handleResumeSession(item)}>
                        {item.stats?.answered_questions === item.stats?.total_questions ? "결과 보기" : "이어 준비"}
                      </button>
                      {sessionReport && (
                        <button className={styles.reportButton} onClick={() => setReportSession(item)} type="button">
                          {sessionReport.is_outdated ? '리포트 보기 · 업데이트 필요' : '리포트 보기'}
                        </button>
                      )}
                      <button className={styles.deleteSessionButton} onClick={() => setSessionPendingDelete(item)} type="button" aria-label="면접 이력 삭제">
                        삭제
                      </button>
                    </div>
                  </div>
                
                  {item.stats && (
                    <div className={styles.progressBarContainer}>
                      <div className={styles.progressBarBg}>
                        <div 
                          className={styles.progressBarFill} 
                          style={{ width: `${(item.stats.answered_questions / item.stats.total_questions) * 100}%` }}
                        ></div>
                      </div>
                      <span className={styles.progressText}>{Math.round((item.stats.answered_questions / item.stats.total_questions) * 100)}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
