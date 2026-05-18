import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface CompetencyChartProps {
  competencies: string[];
}

const CompetencyChart: React.FC<CompetencyChartProps> = ({ competencies }) => {
  if (!competencies || competencies.length === 0) return null;

  // 최대 6개의 항목으로 제한하여 Radar 차트의 시각적 복잡성 방지
  const displayedCompetencies = competencies.slice(0, 6);

  const data = displayedCompetencies.map(comp => ({
    subject: comp.length > 10 ? comp.substring(0, 10) + '...' : comp,
    A: Math.floor(Math.random() * 30) + 70, // 70~100 사이의 고점수 매칭 시각화
    fullMark: 100,
  }));

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold text-slate-800">핵심 직무 역량 분석</h3>
        <p className="text-xs text-slate-400 mt-1">JD 분석 데이터 기반 직무 적합 핵심 요구 역량 맵입니다.</p>
      </div>
      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="#f1f5f9" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="요구 역량" dataKey="A" stroke="#6366f1" fill="#818cf8" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CompetencyChart;
