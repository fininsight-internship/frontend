import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewService } from '../../services/interviewService';
import type { AvailablePosition, InterviewSession } from '../../types';
import styles from './InterviewPage.module.css';

export default function InterviewPage() {
  const navigate = useNavigate();
  const [positions, setPositions] = useState<AvailablePosition[]>([]);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [selectedPosId, setSelectedPosId] = useState<string>('');
  const [interviewType, setInterviewType] = useState<string>('전체');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [posData, sessData] = await Promise.all([
          interviewService.getPositions(),
          interviewService.getSessions()
        ]);
        setPositions(posData);
        setSessions(sessData);
        if (posData.length > 0) {
          setSelectedPosId(posData[0].id);
        }
      } catch (err) {
        console.error('Failed to load data', err);
      }
    }
    loadData();
  }, []);

  const handleStartInterview = async (axisType: "static" | "dynamic") => {
    const pos = positions.find(p => p.id === selectedPosId);
    if (!pos) return;
    
    setLoading(true);
    try {
      // Generate questions
      const qRes = await interviewService.getQuestions(
        pos.company, 
        pos.job_role,
        interviewType,
        axisType
      );
      
      const questionsWithAnswer = qRes.questions.map(q => ({ ...q, userAnswer: '' }));
      
      // Navigate to detail page with generated data
      navigate(`/interview/new`, {
        state: {
          position: pos,
          axesUsed: qRes.axes_used, // pass the axes used
          questions: questionsWithAnswer,
          featureWeights: qRes.feature_weights,
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
    // For simplicity, reconstruct state from saved session
    const pos = positions.find(p => p.company === session.company && p.job_role === session.job_role);
    if (!pos) return;
    
    navigate(`/interview/${session.id}`, {
      state: {
        position: pos,
        axesUsed: session.axes_used || [],
        questions: session.answers,
        featureWeights: {},
        isNew: false,
        sessionId: session.id
      }
    });
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

        {/* Start new */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>맞춤형 면접 질문 생성하기</h2>
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label>기업/직무 선택</label>
              <select 
                className={styles.select}
                value={selectedPosId}
                onChange={(e) => setSelectedPosId(e.target.value)}
              >
                {positions.map(p => (
                  <option key={p.id} value={p.id}>{p.company} - {p.job_role}</option>
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
                <option value="전체">전체 (혼합)</option>
                <option value="인성">인성 면접 (경험/상황 위주)</option>
                <option value="실무">실무 면접 (기술/직무 지식 위주)</option>
              </select>
            </div>
            
            <div className={styles.inputGroup} style={{ alignSelf: 'flex-end' }}>
              <button 
                className={styles.submitButton}
                onClick={() => handleStartInterview("static")}
                disabled={loading || positions.length === 0}
                style={{ backgroundColor: 'var(--border)', color: 'var(--text-h)' }}
              >
                {loading ? '생성 중...' : '기존 평가축으로 생성'}
              </button>
            </div>

            <div className={styles.inputGroup} style={{ alignSelf: 'flex-end' }}>
              <button 
                className={styles.submitButton}
                onClick={() => handleStartInterview("dynamic")}
                disabled={loading || positions.length === 0}
              >
                {loading ? (
                  <><span className={styles.spin} style={{ marginRight: '8px' }}></span> 생성 중...</>
                ) : (
    <>
      AI 동적 평가축으로
      <br />
      생성 ✨
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
            <p style={{ color: 'var(--text)' }}>저장된 면접 세션이 없습니다.</p>
          </div>
        ) : (
          <div className={styles.sessionList}>
            {sessions.map((item, i) => (
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
