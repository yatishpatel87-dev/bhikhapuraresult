import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  BarChart2,
  LineChart as LineChartIcon,
  CheckCircle2,
} from 'lucide-react';
import { ExamKey, Student, StudentMarksRecord, Subject } from '../types';

interface StudentProgressChartProps {
  student: Student;
  studentSubjects: Subject[];
  marks: StudentMarksRecord;
  themeMode?: '3d_vibrant' | 'classic';
}

interface CycleProgressPoint {
  cycleKey: ExamKey;
  cycleName: string;
  shortName: string;
  totalObtained: number;
  totalMax: number;
  percentage: number;
  [subjectName: string]: string | number;
}

export const StudentProgressChart: React.FC<StudentProgressChartProps> = ({
  student,
  studentSubjects,
  marks,
  themeMode = '3d_vibrant',
}) => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  const cycles: { key: ExamKey; name: string; short: string; badge: string }[] = [
    { key: 'quarterly1', name: 'પ્રથમ ત્રિમાસિક (UT-1)', short: 'કસોટી ૧', badge: '૪૦ ગુણ' },
    { key: 'quarterly2', name: 'બીજી ત્રિમાસિક (UT-2)', short: 'કસોટી ૨', badge: '૪૦ ગુણ' },
    { key: 'sem1', name: 'સત્ર ૧ પરીક્ષા (Session 1)', short: 'સત્ર ૧', badge: '૮૦ ગુણ' },
    { key: 'sem2', name: 'સત્ર ૨ પરીક્ષા (Session 2)', short: 'સત્ર ૨', badge: '૮૦ ગુણ' },
  ];

  // Colors for subject bars
  const SUBJECT_BAR_COLORS = [
    '#f59e0b', // Gujarati - amber
    '#f43f5e', // Hindi - rose
    '#0ea5e9', // English - sky
    '#6366f1', // Maths - indigo
    '#10b981', // Science - emerald
    '#ea580c', // Social Sci - orange
    '#8b5cf6', // Sanskrit - purple
  ];

  // Process data for the 4 cycles
  const progressData: CycleProgressPoint[] = cycles.map((c) => {
    let totalObt = 0;
    let totalMax = 0;
    let hasMarks = false;
    const subScores: Record<string, number> = {};

    studentSubjects.forEach((sub) => {
      const entry = marks[student.id]?.[sub.id]?.[c.key];
      const maxM = sub.maxMarks[c.key] || (c.key === 'sem1' || c.key === 'sem2' ? 80 : 40);
      totalMax += maxM;

      const subShortName = sub.name.split(' ')[0];
      if (!entry?.isAbsent && entry?.marks !== undefined) {
        totalObt += entry.marks;
        hasMarks = true;
        // Normalized percentage for each subject
        subScores[subShortName] = Math.round((entry.marks / maxM) * 100);
      } else {
        subScores[subShortName] = 0;
      }
    });

    const pct = totalMax > 0 && hasMarks ? Number(((totalObt / totalMax) * 100).toFixed(1)) : 0;

    return {
      cycleKey: c.key,
      cycleName: c.name,
      shortName: c.short,
      totalObtained: totalObt,
      totalMax: totalMax,
      percentage: pct,
      ...subScores,
    };
  });

  // Calculate improvement trend
  const firstPct = progressData[0]?.percentage || 0;
  const lastPct = progressData[3]?.percentage || progressData[2]?.percentage || 0;
  const growth = Number((lastPct - firstPct).toFixed(1));
  const isPositiveGrowth = growth >= 0;

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as CycleProgressPoint;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs backdrop-blur-md">
          <div className="font-black text-amber-300 font-heading text-sm mb-1">
            {dataPoint.cycleName}
          </div>
          <div className="flex items-center justify-between gap-4 py-0.5">
            <span className="text-slate-300">મેળવેલા ગુણ:</span>
            <span className="font-black text-white">
              {dataPoint.totalObtained} / {dataPoint.totalMax}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 py-0.5 border-t border-slate-700/80 mt-1 pt-1">
            <span className="text-slate-300">એકંદર ટકાવારી:</span>
            <span className="font-black text-base text-yellow-300">{dataPoint.percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="my-6 p-4 sm:p-5 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/70 print:bg-white rounded-3xl border-2 border-indigo-200 shadow-md card-3d">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md badge-3d">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-700">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>વિદ્યાર્થી પ્રગતિ અને સુધારા આલેખ (Visual Progress Chart)</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading">
              કસોટી ચક્રવાર ટકાવારી વૃદ્ધિ (Test Cycles Progress)
            </h3>
          </div>
        </div>

        {/* Growth Badge & View Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-xs border ${
              isPositiveGrowth
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                : 'bg-rose-100 text-rose-900 border-rose-300'
            }`}
          >
            {isPositiveGrowth ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span>
              {isPositiveGrowth ? `+${growth}% સુધારો` : `${growth}% ફેરફાર`}
            </span>
          </div>

          <div className="no-print bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex items-center gap-0.5">
            <button
              onClick={() => setChartType('area')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                chartType === 'area'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LineChartIcon className="w-3 h-3" />
              <span>ટકાવારી ટ્રેન્ડ</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              <span>વિષયવાર બાર</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Cycle KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5">
        {progressData.map((d, idx) => (
          <div
            key={d.cycleKey}
            className="p-2.5 bg-white rounded-2xl border-2 border-indigo-100 shadow-xs flex items-center justify-between"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-500 block truncate">
                {d.shortName}
              </span>
              <div className="text-sm sm:text-base font-black text-indigo-950 font-heading">
                {d.percentage > 0 ? `${d.percentage}%` : '-'}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
                {cycles[idx].badge}
              </span>
              <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                {d.totalObtained}/{d.totalMax}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Recharts Container */}
      <div className="w-full h-56 sm:h-64 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={progressData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="shortName"
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={33}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                label={{
                  value: 'પાસિંગ ૩૩%',
                  fill: '#f43f5e',
                  fontSize: 10,
                  fontWeight: 700,
                  position: 'insideBottomRight',
                }}
              />
              <Area
                type="monotone"
                dataKey="percentage"
                name="ટકાવારી"
                stroke="#4f46e5"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#progressGrad)"
                dot={{ r: 5, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 3 }}
              />
            </AreaChart>
          ) : (
            <BarChart data={progressData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="shortName"
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(val: any, name: any) => [`${val}%`, name]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  borderRadius: '16px',
                  border: '1px solid #334155',
                  fontSize: '11px',
                  fontWeight: 'bold',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '6px' }}
                iconType="circle"
              />
              {studentSubjects.map((sub, idx) => (
                <Bar
                  key={sub.id}
                  dataKey={sub.name.split(' ')[0]}
                  name={sub.name.split(' ')[0]}
                  fill={SUBJECT_BAR_COLORS[idx % SUBJECT_BAR_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Note */}
      <div className="pt-2 text-[10px] text-slate-500 flex items-center justify-between">
        <span className="font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          ૪ પરીક્ષા ચક્રો (કસોટી ૧, ૨ અને સત્ર ૧, ૨) ના આધારે વિદ્યાર્થીની ઉત્તરોત્તર પ્રગતિ
        </span>
        <span className="font-black text-indigo-700">
          {growth > 0 ? `🚀 સકારાત્મક ગ્રોથ ટ્રેન્ડ` : `📊 સતત મૂલ્યાંકન રેકોર્ડ`}
        </span>
      </div>
    </div>
  );
};
