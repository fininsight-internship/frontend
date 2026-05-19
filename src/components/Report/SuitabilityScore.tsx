import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface SuitabilityScoreProps {
  score: number;
}

const SuitabilityScore: React.FC<SuitabilityScoreProps> = ({ score }) => {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score },
  ];
  
  const COLORS = ['#4f46e5', '#e5e7eb']; // Indigo and Gray

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">JD 적합도 점수</h3>
      <div className="w-48 h-48 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-4xl font-bold text-indigo-600">{score}</span>
          <span className="text-sm text-gray-500">/ 100</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-4 text-center">
        {score >= 80 ? '매우 높은 적합도를 보입니다!' : score >= 60 ? '준수한 적합도를 보입니다.' : '추가적인 역량 보완이 필요합니다.'}
      </p>
    </div>
  );
};

export default SuitabilityScore;
