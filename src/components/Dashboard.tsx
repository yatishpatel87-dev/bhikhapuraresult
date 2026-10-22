import React from 'react';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  BookOpen,
  ArrowRight,
  Sparkles,
  BarChart3,
  Trophy,
} from 'lucide-react';
import { AppData, Standard } from '../types';
import {
  calculateFinalStudentResult,
  computeClassMeritList,
} from '../utils/calculations';

interface DashboardProps {
  appData: AppData;
  onNavigate: (tab: any, standard?: Standard) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ appData, onNavigate }) => {
  const { students, subjects, marks, settings } = appData;

  // Calculate results for all students
  const studentResults = students.map((st) =>
    calculateFinalStudentResult(st, subjects, marks, settings)
  );

  const totalStudents = students.length;
  const enteredStudents = studentResults.filter((r) => r.totalObtained > 0);
  const passedStudents = studentResults.filter((r) => r.status === 'પાસ');
  const failedStudents = studentResults.filter((r) => r.status === 'નાપાસ');

  const completionPct =
    totalStudents > 0 ? Math.round((enteredStudents.length / totalStudents) * 100) : 0;

  const totalPercentSum = enteredStudents.reduce((sum, r) => sum + r.percentage, 0);
  const averagePercentage =
    enteredStudents.length > 0 ? Number((totalPercentSum / enteredStudents.length).toFixed(1)) : 0;

  // Highest and Lowest
  const sortedByPct = [...enteredStudents].sort((a, b) => b.percentage - a.percentage);
  const highestStudent = sortedByPct[0];
  const lowestStudent = sortedByPct[sortedByPct.length - 1];

  // Subject performance calculation
  const subjectPerformance = subjects.map((sub) => {
    let subSum = 0;
    let count = 0;
    for (const r of studentResults) {
      const found = r.subjectWise.find((sw) => sw.subjectId === sub.id);
      if (found && found.totalMax > 0 && found.totalObtained > 0) {
        subSum += found.percentage;
        count++;
      }
    }
    const avg = count > 0 ? Math.round(subSum / count) : 0;
    return {
      id: sub.id,
      name: sub.name,
      averagePct: avg,
      studentsCount: count,
    };
  });

  // Per-standard breakdown
  const standards: Standard[] = [6, 7, 8];
  const standardStats = standards.map((std) => {
    const stdStudents = students.filter((s) => s.standard === std);
    const stdResults = studentResults.filter((r) => r.student.standard === std);
    const stdPassed = stdResults.filter((r) => r.status === 'પાસ').length;
    const stdSum = stdResults.reduce((acc, r) => acc + (r.percentage || 0), 0);
    const stdAvg = stdResults.length > 0 ? Math.round(stdSum / stdResults.length) : 0;
    return {
      std,
      count: stdStudents.length,
      passed: stdPassed,
      avg: stdAvg,
    };
  });

  // Top 3 Merit rankers overall
  const meritList = computeClassMeritList(studentResults).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white rounded-3xl p-6 sm:p-9 shadow-xl shadow-indigo-500/20 card-3d">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black text-amber-200 badge-3d">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              શૈક્ષણિક મૂલ્યાંકન સત્ર {settings.academicYear}
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight font-heading">
              {settings.schoolName} – પરિણામ ડેશબોર્ડ
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              ધોરણ ૬, ૭ અને ૮ ના વિદ્યાર્થીઓની ગુણ નોંધણી, પત્રક A, પત્રક B અને પ્રગતિ પત્રક (રિપોર્ટ કાર્ડ) નું સરળ સંચાલન.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('marks')}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 font-black text-xs sm:text-sm rounded-2xl hover:from-amber-300 hover:to-yellow-300 shadow-lg shadow-amber-500/25 transition-all cursor-pointer btn-3d"
            >
              <span>ગુણ નોંધણી શરૂ કરો</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('result')}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/15 hover:bg-white/25 text-white font-black text-xs sm:text-sm rounded-2xl border-2 border-white/30 backdrop-blur-md transition-all cursor-pointer btn-3d"
            >
              <span>3D પરિણામ જુઓ ✨</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid with Vibrant 3D Pop Styling */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-5 rounded-3xl shadow-lg shadow-blue-500/15 card-3d flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-100 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">કુલ વિદ્યાર્થીઓ</span>
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl badge-3d">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-heading mt-1">{totalStudents}</div>
          <div className="text-xs text-blue-100 mt-2 flex items-center gap-1 font-semibold">
            <span>ધો. ૬, ૭, ૮ સક્રિય</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-5 rounded-3xl shadow-lg shadow-purple-500/15 card-3d flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-100 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">પૂર્ણતા દર</span>
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl badge-3d">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-heading mt-1">{completionPct}%</div>
          <div className="w-full bg-black/20 h-2.5 rounded-full mt-2 overflow-hidden border border-white/20">
            <div
              className="bg-yellow-300 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="text-[11px] text-purple-100 mt-1 font-semibold">
            {enteredStudents.length} / {totalStudents} ગુણ નોંધાયા
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 rounded-3xl shadow-lg shadow-emerald-500/15 card-3d flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-100 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">પાસ વિદ્યાર્થીઓ</span>
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl badge-3d">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-heading mt-1">{passedStudents.length}</div>
          <div className="text-xs text-emerald-100 mt-2 font-semibold">
            નાપાસ / સુધારણા પાત્ર: <strong className="text-yellow-200">{failedStudents.length}</strong>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-5 rounded-3xl shadow-lg shadow-amber-500/15 card-3d flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-100 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">સરેરાશ ટકા</span>
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl badge-3d">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-heading mt-1">{averagePercentage}%</div>
          <div className="text-xs text-amber-100 mt-2 font-semibold">
            પાસિંગ ધોરણ: <strong>{settings.passingPercentage}%</strong>
          </div>
        </div>
      </div>

      {/* Standard-wise performance + Merit List Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Standard 6, 7, 8 Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">ધોરણવાર વિહંગાવલોકન</h3>
              <p className="text-xs text-slate-500">ધોરણ ૬, ૭ અને ૮ નું વિશ્લેષણ</p>
            </div>
            <button
              onClick={() => onNavigate('result')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              વિગતવાર પરિણામ <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {standardStats.map((item) => (
              <div
                key={item.std}
                onClick={() => onNavigate('marks', item.std)}
                className="bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-xl p-4 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-bold text-slate-900 group-hover:text-blue-700">
                    ધોરણ {item.std}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {item.count} વિદ્યાર્થી
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>પાસ થયેલ:</span>
                    <strong className="text-emerald-700">{item.passed} વિદ્યાર્થી</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>સરેરાશ ટકા:</span>
                    <strong className="text-slate-900">{item.avg}%</strong>
                  </div>
                </div>
                <div className="mt-3 text-[11px] font-semibold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  ગુણ નોંધણી જુઓ <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>

          {/* Highest & Lowest Student Callouts */}
          {highestStudent && (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-lg">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-emerald-800 uppercase">
                    શાળામાં સર્વોચ્ચ ગુણ (ટોપર)
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{highestStudent.student.name}</div>
                  <div className="text-xs text-emerald-700">
                    ધોરણ {highestStudent.student.standard} • {highestStudent.percentage}% (ગ્રેડ {highestStudent.grade})
                  </div>
                </div>
              </div>

              {lowestStudent && lowestStudent.student.id !== highestStudent.student.id && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="p-2 bg-amber-500 text-white rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-amber-800 uppercase">
                      સુધારણાની જરૂરિયાત ધરાવતો વિદ્યાર્થી
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{lowestStudent.student.name}</div>
                    <div className="text-xs text-amber-700">
                      ધોરણ {lowestStudent.student.standard} • {lowestStudent.percentage}% (વિશેષ માર્ગદર્શન આપવું)
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top 3 Merit Rankers Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-800">મેરિટ લિસ્ટ - અગ્રણી વિદ્યાર્થીઓ</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">સમગ્ર શાળામાં પ્રથમ ત્રણ ક્રમાંક</p>

            <div className="space-y-3">
              {meritList.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center">હજુ ગુણ નોંધાયા નથી.</div>
              ) : (
                meritList.map((ranker, idx) => (
                  <div
                    key={ranker.student.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          idx === 0
                            ? 'bg-amber-400 text-amber-950 shadow-xs'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : 'bg-amber-700/20 text-amber-900'
                        }`}
                      >
                        {ranker.rank || idx + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-800 leading-tight">
                          {ranker.student.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          ધોરણ {ranker.student.standard}-{ranker.student.division} • રોલ નં: {ranker.student.rollNumber}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-blue-700">{ranker.percentage}%</div>
                      <div className="text-[10px] text-slate-500">ગ્રેડ {ranker.grade}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('result')}
              className="w-full text-center py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              સંપૂર્ણ મેરિટ પત્રક જુઓ
            </button>
          </div>
        </div>
      </div>

      {/* Subject-Wise Performance Analysis */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" /> વિષયવાર સરેરાશ પ્રદર્શન
            </h3>
            <p className="text-xs text-slate-500">દરેક વિષયમાં વિદ્યાર્થીઓની એકંદર ટકાવારી</p>
          </div>
          <button
            onClick={() => onNavigate('patrakA')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
          >
            પત્રક A ખોલો →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {subjectPerformance.map((sub) => (
            <div key={sub.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs font-semibold text-slate-700 truncate" title={sub.name}>
                {sub.name}
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-black text-slate-900">{sub.averagePct}%</span>
                <span className="text-[11px] text-slate-500">સરેરાશ</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    sub.averagePct >= 70
                      ? 'bg-emerald-500'
                      : sub.averagePct >= 50
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, sub.averagePct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
