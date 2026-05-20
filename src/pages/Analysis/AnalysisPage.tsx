import { useState, useRef, useEffect } from 'react';
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
import { getSavedReports, toggleStarReport, deleteReport } from '../../services/analysis';

/* ─── Company Colors ─── */
const COMPANY_COLORS = ['#FACC15', '#22C55E', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6'];
const getCompanyColor = (companyName: string) => {
  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COMPANY_COLORS.length;
  return COMPANY_COLORS[index];
};

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
  rawData: any;
}


type TabType = 'all' | 'starred' | 'recent';

export default function AnalysisPage() {
  const [companyName, setCompanyName] = useState('');
  const [jdUrl, setJdUrl] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await getSavedReports();
        const mapped: SavedReport[] = data.map((item) => {
          const comp = item.company_name || '분석 기업';
          const dateObj = item.created_at ? new Date(item.created_at) : new Date();
          const formattedDate = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;
          
          const techStacks = item.job_analysis?.tech_stacks || [];
          const competencyTags = item.company_analysis?.required_competencies_from_company || [];
          const tags = [...techStacks.slice(0, 2), ...competencyTags.slice(0, 1)];

          return {
            id: String(item.id),
            company: comp,
            companyInitial: comp[0] || '기',
            companyColor: getCompanyColor(comp),
            position: item.job_role || '지원 직무',
            tags: tags.length > 0 ? tags : ['직무분석', '역량분석'],
            score: item.fit_analysis?.score || 80,
            date: formattedDate,
            starred: !!item.is_starred,
            rawData: item
          };
        });
        setReports(mapped);
      } catch (err) {
        console.error('리포트 조회 실패:', err);
      }
    };
    fetchReports();
  }, []);

  const filteredReports = reports.filter((r) => {
    if (activeTab === 'starred') return r.starred;
    return true; // 'all' and 'recent' show all (recent would sort by date)
  });

  const navigate = useNavigate();
  const handleAnalysis = () => {
    if (!companyName.trim()) return;
    
    const query = new URLSearchParams({
      company: companyName,
      jdUrl: jdUrl
    }).toString();
    
    if (resumeFile) {
      navigate(`/analysis/report?${query}`, { state: { resumeFile } });
    } else {
      navigate(`/analysis/report?${query}`);
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

  const handleViewReport = (report: SavedReport) => {
    const query = new URLSearchParams({
      company: report.company,
      jdUrl: report.rawData.job_analysis?.jd_url || ''
    }).toString();
    navigate(`/analysis/report?${query}`, { state: { reportData: report.rawData } });
  };

  const toggleStar = async (id: string) => {
    try {
      const isStarred = await toggleStarReport(Number(id));
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, starred: isStarred } : r))
      );
    } catch (err) {
      console.error('즐겨찾기 토글 실패:', err);
    }
  };

  const deleteReportHandler = async (id: string) => {
    if (!window.confirm('정말로 이 리포트를 삭제하시겠습니까?')) return;
    try {
      await deleteReport(Number(id));
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('리포트 삭제 실패:', err);
    }
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
                    <button className={styles.actionBtn} onClick={() => handleViewReport(report)}>
                      <Eye size={14} />
                      보기
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={() => deleteReportHandler(report.id)}
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
