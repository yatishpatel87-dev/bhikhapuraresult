import React, { useState, useMemo } from 'react';
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
  Search,
  Filter,
  Sliders,
  ChevronRight,
  Eye,
  Calendar,
  Printer,
  Target,
  ArrowUpRight,
  CheckSquare,
  X,
  FileText,
  UserPlus,
  Compass,
} from 'lucide-react';
import { AppData, ExamKey, Standard, Student } from '../types';
import {
  calculateFinalStudentResult,
  calculateExamSummary,
  computeClassMeritList,
  getGradeFromPercentage,
} from '../utils/calculations';

interface DashboardProps {
  appData: AppData;
  onNavigate: (tab: any, standard?: Standard) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ appData, onNavigate }) => {
  const { students, subjects, marks, settings } = appData;

  // 1. Interactive States
  const [selectedStandard, setSelectedStandard] = useState<'all' | Standard>('all');
  const [selectedDivision, setSelectedDivision] = useState<'all' | 'A' | 'B' | 'C' | 'D'>('all');
  const [selectedExamView, setSelectedExamView] = useState<'overall' | ExamKey>('overall');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabLeaderboard, setActiveTabLeaderboard] = useState<'toppers' | 'remedial'>('toppers');
  const [selectedGradeForModal, setSelectedGradeForModal] = useState<string | null>(null);

  // Interactive Target Simulator state
  const [simulatedPassingPct, setSimulatedPassingPct] = useState<number>(settings.passingPercentage || 33);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // 2. Filter students based on standard & division
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchStd = selectedStandard === 'all' || s.standard === selectedStandard;
      const matchDiv = selectedDivision === 'all' || s.division === selectedDivision;
      return matchStd && matchDiv;
    });
  }, [students, selectedStandard, selectedDivision]);

  // 3. Compute student results based on selected standard and simulated passing percentage
  const studentResults = useMemo(() => {
    const customSettings = {
      ...settings,
      passingPercentage: simulatedPassingPct,
    };
    return filteredStudents.map((st) =>
      calculateFinalStudentResult(st, subjects, marks, customSettings)
    );
  }, [filteredStudents, subjects, marks, settings, simulatedPassingPct]);

  // 4. Compute Exam-Specific Summaries if an individual exam view is selected
  const examSummaries = useMemo(() => {
    if (selectedExamView === 'overall') return [];
    return filteredStudents.map((st) =>
      calculateExamSummary(st, subjects, marks, selectedExamView as any, simulatedPassingPct)
    );
  }, [filteredStudents, subjects, marks, selectedExamView, simulatedPassingPct]);

  // 5. Key Performance Metrics Calculation
  const totalStudents = filteredStudents.length;

  const enteredStudentsCount = useMemo(() => {
    if (selectedExamView === 'overall') {
      return studentResults.filter((r) => r.totalObtained > 0).length;
    }
    return examSummaries.filter((r) => r.totalObtained > 0).length;
  }, [selectedExamView, studentResults, examSummaries]);

  const passedStudentsCount = useMemo(() => {
    if (selectedExamView === 'overall') {
      return studentResults.filter((r) => r.status === 'પાસ').length;
    }
    return examSummaries.filter((r) => r.status === 'પાસ').length;
  }, [selectedExamView, studentResults, examSummaries]);

  const failedStudentsCount = useMemo(() => {
    if (selectedExamView === 'overall') {
      return studentResults.filter((r) => r.status === 'નાપાસ').length;
    }
    return examSummaries.filter((r) => r.status === 'નાપાસ').length;
  }, [selectedExamView, studentResults, examSummaries]);

  const completionPct =
    totalStudents > 0 ? Math.round((enteredStudentsCount / totalStudents) * 100) : 0;

  const passPct =
    enteredStudentsCount > 0 ? Math.round((passedStudentsCount / enteredStudentsCount) * 100) : 0;

  const averagePercentage = useMemo(() => {
    if (selectedExamView === 'overall') {
      const active = studentResults.filter((r) => r.totalObtained > 0);
      if (active.length === 0) return 0;
      const sum = active.reduce((acc, r) => acc + r.percentage, 0);
      return Number((sum / active.length).toFixed(1));
    } else {
      const active = examSummaries.filter((r) => r.totalObtained > 0);
      if (active.length === 0) return 0;
      const sum = active.reduce((acc, r) => acc + r.percentage, 0);
      return Number((sum / active.length).toFixed(1));
    }
  }, [selectedExamView, studentResults, examSummaries]);

  // 6. Toppers and Merit List
  const meritList = useMemo(() => {
    return computeClassMeritList(studentResults);
  }, [studentResults]);

  const topRankers = useMemo(() => meritList.slice(0, 5), [meritList]);

  // Students requiring remedial guidance
  const remedialStudents = useMemo(() => {
    return studentResults
      .filter((r) => r.totalObtained > 0 && (r.status === 'નાપાસ' || r.percentage < 45))
      .sort((a, b) => a.percentage - b.percentage);
  }, [studentResults]);

  // 7. Grade Distribution Calculation
  const gradeDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0,
      C1: 0,
      C2: 0,
      D: 0,
      E: 0,
    };
    for (const r of studentResults) {
      if (r.totalObtained > 0 && r.grade && counts[r.grade] !== undefined) {
        counts[r.grade]++;
      }
    }
    return counts;
  }, [studentResults]);

  // Students belonging to the clicked grade for the interactive modal
  const studentsInSelectedGrade = useMemo(() => {
    if (!selectedGradeForModal) return [];
    return studentResults.filter((r) => r.grade === selectedGradeForModal && r.totalObtained > 0);
  }, [selectedGradeForModal, studentResults]);

  // 8. Subject-wise Performance for filtered students
  const subjectPerformance = useMemo(() => {
    const applicableSubjects = subjects.filter((s) => {
      if (selectedStandard === 'all') return true;
      return s.standards.includes(selectedStandard);
    });

    return applicableSubjects.map((sub) => {
      let subSum = 0;
      let count = 0;
      let highest = 0;

      for (const r of studentResults) {
        const found = r.subjectWise.find((sw) => sw.subjectId === sub.id);
        if (found && found.totalMax > 0 && found.totalObtained > 0) {
          subSum += found.percentage;
          count++;
          if (found.totalObtained > highest) {
            highest = found.totalObtained;
          }
        }
      }

      const avg = count > 0 ? Math.round(subSum / count) : 0;
      return {
        id: sub.id,
        name: sub.name,
        averagePct: avg,
        studentsCount: count,
        highestMarks: highest,
      };
    });
  }, [subjects, selectedStandard, studentResults]);

  // 9. Live Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return studentResults.filter(
      (r) =>
        r.student.name.toLowerCase().includes(q) ||
        r.student.grNumber.toLowerCase().includes(q) ||
        String(r.student.rollNumber).includes(q)
    );
  }, [searchQuery, studentResults]);

  // Standard-wise breakdown summary
  const standardsSummary = [6, 7, 8].map((std) => {
    const stdStudents = students.filter((s) => s.standard === std);
    const stdResults = studentResults.filter((r) => r.student.standard === std && r.totalObtained > 0);
    const stdPassed = stdResults.filter((r) => r.status === 'પાસ').length;
    const stdAvg =
      stdResults.length > 0
        ? Math.round(stdResults.reduce((sum, r) => sum + r.percentage, 0) / stdResults.length)
        : 0;
    return {
      std: std as Standard,
      total: stdStudents.length,
      entered: stdResults.length,
      passed: stdPassed,
      avg: stdAvg,
    };
  });

  return (
    <div className="space-y-6">
      {/* 1. INTERACTIVE HERO & WORKSPACE HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-500/15 card-3d">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black text-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                શૈક્ષણિક મૂલ્યાંકન સત્ર {settings.academicYear}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                ધોરણ ૬ થી ૮ સર્વગ્રાહી પરિણામ
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-heading">
              {settings.schoolName || 'શ્રી ભીખાપુરા પ્રાથમિક શાળા'}
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              વિદ્યાર્થીઓની ગુણ નોંધણી, પત્રક A (૨૦ ખાના - ૪૦ ગુણ), પત્રક B (૪૦૦ ગુણ), મેરિટ લેજર અને પ્રગતિ પત્રકનું
              આધુનિક ઇન્ટરેક્ટિવ સંચાલન.
            </p>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('marks', selectedStandard === 'all' ? 8 : selectedStandard)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 font-black text-xs sm:text-sm rounded-xl hover:from-amber-300 hover:to-yellow-300 shadow-md shadow-amber-500/20 transition-all cursor-pointer btn-3d"
            >
              <CheckSquare className="w-4 h-4" />
              <span>ગુણ નોંધણી</span>
            </button>
            <button
              onClick={() => onNavigate('patrakA', selectedStandard === 'all' ? 8 : selectedStandard)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/30 backdrop-blur-md transition-all cursor-pointer btn-3d"
            >
              <span>પત્રક A</span>
            </button>
            <button
              onClick={() => onNavigate('patrakB', selectedStandard === 'all' ? 8 : selectedStandard)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/30 backdrop-blur-md transition-all cursor-pointer btn-3d"
            >
              <span>પત્રક B</span>
            </button>
            <button
              onClick={() => onNavigate('result', selectedStandard === 'all' ? 8 : selectedStandard)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/30 backdrop-blur-md transition-all cursor-pointer btn-3d"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>મેરિટ લેજર</span>
            </button>
          </div>
        </div>

        {/* Quick Search Student Jump Bar */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/15">
          <div className="max-w-xl relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="કોઈપણ વિદ્યાર્થી શોધો (નામ, રોલ નંબર અથવા જી.આર. નંબર)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white/95 text-slate-900 placeholder:text-slate-500 rounded-xl text-xs sm:text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-yellow-400 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Live Search Results Popup */}
            {searchQuery && (
              <div className="absolute left-0 right-0 mt-2 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 max-h-72 overflow-y-auto z-50 p-2 divide-y divide-slate-100">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    આ નામ અથવા નંબર વાળો કોઈ વિદ્યાર્થી મળ્યો નથી.
                  </div>
                ) : (
                  searchResults.slice(0, 6).map((res) => (
                    <div
                      key={res.student.id}
                      className="p-2.5 hover:bg-blue-50/70 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer"
                      onClick={() => {
                        onNavigate('reportCard');
                      }}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {res.student.name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>ધો. {res.student.standard}-{res.student.division}</span>
                          <span>•</span>
                          <span>રોલ નં: {res.student.rollNumber}</span>
                          <span>•</span>
                          <span>GR: {res.student.grNumber}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-lg border ${
                            res.status === 'પાસ'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          {res.percentage}% ({res.grade})
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('reportCard');
                          }}
                          className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          title="રિપોર્ટ કાર્ડ જુઓ"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE FILTER CONTROLS BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Standard Selector Segmented Control */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> ધોરણ પસંદ કરો:
          </span>
          <button
            onClick={() => setSelectedStandard('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedStandard === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            તમામ ધોરણ ({students.length})
          </button>
          {[6, 7, 8].map((std) => {
            const count = students.filter((s) => s.standard === std).length;
            const isSelected = selectedStandard === std;
            return (
              <button
                key={std}
                onClick={() => setSelectedStandard(std as Standard)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                ધોરણ {std} ({count})
              </button>
            );
          })}
        </div>

        {/* Exam Focus Filter & Target Simulator Trigger */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 px-2">કસોટી વ્યૂ:</span>
            <select
              value={selectedExamView}
              onChange={(e) => setSelectedExamView(e.target.value as any)}
              className="bg-white border border-slate-300 rounded-lg text-xs font-semibold px-2.5 py-1 text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="overall">વાર્ષિક સંકલિત (Overall)</option>
              <option value="quarterly1">પ્રથમ ત્રિમાસિક (૪૦ ગુણ)</option>
              <option value="quarterly2">બીજી ત્રિમાસિક (૪૦ ગુણ)</option>
              <option value="sem1">સત્ર ૧ પરીક્ષા (૮૦ ગુણ)</option>
              <option value="sem2">સત્ર ૨ પરીક્ષા (૮૦ ગુણ)</option>
              <option value="assignment">સ્વાધ્યાય / પ્રોજેક્ટ (૨૦ ગુણ)</option>
            </select>
          </div>

          {/* Interactive Passing Simulator Button */}
          <button
            onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isSimulatorOpen || simulatedPassingPct !== (settings.passingPercentage || 33)
                ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            <span>પાસિંગ સિમ્યુલેટર ({simulatedPassingPct}%)</span>
          </button>
        </div>
      </div>

      {/* 3. EXPANDABLE PASSING TARGET SIMULATOR WIDGET */}
      {isSimulatorOpen && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-700" />
              <div>
                <h4 className="font-bold text-amber-950 text-sm">
                  ઇન્ટરેક્ટિવ પાસિંગ ટકાવારી સિમ્યુલેટર (What-If Analysis)
                </h4>
                <p className="text-xs text-amber-800">
                  પાસિંગ ટકાવારી બદલીને તાત્કાલિક ચકાસો કે કેટલા વિદ્યાર્થીઓ પાસ થશે.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSimulatedPassingPct(settings.passingPercentage || 33);
                setIsSimulatorOpen(false);
              }}
              className="text-xs text-amber-800 hover:text-amber-950 font-semibold underline cursor-pointer"
            >
              રીસેટ (33% મૂળભૂત)
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <div className="w-full sm:w-2/3 flex items-center gap-3">
              <span className="text-xs font-bold text-amber-900">30%</span>
              <input
                type="range"
                min="30"
                max="50"
                step="1"
                value={simulatedPassingPct}
                onChange={(e) => setSimulatedPassingPct(Number(e.target.value))}
                className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <span className="text-xs font-bold text-amber-900">50%</span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-black text-amber-950 bg-white px-3 py-1 rounded-xl border border-amber-300">
                લક્ષ્યાંક: {simulatedPassingPct}%
              </span>
              <span className="text-xs text-emerald-800 font-bold bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-300">
                પાસ: {passedStudentsCount} ({passPct}%)
              </span>
              <span className="text-xs text-rose-800 font-bold bg-rose-100 px-2.5 py-1 rounded-xl border border-rose-300">
                નાપાસ: {failedStudentsCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. DYNAMIC INTERACTIVE KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Students */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 rounded-3xl shadow-lg shadow-blue-500/10 card-3d flex flex-col justify-between cursor-pointer group hover:scale-[1.01] transition-all"
        >
          <div className="flex items-center justify-between text-blue-100 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">
              {selectedStandard === 'all' ? 'કુલ વિદ્યાર્થીઓ' : `ધોરણ ${selectedStandard} વિદ્યાર્થી`}
            </span>
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl group-hover:bg-white/30 transition-colors">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-heading mt-1">{totalStudents}</div>
          <div className="text-xs text-blue-100 mt-2 flex items-center justify-between font-semibold">
            <span>વિદ્યાર્થી સંચાલન ખોલો</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 2: Completion Rate */}
        <div
          onClick={() => onNavigate('marks', selectedStandard === 'all' ? 8 : selectedStandard)}
          className="bg-gradient-to-br from-purple-600 to-pink-700 text-white p-5 rounded-3xl shadow-lg shadow-purple-500/10 card-3d flex flex-col justify-between cursor-pointer group hover:scale-[1.01] transition-all"
        >
          <div className="flex items-center justify-between text-purple-100 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">ગુણ નોંધણી દર</span>
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl group-hover:bg-white/30 transition-colors">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-heading mt-1">{completionPct}%</div>
          <div className="w-full bg-black/20 h-2 rounded-full mt-2 overflow-hidden border border-white/20">
            <div
              className="bg-yellow-300 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="text-[11px] text-purple-100 mt-1 font-semibold flex items-center justify-between">
            <span>{enteredStudentsCount} / {totalStudents} ગુણ નોંધાયા</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Pass Rate */}
        <div
          onClick={() => onNavigate('result', selectedStandard === 'all' ? 8 : selectedStandard)}
          className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-3xl shadow-lg shadow-emerald-500/10 card-3d flex flex-col justify-between cursor-pointer group hover:scale-[1.01] transition-all"
        >
          <div className="flex items-center justify-between text-emerald-100 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">પાસ વિદ્યાર્થીઓ</span>
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl group-hover:bg-white/30 transition-colors">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-heading mt-1">
            {passedStudentsCount} <span className="text-xl font-normal text-emerald-200">({passPct}%)</span>
          </div>
          <div className="text-xs text-emerald-100 mt-2 font-semibold flex items-center justify-between">
            <span>નાપાસ / સુધારણા: {failedStudentsCount}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: Average Marks */}
        <div
          onClick={() => onNavigate('result', selectedStandard === 'all' ? 8 : selectedStandard)}
          className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-5 rounded-3xl shadow-lg shadow-amber-500/10 card-3d flex flex-col justify-between cursor-pointer group hover:scale-[1.01] transition-all"
        >
          <div className="flex items-center justify-between text-amber-100 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">વર્ગ સરેરાશ ટકા</span>
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl group-hover:bg-white/30 transition-colors">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black font-heading mt-1">{averagePercentage}%</div>
          <div className="text-xs text-amber-100 mt-2 font-semibold flex items-center justify-between">
            <span>પાસિંગ કટ-ઓફ: {simulatedPassingPct}%</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE GRADE DISTRIBUTION VISUALIZER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              ગ્રેડ વાઇઝ પૃથ્થકરણ (Interactive Grade Distribution)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              કોઈપણ ગ્રેડ બોક્સ પર ક્લિક કરીને તે ગ્રેડ મેળવનાર તમામ વિદ્યાર્થીઓની યાદી જુઓ.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            કુલ મૂલ્યાંકિત વિદ્યાર્થીઓ: {enteredStudentsCount}
          </span>
        </div>

        {/* Interactive Grade Boxes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {[
            { grade: 'A1', min: '91%+', color: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
            { grade: 'A2', min: '81-90%', color: 'bg-teal-500', light: 'bg-teal-50 text-teal-800 border-teal-300' },
            { grade: 'B1', min: '71-80%', color: 'bg-blue-500', light: 'bg-blue-50 text-blue-800 border-blue-300' },
            { grade: 'B2', min: '61-70%', color: 'bg-indigo-500', light: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
            { grade: 'C1', min: '51-60%', color: 'bg-amber-500', light: 'bg-amber-50 text-amber-800 border-amber-300' },
            { grade: 'C2', min: '41-50%', color: 'bg-orange-500', light: 'bg-orange-50 text-orange-800 border-orange-300' },
            { grade: 'D', min: '33-40%', color: 'bg-yellow-500', light: 'bg-yellow-50 text-yellow-800 border-yellow-300' },
            { grade: 'E', min: '0-32%', color: 'bg-rose-500', light: 'bg-rose-50 text-rose-800 border-rose-300' },
          ].map((item) => {
            const count = gradeDistribution[item.grade] || 0;
            const pct = enteredStudentsCount > 0 ? Math.round((count / enteredStudentsCount) * 100) : 0;
            const isSelected = selectedGradeForModal === item.grade;

            return (
              <button
                key={item.grade}
                onClick={() => setSelectedGradeForModal(item.grade)}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'ring-2 ring-blue-600 shadow-md bg-blue-50/50'
                    : 'bg-slate-50 hover:bg-white hover:border-blue-400 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className={`px-2 py-0.5 rounded-lg border font-black ${item.light}`}>
                    {item.grade}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">{item.min}</span>
                </div>

                <div className="my-2">
                  <div className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    {count}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold">{pct}% વિદ્યાર્થી</div>
                </div>

                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. INTERACTIVE LEADERBOARD VS REMEDIAL STUDENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Interactive Merit List / Remedial Tabs */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            {/* Tab switch */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setActiveTabLeaderboard('toppers')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTabLeaderboard === 'toppers'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>મેરિટ ટોપર્સ (Top Performers)</span>
              </button>

              <button
                onClick={() => setActiveTabLeaderboard('remedial')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTabLeaderboard === 'remedial'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>વિશેષ માર્ગદર્શન પાત્ર ({remedialStudents.length})</span>
              </button>
            </div>

            <button
              onClick={() => onNavigate('result', selectedStandard === 'all' ? 8 : selectedStandard)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              સંપૂર્ણ લેજર જુઓ <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tab 1: Toppers */}
          {activeTabLeaderboard === 'toppers' && (
            <div className="space-y-2.5">
              {topRankers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">હજુ ગુણ નોંધાયા નથી.</div>
              ) : (
                topRankers.map((ranker, idx) => (
                  <div
                    key={ranker.student.id}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                          idx === 0
                            ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950'
                            : idx === 1
                            ? 'bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-800 border border-slate-300'
                            : idx === 2
                            ? 'bg-gradient-to-tr from-amber-700 to-amber-600 text-white'
                            : 'bg-slate-100 text-slate-600 font-bold'
                        }`}
                      >
                        {ranker.rank || idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {ranker.student.name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>ધોરણ {ranker.student.standard}-{ranker.student.division}</span>
                          <span>•</span>
                          <span>રોલ નં: {ranker.student.rollNumber}</span>
                          <span>•</span>
                          <span>મેળવેલ ગુણ: <strong>{ranker.totalObtained}</strong> / {ranker.totalMax}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-black text-base text-blue-700">{ranker.percentage}%</div>
                        <div className="text-[10px] font-bold text-emerald-700">ગ્રેડ {ranker.grade}</div>
                      </div>
                      <button
                        onClick={() => onNavigate('reportCard')}
                        className="p-2 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl transition-all cursor-pointer"
                        title="રિપોર્ટ કાર્ડ જુઓ"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Remedial / Needs Support */}
          {activeTabLeaderboard === 'remedial' && (
            <div className="space-y-2.5">
              {remedialStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-emerald-600 font-semibold bg-emerald-50/50 rounded-2xl border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  અભિનંદન! પસંદ કરેલ ધોરણમાં તમામ વિદ્યાર્થીઓ પાસિંગ ધોરણ પાર કરી ચૂક્યા છે.
                </div>
              ) : (
                remedialStudents.slice(0, 5).map((rem) => (
                  <div
                    key={rem.student.id}
                    className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-slate-900 truncate flex items-center gap-2">
                        <span>{rem.student.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300">
                          {rem.status} ({rem.percentage}%)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-2 mt-1 flex-wrap">
                        <span>ધો. {rem.student.standard}-{rem.student.division}</span>
                        <span>•</span>
                        <span>રોલ નં: {rem.student.rollNumber}</span>
                        {rem.failingSubjects.length > 0 && (
                          <span className="text-rose-700 font-medium">
                            વિશેષ ધ્યાન: {rem.failingSubjects.slice(0, 2).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onNavigate('marks', rem.student.standard)}
                        className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        ગુણ ચકાસો
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Standard-Wise Progress Cards */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">ધોરણવાર વિહંગાવલોકન</h3>
                <p className="text-xs text-slate-500">ધોરણ ૬, ૭ અને ૮ ની સરખામણી</p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {standardsSummary.map((item) => (
                <div
                  key={item.std}
                  onClick={() => {
                    setSelectedStandard(item.std);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedStandard === item.std
                      ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-300'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm text-slate-900">ધોરણ {item.std}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {item.total} વિદ્યાર્થી
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>પાસ થયેલ:</span>
                      <strong className="text-emerald-700">{item.passed} વિદ્યાર્થી</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>સરેરાશ ટકા:</span>
                      <strong className="text-slate-900">{item.avg}%</strong>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${item.total > 0 ? (item.entered / item.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Print Ledger Button */}
          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('result', selectedStandard === 'all' ? 8 : selectedStandard)}
              className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>સંપૂર્ણ પરિણામ પત્રક (લેજર) પ્રિન્ટ કરો</span>
            </button>
          </div>
        </div>
      </div>

      {/* 7. INTERACTIVE SUBJECT PERFORMANCE GRID */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              વિષયવાર સરેરાશ પ્રદર્શન (Subject Performance Analysis)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              દરેક વિષયના ગુણ અને ટકાવારી. વિષય પર ક્લિક કરીને સીધા તેના ગુણ નોંધો.
            </p>
          </div>
          <button
            onClick={() => onNavigate('marks', selectedStandard === 'all' ? 8 : selectedStandard)}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
          >
            તમામ વિષયોના ગુણ ભરો →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {subjectPerformance.map((sub) => (
            <div
              key={sub.id}
              onClick={() => onNavigate('marks', selectedStandard === 'all' ? 8 : selectedStandard)}
              className="p-4 bg-slate-50 hover:bg-white hover:border-blue-400 hover:shadow-xs border border-slate-200 rounded-2xl transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-blue-600 transition-colors truncate" title={sub.name}>
                  {sub.name}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {sub.studentsCount} વિદ્યાર્થી
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-2">
                <div>
                  <span className="text-2xl font-black text-slate-900">{sub.averagePct}%</span>
                  <span className="text-[11px] text-slate-500 ml-1">સરેરાશ</span>
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold">
                  ટોપ: {sub.highestMarks} ગુણ
                </div>
              </div>

              <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    sub.averagePct >= 70
                      ? 'bg-emerald-500'
                      : sub.averagePct >= 50
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, sub.averagePct)}%` }}
                />
              </div>

              <div className="mt-3 text-[11px] font-semibold text-blue-600 flex items-center justify-between group-hover:translate-x-0.5 transition-transform">
                <span>ગુણ નોંધણી ખોલો</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. INTERACTIVE MODAL FOR GRADE-SPECIFIC STUDENTS LIST */}
      {selectedGradeForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl font-black text-base bg-blue-100 text-blue-800 border border-blue-300">
                  ગ્રેડ {selectedGradeForModal}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    ગ્રેડ {selectedGradeForModal} મેળવનાર વિદ્યાર્થીઓ
                  </h3>
                  <p className="text-xs text-slate-500">
                    કુલ {studentsInSelectedGrade.length} વિદ્યાર્થી
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGradeForModal(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto space-y-2 flex-1 pr-1 divide-y divide-slate-100">
              {studentsInSelectedGrade.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  આ ગ્રેડમાં કોઈ વિદ્યાર્થી નથી.
                </div>
              ) : (
                studentsInSelectedGrade.map((res) => (
                  <div
                    key={res.student.id}
                    className="pt-2.5 pb-2 flex items-center justify-between gap-3 hover:bg-slate-50 p-2 rounded-xl transition-colors"
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">
                        {res.student.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>ધો. {res.student.standard}-{res.student.division}</span>
                        <span>•</span>
                        <span>રોલ નં: {res.student.rollNumber}</span>
                        <span>•</span>
                        <span>મેળવેલ: <strong>{res.totalObtained}</strong> / {res.totalMax}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="font-black text-sm text-blue-700">{res.percentage}%</span>
                      <button
                        onClick={() => {
                          setSelectedGradeForModal(null);
                          onNavigate('reportCard');
                        }}
                        className="p-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="રિપોર્ટ કાર્ડ જુઓ"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedGradeForModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                બંધ કરો
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
