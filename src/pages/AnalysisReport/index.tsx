import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { analyzeJobAndResume, type AnalysisResponseData } from '../../services/analysis';
import SuitabilityScore from '../../components/Report/SuitabilityScore';
import CompetencyChart from '../../components/Report/CompetencyChart';
import ImprovementGuide from '../../components/Report/ImprovementGuide';
import { 
  ArrowLeft, 
  Building2, 
  Briefcase, 
  Award, 
  Globe, 
  Compass, 
  TrendingUp, 
  Target, 
  Sparkles, 
  ShieldCheck,
  Cpu, 
  BadgeAlert,
  ThumbsUp, 
  ScrollText 
} from 'lucide-react';

export default function AnalysisReportPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const companyName = searchParams.get('company') || '';
  const jdUrl = searchParams.get('jdUrl') || '';
  const resumeText = searchParams.get('resumeText') || '';
  const resumeFile = location.state?.resumeFile || null;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'company' | 'jd' | 'competency'>('company');

  // Reports states
  const [jdReport, setJdReport] = useState<AnalysisResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyName) return;

    const fetchAllReports = async () => {
      setLoading(true);
      try {
        const jdRes = await analyzeJobAndResume({
          companyName,
          jdUrl,
          resumeFile: resumeFile,
          resumeTextInput: resumeText
        });
        setJdReport(jdRes);
      } catch (err: any) {
        console.error(err);
        setError('리포트를 생성하는 과정에서 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllReports();
  }, [companyName, jdUrl, resumeText]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-5 px-4 font-sans">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
          <Sparkles className="w-6 h-6 text-indigo-500 absolute top-5 left-5 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-slate-800 font-bold text-lg">AI 맞춤형 취업 리포트 작성 중</p>
          <p className="text-slate-500 text-sm mt-1">기업 최신 이슈 파악 및 이력서 매칭 알고리즘을 가동하고 있습니다...</p>
          <p className="text-slate-400 text-xs mt-3 bg-white py-1.5 px-4 rounded-full shadow-sm border border-slate-100 inline-block">약 10~20초 가량 소요될 수 있습니다.</p>
        </div>
      </div>
    );
  }

  if (error || !jdReport) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4 font-sans">
        <div className="bg-red-50 p-4 rounded-full border border-red-100">
          <BadgeAlert className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-red-500 font-bold text-lg">{error || '리포트 로드에 실패했습니다.'}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition">
          뒤로 가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2.5 bg-white hover:bg-slate-50 rounded-xl transition shadow-sm border border-slate-200"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              AI 인텔리전스 채용 컨설턴트
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
              {companyName} 맞춤형 전략 리포트
            </h1>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl mb-8 max-w-lg border border-slate-200/40">
          <button
            onClick={() => setActiveTab('company')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'company' 
                ? 'bg-white text-indigo-600 shadow-sm font-extrabold border border-indigo-50/50' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            기업 분석
          </button>
          <button
            onClick={() => setActiveTab('jd')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'jd' 
                ? 'bg-white text-indigo-600 shadow-sm font-extrabold border border-indigo-50/50' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            JD 분석
          </button>
          <button
            onClick={() => setActiveTab('competency')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'competency' 
                ? 'bg-white text-indigo-600 shadow-sm font-extrabold border border-indigo-50/50' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            지원 및 매칭 전략
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-6">
          {activeTab === 'company' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Core Business */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 md:col-span-2">
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  직무 연계 핵심 비즈니스 및 사업 모델
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{jdReport.company_analysis.core_business}</p>
              </div>

              {/* Organizational Direction */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <Compass className="w-5 h-5 text-indigo-600" />
                  조직의 향후 방향성 및 성장 Trajectory
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{jdReport.company_analysis.organizational_direction}</p>
              </div>

              {/* Recent Issues */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  최신 직무 연관 핫 이슈 (뉴스와 공시 기반)
                </h3>
                <div className="space-y-2.5 mt-4">
                  {jdReport.company_analysis.recent_issues.map((issue, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100 transition hover:bg-slate-100/50">
                      <span className="flex-shrink-0 w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5"></span>
                      <p className="text-slate-700 text-xs font-semibold leading-relaxed">{issue}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Competencies */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 md:col-span-2">
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2.5">
                  <Target className="w-5 h-5 text-indigo-600" />
                  기업 인재상 기반 직무 요구 핵심 역량
                </h3>
                <div className="flex flex-wrap gap-2.5 mt-4">
                  {jdReport.company_analysis.required_competencies_from_company.map((comp, idx) => (
                    <span 
                      key={idx} 
                      className="px-4 py-2 bg-indigo-50/60 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-100 transition hover:bg-indigo-100/60"
                    >
                      💡 {comp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Interview Cheat Sheet (Interview Context) */}
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-slate-100 p-7 rounded-3xl shadow-xl shadow-indigo-100 md:col-span-2 relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-12 translate-y-12">
                  <Sparkles className="w-72 h-72 text-indigo-100" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-black mb-3.5 flex items-center gap-2.5 text-white">
                    <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                    서류 & 면접 실전 치트키 (Corporate Context)
                  </h3>
                  <div className="h-px bg-slate-700/60 w-full mb-4"></div>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {jdReport.company_analysis.interview_context}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'jd' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* JD Core Requirements */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  채용 공고 핵심 요구 사항
                </h3>
                <div className="space-y-3">
                  {jdReport.job_analysis.core_requirements.map((req, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                        {idx + 1}
                      </span>
                      <p className="text-slate-700 text-xs leading-relaxed font-semibold">{req}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* JD Preferred Qualifications */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <ThumbsUp className="w-5 h-5 text-indigo-600" />
                  주요 우대 사항 (Preferred Qualifications)
                </h3>
                <div className="space-y-3">
                  {jdReport.job_analysis.preferred_qualifications.map((pref, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                      <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                        {idx + 1}
                      </span>
                      <p className="text-slate-700 text-xs leading-relaxed font-semibold">{pref}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Tech Stacks */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 md:col-span-2">
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2.5">
                  <Cpu className="w-5 h-5 text-indigo-600" />
                  요구 기술 스택 (Skills & Technologies)
                </h3>
                <div className="flex flex-wrap gap-2.5 mt-4">
                  {jdReport.job_analysis.tech_stacks.map((skill, idx) => (
                    <span 
                      key={idx} 
                      className="px-3.5 py-1.5 bg-slate-100 text-slate-700 text-xs font-black rounded-lg border border-slate-200 transition hover:bg-slate-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Job Strategic Importance */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 md:col-span-2">
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <ScrollText className="w-5 h-5 text-indigo-600" />
                  해당 직무의 비즈니스 및 전략적 가치
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{jdReport.job_analysis.strategic_importance}</p>
              </div>
            </div>
          )}

          {activeTab === 'competency' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Suitability Score */}
              <div className="md:col-span-1">
                <SuitabilityScore score={jdReport.fit_analysis.score} />
              </div>

              {/* Qualitative Evaluation Details */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 md:col-span-2 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
                    <Award className="w-5 h-5 text-indigo-600" />
                    이력서 종합 매칭 평가
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {jdReport.fit_analysis.evaluation}
                  </p>
                </div>
                <div className="mt-4 bg-indigo-50/50 px-4 py-3 rounded-xl border border-indigo-100 text-indigo-800 text-xs font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>이 리포트는 AI 채용 엔진이 지원자 이력서와 기업 JD의 핵심 요구치를 실시간 대조하여 산정했습니다.</span>
                </div>
              </div>

              {/* Competency Radar Chart */}
              <div className="md:col-span-3">
                <CompetencyChart competencies={jdReport.job_analysis.core_requirements} />
              </div>

              {/* Detailed Optimization Guideline */}
              <div className="md:col-span-3">
                <ImprovementGuide 
                  lackingCompetencies={jdReport.fit_analysis.lacking_competencies}
                  experiencesToHighlight={jdReport.document_optimization.experiences_to_highlight}
                  modificationDirection={jdReport.document_optimization.modification_direction}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
