import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, CheckCircle2, Circle } from 'lucide-react';
import { getNextQuestion, type ChatMessage } from '../../services/chatService';
import styles from './AnalysisChat.module.css';

export default function AnalysisChatPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const company = searchParams.get('company') || '';
  const jdUrl = searchParams.get('jdUrl') || '';
  const [reportLoading] = useState(false);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [jdText, setJdText] = useState<string | undefined>(undefined);

  // Load initial question on mount
  useEffect(() => {
    if (!company) return;
    const fetchFirst = async () => {
      setLoading(true);
      const resp = await getNextQuestion(company, jdUrl, undefined, []);
      if (resp.success) {
        setChatHistory((prev) => [...prev, { role: 'assistant', content: resp.data.question }]);
        setFinished(resp.data.is_finished);
        setJdText(resp.data.jd_text);
      }
      setLoading(false);
    };
    fetchFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, jdUrl]);

  const sendMessage = async () => {
    if (!currentInput.trim() || finished) return;
    const userMsg = { role: 'user' as const, content: currentInput.trim() };
    setChatHistory((prev) => [...prev, userMsg]);
    setCurrentInput('');
    setLoading(true);
    const resp = await getNextQuestion(company, jdUrl, jdText, [...chatHistory, userMsg]);
    if (resp.success) {
      setChatHistory((prev) => [...prev, { role: 'assistant', content: resp.data.question }]);
      setFinished(resp.data.is_finished);
    }
    setLoading(false);
  };

  const handleGenerateReport = async () => {
    // Gather all user messages as resume text input
    const userMessages = chatHistory
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join('\n');

    const query = new URLSearchParams({
      company: company,
      jdUrl: jdUrl,
      resumeText: userMessages,
    }).toString();

    navigate(`/analysis/report?${query}`);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={styles.container}>
      {/* Left Side: Chat Section */}
      <div className={styles.chatSection}>
        <div className={styles.chatHeader}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </button>
          <div className={styles.headerInfo}>
            <h2 className={styles.title}>기업분석 진행 중</h2>
            <p className={styles.subtitle}>{company} · 직무명 미정</p>
          </div>
          <div className={styles.statusBadge}>
            <span className={styles.dot}></span>
            AI 분석 진행 중
          </div>
        </div>

        <div className={styles.chatBox}>
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`${styles.messageRow} ${msg.role === 'assistant' ? styles.ai : styles.user}`}>
              <div className={`${styles.avatar} ${msg.role === 'assistant' ? styles.ai : styles.user}`}>
                {msg.role === 'assistant' ? 'AI' : '나'}
              </div>
              <div className={styles.messageContent}>
                <div className={styles.messageBubble}>
                  {msg.content}
                </div>
                {/* <div className={styles.messageTime}>오전 10:15</div> */}
              </div>
            </div>
          ))}
          {loading && (
            <div className={`${styles.messageRow} ${styles.ai}`}>
              <div className={`${styles.avatar} ${styles.ai}`}>AI</div>
              <div className={styles.loadingBubble}>
                 <div className={styles.dot}></div>
                 <div className={styles.dot}></div>
                 <div className={styles.dot}></div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.inputAreaWrapper}>
          <div className={styles.inputBox}>
            <textarea
              placeholder="답변을 입력하세요..."
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={finished || loading}
              className={styles.input}
              rows={1}
            />
            <button onClick={sendMessage} disabled={!currentInput.trim() || loading || finished} className={styles.sendBtn}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Side: Progress Panel */}
      <div className={styles.progressSection}>
        <div>
          <h3 className={styles.panelTitle}>분석 진행 현황</h3>
          <div className={styles.stepper}>
            {['JD·핵심 역량 추출', '기업 전략 분석', '인재상 파악', '사용자 경험 매칭', '적합도 점수 산출', '리포트 생성'].map((step, idx) => {
              let statusClass = styles.pending;
              if (idx < 3) statusClass = styles.completed;
              else if (idx === 3 && !finished) statusClass = styles.active;
              else if (idx === 3 && finished) statusClass = styles.completed;
              else if (idx > 3 && finished) statusClass = styles.active; // Example logic

              return (
                <div key={idx} className={`${styles.step} ${statusClass}`}>
                  <div className={styles.stepIcon}>
                    {statusClass === styles.completed ? <CheckCircle2 size={24} color="#22c55e" /> : <Circle size={20} />}
                  </div>
                  <span className={styles.stepText}>{step}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.card}>
          <h4 className={styles.cardTitle}>분석된 JD 핵심 키워드</h4>
          <div className={styles.keywordList}>
            {['React', 'TypeScript', '성능최적화', '협업능력', '대규모서비스', '모노레포', 'Next.js'].map(k => (
              <span key={k} className={styles.keyword}>{k}</span>
            ))}
          </div>
        </div>

        <div className={styles.scoreCard}>
          <h4 className={styles.cardTitle} style={{textAlign: 'left', marginBottom: '8px'}}>예상 적합도</h4>
          <div className={styles.scoreValue}>~82%</div>
          <div className={styles.scoreDesc}>분석 완료 후 정확한 점수 제공</div>
        </div>

        {finished && (
          <button className={styles.generateBtn} onClick={handleGenerateReport} disabled={reportLoading}>
            {reportLoading ? '보고서 생성 중...' : '최종 리포트 생성하기'}
          </button>
        )}
      </div>
    </div>
  );
}
