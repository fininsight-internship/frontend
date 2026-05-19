import { useState } from 'react';
import { interviewService } from '../../services/interviewService';
import type {
  AvailablePosition,
  EvaluationAxis,
  InterviewQuestion,
  AnswerFeedback,
  FollowUpQuestion,
} from '../../types';
import './Interview.css';

// ─── 단계 정의 ────────────────────────────────────────────
type Step = 'select' | 'axes' | 'questions' | 'done';

export default function InterviewPage() {
  const [step, setStep] = useState<Step>('select');

  // 포지션 선택
  const [positions, setPositions] = useState<AvailablePosition[]>([]);
  const [selectedPos, setSelectedPos] = useState<AvailablePosition | null>(null);
  const [loadingPos, setLoadingPos] = useState(false);

  // 평가축
  const [axes, setAxes] = useState<EvaluationAxis[]>([]);
  const [axesSources, setAxesSources] = useState<{ id: string; label: string }[]>([]);
  const [axesNote, setAxesNote] = useState('');
  const [loadingAxes, setLoadingAxes] = useState(false);

  // 질문
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [featureWeights, setFeatureWeights] = useState<Record<string, number>>({});
  const [loadingQ, setLoadingQ] = useState(false);

  // 피드백/꼬리질문 로딩 상태 (question id별)
  const [loadingFeedback, setLoadingFeedback] = useState<Record<string, boolean>>({});
  const [loadingFollowUp, setLoadingFollowUp] = useState<Record<string, boolean>>({});

  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // ─── 포지션 불러오기 ────────────────────────────────────
  const handleLoadPositions = async () => {
    setLoadingPos(true);
    try {
      const data = await interviewService.getPositions();
      setPositions(data);
      if (data.length > 0) setSelectedPos(data[0]);
    } catch {
      alert('포지션 데이터를 불러오지 못했습니다.');
    } finally {
      setLoadingPos(false);
    }
  };

  // ─── 평가축 추론 ─────────────────────────────────────────
  const handleEvaluateAxes = async () => {
    if (!selectedPos) return;
    setLoadingAxes(true);
    try {
      const res = await interviewService.evaluateAxes(selectedPos.company, selectedPos.job_role);
      setAxes(res.evaluation_axes);
      setAxesSources(res.sources);
      setAxesNote(res.note);
      setStep('axes');
    } catch {
      alert('평가축 분석에 실패했습니다.');
    } finally {
      setLoadingAxes(false);
    }
  };

  // ─── 질문 생성 ───────────────────────────────────────────
  const handleGenerateQuestions = async () => {
    if (!selectedPos) return;
    setLoadingQ(true);
    try {
      const res = await interviewService.getQuestions(selectedPos.company, selectedPos.job_role);
      setQuestions(res.questions.map(q => ({ ...q, userAnswer: '' })));
      setFeatureWeights(res.feature_weights);
      setStep('questions');
    } catch {
      alert('질문 생성에 실패했습니다.');
    } finally {
      setLoadingQ(false);
    }
  };

  // ─── 답변 변경 ───────────────────────────────────────────
  const handleAnswerChange = (id: string, text: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, userAnswer: text } : q));
  };

  // ─── 피드백 요청 ─────────────────────────────────────────
  const handleFeedback = async (q: InterviewQuestion) => {
    if (!q.userAnswer?.trim() || !selectedPos) return;
    setLoadingFeedback(prev => ({ ...prev, [q.id]: true }));
    try {
      const fb = await interviewService.getFeedback(
        selectedPos.company, selectedPos.job_role,
        q.question, q.userAnswer!, featureWeights
      );
      setQuestions(prev => prev.map(item => item.id === q.id ? { ...item, feedback: fb } : item));
    } catch {
      alert('피드백 요청에 실패했습니다.');
    } finally {
      setLoadingFeedback(prev => ({ ...prev, [q.id]: false }));
    }
  };

  // ─── 꼬리질문 요청 ──────────────────────────────────────
  const handleFollowUp = async (q: InterviewQuestion) => {
    if (!q.userAnswer?.trim() || !selectedPos) return;
    setLoadingFollowUp(prev => ({ ...prev, [q.id]: true }));
    try {
      const res = await interviewService.getFollowUp(
        selectedPos.company, selectedPos.job_role,
        q.question, q.userAnswer!
      );
      setQuestions(prev => prev.map(item =>
        item.id === q.id ? { ...item, followUps: res.follow_up_questions } : item
      ));
    } catch {
      alert('꼬리질문 요청에 실패했습니다.');
    } finally {
      setLoadingFollowUp(prev => ({ ...prev, [q.id]: false }));
    }
  };

  // ─── 세션 저장 ───────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedPos) return;
    try {
      const res = await interviewService.saveSession(selectedPos.company, selectedPos.job_role, questions);
      setSaveSuccess(res.message);
      setStep('done');
    } catch {
      alert('저장에 실패했습니다.');
    }
  };

  // ─── 헬퍼 ───────────────────────────────────────────────
  const categoryLabel = (c: string) => {
    if (c === 'behavioral') return { label: '인성/경험', emoji: '🧠', color: '#a78bfa' };
    if (c === 'technical') return { label: '직무/기술', emoji: '💻', color: '#34d399' };
    return { label: '상황대처', emoji: '🤔', color: '#fb923c' };
  };

  const scoreColor = (s: number) => {
    if (s >= 4) return '#34d399';
    if (s >= 3) return '#fbbf24';
    return '#f87171';
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="iv-root">
      {/* ── 헤더 ── */}
      <div className="iv-header">
        <h1 className="iv-title">🎤 AI 모의 면접</h1>
        <p className="iv-subtitle">
          JD · 기업 분석 · 자소서 데이터를 RAG로 연결하여 기업 맞춤 면접을 준비합니다
        </p>
        {/* 진행 스텝 */}
        <div className="iv-steps">
          {(['select', 'axes', 'questions', 'done'] as Step[]).map((s, i) => {
            const labels = ['포지션 선택', '평가축 확인', '질문 & 답변', '완료'];
            const isActive = step === s;
            const isPast = ['select','axes','questions','done'].indexOf(step) > i;
            return (
              <div key={s} className={`iv-step ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}>
                <div className="iv-step-dot">{isPast ? '✓' : i + 1}</div>
                <span className="iv-step-label">{labels[i]}</span>
                {i < 3 && <div className="iv-step-line" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="iv-body">

        {/* ════ STEP 1: 포지션 선택 ════ */}
        {step === 'select' && (
          <div className="iv-card">
            <div className="iv-card-header">
              <h2>📊 지원 기업-직무 선택</h2>
              <p>서비스에서 분석 완료된 기업-직무 데이터를 불러옵니다</p>
            </div>

            {positions.length === 0 ? (
              <div className="iv-empty">
                <div className="iv-empty-icon">🏢</div>
                <p>아직 데이터가 없습니다</p>
                <button
                  className="iv-btn iv-btn-primary"
                  onClick={handleLoadPositions}
                  disabled={loadingPos}
                >
                  {loadingPos ? <><span className="iv-spin" />불러오는 중...</> : '데이터 불러오기'}
                </button>
              </div>
            ) : (
              <div className="iv-positions">
                {positions.map(pos => (
                  <div
                    key={pos.id}
                    className={`iv-position-card ${selectedPos?.id === pos.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPos(pos)}
                  >
                    <div className="iv-position-top">
                      <div>
                        <div className="iv-position-company">{pos.company}</div>
                        <div className="iv-position-role">{pos.job_role}</div>
                      </div>
                      {selectedPos?.id === pos.id && <span className="iv-badge-selected">선택됨</span>}
                    </div>
                    <p className="iv-position-desc">{pos.description}</p>
                    <div className="iv-skills">
                      {pos.required_skills.map(sk => (
                        <span key={sk} className="iv-skill-tag">{sk}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedPos && (
              <div className="iv-actions">
                <button
                  className="iv-btn iv-btn-primary iv-btn-lg"
                  onClick={handleEvaluateAxes}
                  disabled={loadingAxes}
                >
                  {loadingAxes
                    ? <><span className="iv-spin" />평가축 분석 중...</>
                    : '📐 평가축 분석하기 →'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════ STEP 2: 평가축 ════ */}
        {step === 'axes' && (
          <div className="iv-card">
            <div className="iv-card-header">
              <h2>📐 면접 평가축 분석 결과</h2>
              <div className="iv-source-row">
                {axesSources.map(s => (
                  <span key={s.id} className="iv-source-badge">{s.label}</span>
                ))}
              </div>
              <p className="iv-note">⚠️ {axesNote}</p>
            </div>

            <div className="iv-axes-grid">
              {axes.map((ax, i) => (
                <div key={ax.key} className="iv-axis-item">
                  <div className="iv-axis-header">
                    <div className="iv-axis-rank">#{i + 1}</div>
                    <div className="iv-axis-info">
                      <div className="iv-axis-name">{ax.name}</div>
                      <div className="iv-axis-desc">{ax.description}</div>
                    </div>
                    <div className="iv-axis-score" style={{ color: ax.weight >= 0.7 ? '#34d399' : ax.weight >= 0.4 ? '#fbbf24' : '#94a3b8' }}>
                      {Math.round(ax.weight * 100)}%
                    </div>
                  </div>
                  <div className="iv-axis-bar-bg">
                    <div
                      className="iv-axis-bar-fill"
                      style={{
                        width: `${ax.weight * 100}%`,
                        background: ax.weight >= 0.7
                          ? 'linear-gradient(90deg, #10b981, #34d399)'
                          : ax.weight >= 0.4
                          ? 'linear-gradient(90deg, #d97706, #fbbf24)'
                          : 'linear-gradient(90deg, #475569, #64748b)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="iv-actions iv-actions-row">
              <button className="iv-btn iv-btn-ghost" onClick={() => setStep('select')}>← 돌아가기</button>
              <button
                className="iv-btn iv-btn-primary iv-btn-lg"
                onClick={handleGenerateQuestions}
                disabled={loadingQ}
              >
                {loadingQ
                  ? <><span className="iv-spin" />질문 생성 중...</>
                  : '✨ 맞춤 면접 질문 생성하기 →'}
              </button>
            </div>
          </div>
        )}

        {/* ════ STEP 3: 질문 & 답변 ════ */}
        {step === 'questions' && (
          <div>
            <div className="iv-card iv-card-compact">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#f8fafc' }}>{selectedPos?.company}</h2>
                  <p style={{ margin: '0.3rem 0 0', color: '#94a3b8' }}>{selectedPos?.job_role}</p>
                </div>
                <button className="iv-btn iv-btn-ghost" onClick={() => setStep('axes')}>← 평가축 보기</button>
              </div>
            </div>

            <div className="iv-questions-list">
              {questions.map((q, idx) => {
                const cat = categoryLabel(q.category);
                const fb = q.feedback as AnswerFeedback | null | undefined;
                const fus = q.followUps as FollowUpQuestion[] | null | undefined;
                const isLoadingFb = loadingFeedback[q.id];
                const isLoadingFu = loadingFollowUp[q.id];
                const hasAnswer = (q.userAnswer || '').trim().length > 0;

                return (
                  <div key={q.id} className="iv-q-card">
                    {/* 질문 헤더 */}
                    <div className="iv-q-header">
                      <div className="iv-q-meta">
                        <span className="iv-q-num">Q{idx + 1}</span>
                        <span className="iv-q-cat" style={{ background: cat.color + '22', color: cat.color, border: `1px solid ${cat.color}44` }}>
                          {cat.emoji} {cat.label}
                        </span>
                        {q.axis_name && (
                          <span className="iv-q-axis">
                            📐 {q.axis_name}
                            {q.axis_weight !== undefined && (
                              <span style={{ marginLeft: '0.3rem', opacity: 0.7 }}>
                                ({Math.round(q.axis_weight * 100)}%)
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 질문 본문 */}
                    <h3 className="iv-q-text">{q.question}</h3>

                    {/* 팁 */}
                    <div className="iv-q-tip">
                      <strong>💡 면접관 포인트:</strong> {q.tips}
                    </div>

                    {/* 답변 */}
                    <div className="iv-q-answer-section">
                      <label className="iv-label">나의 답변</label>
                      <textarea
                        className="iv-textarea"
                        value={q.userAnswer || ''}
                        onChange={e => handleAnswerChange(q.id, e.target.value)}
                        placeholder="면접관 앞에서 답변하듯 구체적으로 작성해보세요..."
                        rows={5}
                      />
                      <div className="iv-q-btns">
                        <button
                          className="iv-btn iv-btn-secondary"
                          onClick={() => handleFeedback(q)}
                          disabled={!hasAnswer || isLoadingFb}
                        >
                          {isLoadingFb ? <><span className="iv-spin" />분석 중...</> : '🔍 답변 피드백 받기'}
                        </button>
                        <button
                          className="iv-btn iv-btn-warning"
                          onClick={() => handleFollowUp(q)}
                          disabled={!hasAnswer || isLoadingFu}
                        >
                          {isLoadingFu ? <><span className="iv-spin" />생성 중...</> : '⚡ 압박 꼬리질문'}
                        </button>
                      </div>
                    </div>

                    {/* 피드백 결과 */}
                    {fb && (
                      <div className="iv-feedback">
                        <div className="iv-feedback-header">
                          <span>📊 답변 분석 결과</span>
                          <span className="iv-score" style={{ color: scoreColor(fb.overall_score) }}>
                            {fb.overall_score} / 5
                          </span>
                        </div>

                        {fb.strengths?.length > 0 && (
                          <div className="iv-fb-section iv-fb-strengths">
                            <div className="iv-fb-section-title">✅ 강점</div>
                            <ul>
                              {fb.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                        )}

                        {fb.risk_points?.length > 0 && (
                          <div className="iv-fb-section iv-fb-risks">
                            <div className="iv-fb-section-title">⚠️ 감점 리스크</div>
                            {fb.risk_points.map((rp, i) => (
                              <div key={i} className="iv-risk-item">
                                <div className="iv-risk-issue">{rp.issue}</div>
                                <div className="iv-risk-reason">{rp.reason}</div>
                                {rp.axis && <span className="iv-risk-axis">{rp.axis}</span>}
                              </div>
                            ))}
                          </div>
                        )}

                        {fb.improvement && (
                          <div className="iv-fb-section iv-fb-improve">
                            <div className="iv-fb-section-title">🔧 개선 방향</div>
                            <p>{fb.improvement}</p>
                          </div>
                        )}

                        {fb.follow_up_hint && (
                          <div className="iv-fb-hint">
                            💬 <strong>면접관이 파고들 부분:</strong> {fb.follow_up_hint}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 꼬리질문 결과 */}
                    {fus && fus.length > 0 && (
                      <div className="iv-followups">
                        <div className="iv-followups-title">⚡ 예상 압박 꼬리질문</div>
                        {fus.map((fu, i) => (
                          <div key={i} className="iv-fu-item">
                            <div className="iv-fu-q">{fu.question}</div>
                            <div className="iv-fu-intent">확인 포인트: {fu.intent}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 저장 버튼 */}
            <div className="iv-save-section">
              <h3>모든 답변 작성을 완료하셨나요?</h3>
              <button className="iv-btn iv-btn-primary iv-btn-lg" onClick={handleSave}>
                💾 세션 저장하기
              </button>
            </div>
          </div>
        )}

        {/* ════ STEP 4: 완료 ════ */}
        {step === 'done' && (
          <div className="iv-card iv-done">
            <div className="iv-done-icon">🎉</div>
            <h2>면접 연습 완료!</h2>
            <p>{saveSuccess}</p>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              피드백을 바탕으로 답변을 다듬고 다시 도전해보세요.
            </p>
            <div className="iv-actions">
              <button className="iv-btn iv-btn-primary" onClick={() => {
                setStep('select');
                setQuestions([]);
                setAxes([]);
                setSaveSuccess(null);
              }}>
                🔄 다시 연습하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
