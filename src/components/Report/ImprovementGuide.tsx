import React from 'react';
import { AlertCircle, Lightbulb, ClipboardEdit, Sparkles } from 'lucide-react';

interface ImprovementGuideProps {
  lackingCompetencies: string[];
  experiencesToHighlight: string[];
  modificationDirection: string[];
}

const ImprovementGuide: React.FC<ImprovementGuideProps> = ({
  lackingCompetencies,
  experiencesToHighlight,
  modificationDirection,
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col gap-8">
      {/* Header section */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
          실전 맞춤형 지원 서류 최적화 솔루션
        </h3>
        <p className="text-xs text-slate-400 mt-1">AI가 분석한 이력서 보완점 및 맞춤형 서류 작성 전략 로드맵입니다.</p>
      </div>

      {/* Lacking Competencies Alert */}
      {lackingCompetencies && lackingCompetencies.length > 0 && (
        <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-100/80 transition-all duration-300 hover:shadow-md hover:shadow-amber-100/20">
          <h4 className="text-sm font-bold text-amber-800 mb-2.5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            보완이 필요한 직무 역량 (Lacking Competencies)
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-700 font-medium">
            {lackingCompetencies.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5 bg-white/70 py-2 px-3 rounded-lg border border-amber-100/50 shadow-sm">
                <span className="text-amber-500">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Experiences to Highlight */}
      {experiencesToHighlight && experiencesToHighlight.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-emerald-500" />
            이력서에서 강력히 어필해야 할 경험 & 성과
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {experiencesToHighlight.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100/60 shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-emerald-100/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-5 h-5 bg-emerald-100 text-emerald-700 text-xs font-black rounded-full">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-emerald-800">핵심 소구 포인트</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modification Direction Roadmap */}
      {modificationDirection && modificationDirection.length > 0 && (
        <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-100/60">
          <h4 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
            <ClipboardEdit className="w-4 h-4 text-indigo-600" />
            구체적인 자소서/이력서 문장 수정 가이드 (STAR 기법 적용)
          </h4>
          <div className="relative border-l-2 border-indigo-100 ml-2.5 pl-5 space-y-6">
            {modificationDirection.map((item, idx) => (
              <div key={idx} className="relative">
                <span className="absolute -left-[29px] top-0 flex items-center justify-center w-4 h-4 bg-indigo-600 text-[10px] font-bold text-white rounded-full ring-4 ring-indigo-50">
                  {idx + 1}
                </span>
                <p className="text-xs text-slate-600 font-medium whitespace-pre-line leading-relaxed pl-1">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovementGuide;
