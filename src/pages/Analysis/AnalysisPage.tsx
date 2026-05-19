import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Upload,
  Star,
  Eye,
  Trash2,
} from 'lucide-react';
import styles from './AnalysisPage.module.css';

/* ─── Mock data ─── */
interface SavedReport {
  id: string;
  company: string;
  companyInitial: string;
  companyColor: string;
  position: string;
  tags: string[];
  score: number;
  date: string;
  starred: boolean;
}

const MOCK_REPORTS: SavedReport[] = [
  {
    id: '1',
    company: '카카오',
    companyInitial: '카',
    companyColor: '#FACC15',
    position: '프론트엔드 개발자',
    tags: ['React', 'TypeScript', '성장성'],
    score: 84,
    date: '2025.05.12',
    starred: true,
  },
  {
    id: '2',
    company: '네이버',
    companyInitial: '네',
    companyColor: '#22C55E',
    position: '데이터 분석가',
    tags: ['Python', 'SQL', 'ML'],
    score: 71,
    date: '2025.05.08',
    starred: true,
  },
  {
    id: '3',
    company: '토스',
    companyInitial: '토',
    companyColor: '#3B82F6',
    position: 'iOS 개발자',
    tags: ['Swift', '핀테크', '성장형인재'],
    score: 67,
    date: '2025.05.01',
    starred: false,
  },
  {
    id: '4',
    company: '쿠팡',
    companyInitial: '쿠',
    companyColor: '#F59E0B',
    position: '백엔드 개발자',
    tags: ['Java', 'Spring', '물류'],
    score: 58,
    date: '2025.04.28',
    starred: false,
  },
];

type TabType = 'all' | 'starred' | 'recent';

export default function AnalysisPage() {
  const [companyName, setCompanyName] = useState('');
  const [jdUrl, setJdUrl] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [reports, setReports] = useState<SavedReport[]>(MOCK_REPORTS);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredReports = reports.filter((r) => {
    if (activeTab === 'starred') return r.starred;
    return true; // 'all' and 'recent' show all (recent would sort by date)
  });

  const navigate = useNavigate();
  const handleAnalysis = () => {
    if (!companyName.trim()) return;
    
    if (resumeFile) {
      // Option A: File uploaded, skip chat, go straight to report
      const query = new URLSearchParams({
        company: companyName,
        jdUrl: jdUrl
      }).toString();
      navigate(`/analysis/report?${query}`, { state: { resumeFile } });
    } else {
      // No file, proceed to chat
      const query = new URLSearchParams({
        company: companyName,
        jdUrl: jdUrl
      }).toString();
      navigate(`/analysis/chat?${query}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const toggleStar = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, starred: !r.starred } : r))
    );
  };

  const deleteReport = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22C55E';
    if (score >= 70) return '#3B82F6';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className={styles.page}>
      {/* ─── Page Header ─── */}
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>JD & 기업분석</h1>
          <p className={styles.pageDesc}>
            채용공고와 기업정보를 AI가 통합 분석하여 리포트를 생성합니다
          </p>
        </div>
        <button className={styles.newAnalysisBtn}>
          <Plus size={18} />
          새 분석 시작
        </button>
      </header>

      {/* ─── Quick Analysis Card ─── */}
      <section className={styles.quickCard}>
        <h2 className={styles.quickTitle}>빠른 분석 시작</h2>
        <div className={styles.quickForm}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              기업명 <span className={styles.required}>*</span>
            </label>
            <input
              id="company-name-input"
              type="text"
              className={styles.input}
              placeholder="예: 카카오, 네이버, 토스"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>채용공고 URL (선택)</label>
            <input
              id="jd-url-input"
              type="text"
              className={styles.input}
              placeholder="https://careers.kakao.com/jobs/12345"
              value={jdUrl}
              onChange={(e) => setJdUrl(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.quickActions}>
          <div className={styles.quickActionsLeft}>
            <button
              id="start-analysis-btn"
              className={styles.analyzeBtn}
              onClick={handleAnalysis}
            >
              <Search size={16} />
              분석 시작 →
            </button>
            <button className={styles.uploadBtn} onClick={handleUploadClick}>
              <Upload size={16} />
              {resumeFile ? resumeFile.name : '이력서 업로드 (PDF, Word)'}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />
          </div>
          <span className={styles.helperText}>
            URL 없이 기업명만 입력해도 분석합니다
          </span>
        </div>
      </section>

      {/* ─── Saved Reports ─── */}
      <section className={styles.reportsSection}>
        <div className={styles.reportsHeader}>
          <h2 className={styles.reportsTitle}>저장된 리포트</h2>
          <div className={styles.tabs}>
            {([
              ['all', '전체'],
              ['starred', '즐겨찾기'],
              ['recent', '최근'],
            ] as [TabType, string][]).map(([key, label]) => (
              <button
                key={key}
                className={`${styles.tab} ${activeTab === key ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.reportList}>
          {filteredReports.map((report) => (
            <div key={report.id} className={styles.reportCard}>
              <div className={styles.reportLeft}>
                <div
                  className={styles.companyIcon}
                  style={{ backgroundColor: report.companyColor + '20', color: report.companyColor }}
                >
                  {report.companyInitial}
                </div>
                <div className={styles.reportInfo}>
                  <div className={styles.reportNameRow}>
                    <span className={styles.companyName}>{report.company}</span>
                    <span className={styles.separator}>·</span>
                    <span className={styles.position}>{report.position}</span>
                    <button
                      className={`${styles.starBtn} ${report.starred ? styles.starred : ''}`}
                      onClick={() => toggleStar(report.id)}
                    >
                      <Star size={14} fill={report.starred ? '#FACC15' : 'none'} />
                    </button>
                  </div>
                  <div className={styles.tags}>
                    {report.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className={styles.reportRight}>
                <div className={styles.scoreBlock}>
                  <span
                    className={styles.score}
                    style={{ color: getScoreColor(report.score) }}
                  >
                    {report.score}%
                  </span>
                  <span className={styles.scoreLabel}>적합도</span>
                </div>
                <div className={styles.reportMeta}>
                  <span className={styles.reportDate}>{report.date}</span>
                  <div className={styles.reportActions}>
                    <button className={styles.actionBtn}>
                      <Eye size={14} />
                      보기
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={() => deleteReport(report.id)}
                    >
                      <Trash2 size={14} />
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
