import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewService } from '../../services/interviewService';
import type { AvailablePosition, InterviewAnalysisSource, InterviewResumeSource, InterviewSession } from '../../types';
import styles from './InterviewHome.module.css';

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
        sessionId: session.id
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
            {sessions.map((item) => (
              <div key={item.id} className={styles.sessionItem}>
                <div className={styles.sessionTop}>
                  <div className={styles.sessionCompanyInfo}>
                    <div className={styles.companyLogo}>
                      {item.company[0]}
                    </div>
                    <div>
                      <div className={styles.sessionTitle}>{item.company} · {item.job_role}</div>
                      <div className={styles.sessionMeta}>
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
