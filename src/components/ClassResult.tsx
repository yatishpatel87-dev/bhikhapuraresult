import React, { useState } from 'react';
import {
  Trophy,
  Download,
  Printer,
  Sparkles,
  LayoutGrid,
  Table,
  Medal,
  Award,
  Crown,
  CheckCircle2,
  AlertCircle,
  FileText,
  Flame,
} from 'lucide-react';
import { AppData, Standard } from '../types';
import { calculateFinalStudentResult, computeClassMeritList } from '../utils/calculations';
import { PrintModal } from './PrintModal';
import {
  triggerBrowserPrint,
  buildClassLedgerPrintHtml,
  downloadPrintableHtml,
} from '../utils/printHelper';

interface ClassResultProps {
  appData: AppData;
  onNavigateToReport: (studentId: string) => void;
  initialStandard?: Standard;
}

// Subject distinctive color palettes for high-energy colorful display
const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  sub_guj: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', gradient: 'from-amber-500 to-orange-500' },
  sub_hin: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-300', gradient: 'from-rose-500 to-red-500' },
  sub_eng: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-300', gradient: 'from-sky-500 to-blue-600' },
  sub_math: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-300', gradient: 'from-indigo-600 to-purple-600' },
  sub_sci: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', gradient: 'from-emerald-500 to-teal-600' },
  sub_ss: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300', gradient: 'from-orange-500 to-amber-600' },
  sub_sans: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300', gradient: 'from-purple-500 to-pink-500' },
  sub_art: { bg: 'bg-pink-50', text: 'text-pink-800', border: 'border-pink-300', gradient: 'from-pink-500 to-rose-500' },
};

export const ClassResult: React.FC<ClassResultProps> = ({
  appData,
  onNavigateToReport,
  initialStandard,
}) => {
  const [selectedStandard, setSelectedStandard] = useState<Standard>(initialStandard || 8);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'merit' | 'roll'>('merit');
  const [displayMode, setDisplayMode] = useState<'3d_cards' | 'table'>('3d_cards');

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filter students
  const classStudents = appData.students
    .filter((s) => s.standard === selectedStandard)
    .filter((s) => (selectedDivision === 'all' ? true : s.division === selectedDivision));

  const subjects = appData.subjects.filter((s) => s.standards.includes(selectedStandard));

  // Compute final results
  const rawResults = classStudents.map((st) =>
    calculateFinalStudentResult(st, appData.subjects, appData.marks, appData.settings)
  );

  const meritRankedResults = computeClassMeritList(rawResults);

  const displayedResults =
    sortBy === 'merit'
      ? meritRankedResults
      : [...meritRankedResults].sort((a, b) => a.student.rollNumber - b.student.rollNumber);

  // Top 3 Podium Students
  const top1 = meritRankedResults.find((r) => r.rank === 1);
  const top2 = meritRankedResults.find((r) => r.rank === 2);
  const top3 = meritRankedResults.find((r) => r.rank === 3);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'મેરિટ ક્રમ',
      'રોલ નં',
      'GR નંબર',
      'વિદ્યાર્થીનું નામ',
      'ધોરણ-વર્ગ',
      ...subjects.map((s) => s.name),
      'કુલ મેળવેલા',
      'કુલ મહત્તમ',
      'ટકાવારી (%)',
      'ગ્રેડ',
      'પરિણામ સ્થિતિ',
    ];

    const rows = displayedResults.map((r) => [
      r.rank || '-',
      r.student.rollNumber,
      `"${r.student.grNumber}"`,
      `"${r.student.name}"`,
      `"${r.student.standard}-${r.student.division}"`,
      ...subjects.map((sub) => {
        const sw = r.subjectWise.find((x) => x.subjectId === sub.id);
        return sw ? sw.totalObtained : '-';
      }),
      r.totalObtained,
      r.totalMax,
      r.percentage,
      r.grade,
      r.status,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shri_bhikhapura_dhoran_${selectedStandard}_parinam.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    setDisplayMode('table');
    setIsPrintModalOpen(true);
    triggerBrowserPrint();
  };

  const handleDownloadLedgerHtml = () => {
    const html = buildClassLedgerPrintHtml(appData, selectedStandard, selectedDivision);
    const fileName = `${appData.settings.schoolName || 'School'}_Std${selectedStandard}_Class_Ledger`;
    downloadPrintableHtml(
      `ધોરણ ${selectedStandard} પરિણામ લેજર પત્રક`,
      html,
      fileName,
      'landscape'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with 3D Pop Gradient & Controls */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-500/15 no-print card-3d">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/20">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black tracking-wide text-amber-200 mb-2 badge-3d">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> કલરફુલ 3D પોપ પરિણામ પ્રણાલી
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-heading flex items-center gap-2">
              <Trophy className="w-7 h-7 text-yellow-300 animate-bounce" /> સમગ્ર પરિણામ & 3D મેરિટ લિસ્ટ
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm mt-1">
              ધોરણ {selectedStandard} {selectedDivision !== 'all' ? `(વર્ગ ${selectedDivision})` : ''} • પદ્ધતિ: <span className="font-bold underline decoration-yellow-300">{displayedResults[0]?.calculationMethod || 'વાર્ષિક સંકલિત'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View Mode Toggle: 3D Pop vs Table */}
            <div className="bg-black/25 backdrop-blur-md p-1 rounded-2xl flex items-center gap-1 border border-white/20">
              <button
                onClick={() => setDisplayMode('3d_cards')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  displayMode === '3d_cards'
                    ? 'bg-white text-indigo-950 shadow-md transform -translate-y-0.5'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
                <span>3D Pop કાર્ડ્સ</span>
              </button>
              <button
                onClick={() => setDisplayMode('table')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  displayMode === 'table'
                    ? 'bg-white text-indigo-950 shadow-md transform -translate-y-0.5'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5 text-indigo-600" />
                <span>લેજર ટેબલ</span>
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs font-bold rounded-xl transition-all cursor-pointer btn-3d"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/30 transition-all cursor-pointer btn-3d"
            >
              <Printer className="w-4 h-4" />
              <span>Print લેજર</span>
            </button>
          </div>
        </div>

        {/* Filters and Sorting Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 text-slate-800">
          <div>
            <label className="block text-xs font-black text-white/90 mb-1">૧. ધોરણ પસંદ કરો:</label>
            <div className="grid grid-cols-3 gap-1.5 bg-black/20 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
              {([6, 7, 8] as const).map((std) => (
                <button
                  key={std}
                  onClick={() => setSelectedStandard(std)}
                  className={`py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    selectedStandard === std
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 shadow-md transform -translate-y-0.5'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  ધોરણ {std}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-white/90 mb-1">૨. વર્ગ પસંદ કરો:</label>
            <div className="grid grid-cols-3 gap-1.5 bg-black/20 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
              {(['all', 'A', 'B'] as const).map((div) => (
                <button
                  key={div}
                  onClick={() => setSelectedDivision(div)}
                  className={`py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    selectedDivision === div
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 shadow-md transform -translate-y-0.5'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  {div === 'all' ? 'બધા' : `વર્ગ ${div}`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-white/90 mb-1">૩. ક્રમ ગોઠવો (Sorting):</label>
            <div className="grid grid-cols-2 gap-1.5 bg-black/20 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
              <button
                onClick={() => setSortBy('merit')}
                className={`py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  sortBy === 'merit'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 shadow-md transform -translate-y-0.5'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                🏆 ટકાવારી (મેરિટ)
              </button>
              <button
                onClick={() => setSortBy('roll')}
                className={`py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  sortBy === 'roll'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 shadow-md transform -translate-y-0.5'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                🔢 રોલ નંબર
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3D POP PODIUM: TOP 3 RANKERS CELEBRATION */}
      {top1 && sortBy === 'merit' && (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border-2 border-indigo-100 shadow-xl shadow-indigo-500/5 no-print card-3d">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
              <Crown className="w-3.5 h-3.5 text-amber-600" /> ધોરણ {selectedStandard} ના ટોપ ૩ વિદ્યાર્થીઓ (3D પોડિયમ)
            </span>
            <h3 className="text-xl sm:text-2xl font-black font-heading text-slate-800 mt-1">
              સર્વોચ્ચ તેજસ્વી તારલાઓ
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto">
            {/* Rank 2 - Silver */}
            {top2 ? (
              <div className="order-2 md:order-1 bg-gradient-to-b from-slate-100 via-slate-50 to-white p-5 rounded-3xl border-2 border-slate-300 shadow-lg text-center transform hover:-translate-y-2 transition-all card-3d">
                <div className="w-14 h-14 mx-auto -mt-10 mb-2 rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-200 border-2 border-white shadow-md flex items-center justify-center font-black text-slate-800 text-xl font-heading badge-3d">
                  ૨
                </div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-200 text-slate-700 mb-2">
                  સિલ્વર મેડલ (દ્વિતીય)
                </span>
                <div className="font-black text-slate-900 text-base font-heading truncate">
                  {top2.student.name}
                </div>
                <div className="text-xs text-slate-500 mb-3">
                  રોલ: {top2.student.rollNumber} • {top2.student.standard}-{top2.student.division}
                </div>
                <div className="bg-white/80 rounded-2xl p-2.5 border border-slate-200">
                  <div className="text-2xl font-black text-slate-700">{top2.percentage}%</div>
                  <div className="text-xs font-bold text-slate-500">
                    {top2.totalObtained} / {top2.totalMax} ગુણ (ગ્રેડ {top2.grade})
                  </div>
                </div>
                <button
                  onClick={() => onNavigateToReport(top2.student.id)}
                  className="mt-3 w-full py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  રિપોર્ટ કાર્ડ જુઓ →
                </button>
              </div>
            ) : <div className="order-2 md:order-1"></div>}

            {/* Rank 1 - Gold (Center, Elevated) */}
            <div className="order-1 md:order-2 bg-gradient-to-b from-amber-100 via-yellow-50 to-white p-6 rounded-3xl border-2 border-amber-400 shadow-2xl text-center transform md:-translate-y-4 hover:-translate-y-6 transition-all card-3d relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-amber-950 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" /> નંબર ૧ ટોપર
              </div>
              <div className="w-18 h-18 mx-auto -mt-6 mb-2 rounded-2xl bg-gradient-to-tr from-yellow-400 via-amber-300 to-yellow-200 border-4 border-white shadow-xl flex items-center justify-center font-black text-amber-950 text-2xl font-heading badge-3d">
                ૧
              </div>
              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-black bg-amber-200 text-amber-900 mb-2">
                🏆 સુવર્ણ પદક (પ્રથમ ક્રમ)
              </span>
              <div className="font-black text-slate-900 text-lg font-heading">
                {top1.student.name}
              </div>
              <div className="text-xs text-slate-600 mb-3 font-medium">
                રોલ: {top1.student.rollNumber} • {top1.student.standard}-{top1.student.division}
              </div>
              <div className="bg-amber-100/60 rounded-2xl p-3 border border-amber-300">
                <div className="text-3xl font-black text-amber-900">{top1.percentage}%</div>
                <div className="text-xs font-bold text-amber-800">
                  {top1.totalObtained} / {top1.totalMax} ગુણ (ગ્રેડ {top1.grade})
                </div>
              </div>
              <button
                onClick={() => onNavigateToReport(top1.student.id)}
                className="mt-3 w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl text-xs font-black shadow-md shadow-amber-500/30 transition-all cursor-pointer btn-3d"
              >
                ગોલ્ડ રિપોર્ટ કાર્ડ ખોલો ✨
              </button>
            </div>

            {/* Rank 3 - Bronze */}
            {top3 ? (
              <div className="order-3 bg-gradient-to-b from-orange-100 via-amber-50 to-white p-5 rounded-3xl border-2 border-orange-300 shadow-lg text-center transform hover:-translate-y-2 transition-all card-3d">
                <div className="w-14 h-14 mx-auto -mt-10 mb-2 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 border-2 border-white shadow-md flex items-center justify-center font-black text-white text-xl font-heading badge-3d">
                  ૩
                </div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black bg-orange-200 text-orange-900 mb-2">
                  કાંસ્ય પદક (તૃતીય)
                </span>
                <div className="font-black text-slate-900 text-base font-heading truncate">
                  {top3.student.name}
                </div>
                <div className="text-xs text-slate-500 mb-3">
                  રોલ: {top3.student.rollNumber} • {top3.student.standard}-{top3.student.division}
                </div>
                <div className="bg-white/80 rounded-2xl p-2.5 border border-orange-200">
                  <div className="text-2xl font-black text-orange-900">{top3.percentage}%</div>
                  <div className="text-xs font-bold text-orange-800">
                    {top3.totalObtained} / {top3.totalMax} ગુણ (ગ્રેડ {top3.grade})
                  </div>
                </div>
                <button
                  onClick={() => onNavigateToReport(top3.student.id)}
                  className="mt-3 w-full py-1.5 bg-orange-200 hover:bg-orange-300 text-orange-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  રિપોર્ટ કાર્ડ જુઓ →
                </button>
              </div>
            ) : <div className="order-3"></div>}
          </div>
        </div>
      )}

      {/* VIEW 1: 3D POP COLORFUL CARDS GRID */}
      {displayMode === '3d_cards' && (
        <div className="space-y-4 no-print">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black font-heading text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" /> તમામ વિદ્યાર્થીઓનું 3D કલરફુલ પરિણામ ({displayedResults.length} વિદ્યાર્થીઓ)
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              કાર્ડ પર ક્લિક કરી રિપોર્ટ કાર્ડ જુઓ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedResults.map((r, idx) => {
              const isPass = r.status === 'પાસ';
              const isTop3 = r.rank !== undefined && r.rank <= 3 && sortBy === 'merit';

              return (
                <div
                  key={r.student.id}
                  className={`bg-white rounded-3xl border-2 transition-all duration-300 card-3d overflow-hidden flex flex-col justify-between ${
                    isTop3
                      ? 'border-amber-400 ring-2 ring-amber-300/50 shadow-xl'
                      : isPass
                      ? 'border-slate-200 hover:border-indigo-400 hover:shadow-xl'
                      : 'border-rose-200 hover:border-rose-400'
                  }`}
                >
                  {/* Card Header with Vibrant Gradient Strip */}
                  <div
                    className={`p-4 text-white flex items-center justify-between ${
                      r.rank === 1
                        ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600'
                        : r.rank === 2
                        ? 'bg-gradient-to-r from-slate-600 via-slate-500 to-slate-700'
                        : r.rank === 3
                        ? 'bg-gradient-to-r from-amber-700 via-orange-600 to-amber-800'
                        : isPass
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'
                        : 'bg-gradient-to-r from-rose-600 to-red-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-black text-sm font-heading shadow-inner">
                        {sortBy === 'merit' && r.rank ? `#${r.rank}` : `R-${r.student.rollNumber}`}
                      </div>
                      <div>
                        <h4 className="font-black text-base font-heading leading-tight truncate max-w-[180px]">
                          {r.student.name}
                        </h4>
                        <div className="text-[11px] text-white/80">
                          રોલ: {r.student.rollNumber} • GR: {r.student.grNumber} • ધો. {r.student.standard}-{r.student.division}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white/20 backdrop-blur-md border border-white/30">
                        ગ્રેડ {r.grade}
                      </span>
                    </div>
                  </div>

                  {/* Card Body: Overall Score Box */}
                  <div className="p-4 space-y-3 flex-1">
                    <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-3 border border-slate-200">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 block">કુલ મેળવેલા ગુણ</span>
                        <div className="text-xl font-black text-slate-900 font-heading">
                          {r.totalObtained} <span className="text-xs text-slate-500 font-black">/ {r.totalMax}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-semibold text-slate-500 block">ટકાવારી</span>
                        <div className="text-2xl font-black text-indigo-700 font-heading">
                          {r.percentage}%
                        </div>
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black shadow-xs ${
                            isPass
                              ? 'bg-emerald-500 text-white'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          {isPass ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          {r.status}
                        </span>
                      </div>
                    </div>

                    {/* Mini Subject Badges - Colorful 3D Pill Display */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center justify-between">
                        <span>વિષયવાર ગુણ:</span>
                        <span className="text-[10px] text-slate-400">મેળવેલા ગુણ</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {subjects.map((sub) => {
                          const sw = r.subjectWise.find((x) => x.subjectId === sub.id);
                          const colorCfg = SUBJECT_COLORS[sub.id] || {
                            bg: 'bg-slate-50',
                            text: 'text-slate-800',
                            border: 'border-slate-200',
                            gradient: 'from-blue-500 to-indigo-500',
                          };
                          const subObt = sw ? sw.totalObtained : '-';
                          const isSubPass = sw ? sw.isPass : true;

                          return (
                            <div
                              key={sub.id}
                              className={`p-1.5 rounded-xl border text-center transition-all ${
                                isSubPass ? `${colorCfg.bg} ${colorCfg.border}` : 'bg-rose-50 border-rose-300'
                              }`}
                              title={`${sub.name}: ${subObt}`}
                            >
                              <div className="text-[10px] font-bold text-slate-600 truncate">
                                {sub.name.split(' ')[0]}
                              </div>
                              <div
                                className={`text-xs font-black font-heading mt-0.5 ${
                                  isSubPass ? colorCfg.text : 'text-rose-600'
                                }`}
                              >
                                {subObt}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Quick Button to Open Report Card */}
                  <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                      હાજરી: <strong>{r.student.attendance.presentDays}</strong>/{r.student.attendance.totalDays} દિવસ
                    </span>
                    <button
                      onClick={() => onNavigateToReport(r.student.id)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1 btn-3d"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>રિપોર્ટ કાર્ડ જુઓ</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: MASTER TABLE LEDGER (Always visible for Print or on Table Toggle) */}
      <div
        className={`bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden print:block ${
          displayMode === 'table' ? 'block' : 'hidden print:block'
        }`}
      >
        {/* Printable Header */}
        <div className="p-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-pink-50 border-b border-slate-200 print:bg-white print:border-b-2 print:border-black flex flex-col items-center justify-center text-center">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight font-heading">
            {appData.settings.schoolName}
          </h2>
          <div className="text-xs text-slate-600 font-bold mt-1">
            વાર્ષિક સર્વગ્રાહી પરિણામ પત્રક (માસ્ટર લેજર) • ધોરણ {selectedStandard} {selectedDivision !== 'all' ? `(વર્ગ ${selectedDivision})` : ''} • શૈક્ષણિક વર્ષ: {appData.settings.academicYear}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-black print:border-black">
                <th className="py-3 px-3 w-12 text-center">ક્રમ</th>
                <th className="py-3 px-3 w-12 text-center">રોલ</th>
                <th className="py-3 px-3 w-20">GR નં</th>
                <th className="py-3 px-3">વિદ્યાર્થીનું નામ</th>
                {subjects.map((sub) => {
                  const colorCfg = SUBJECT_COLORS[sub.id];
                  return (
                    <th
                      key={sub.id}
                      className={`py-3 px-2 text-center max-w-[90px] truncate ${colorCfg?.bg || ''}`}
                      title={sub.name}
                    >
                      {sub.name.split(' ')[0]}
                    </th>
                  );
                })}
                <th className="py-3 px-3 text-center bg-blue-100 font-black">કુલ ગુણ</th>
                <th className="py-3 px-3 text-center bg-indigo-100 font-black">ટકા (%)</th>
                <th className="py-3 px-3 text-center bg-purple-100 font-black">ગ્રેડ</th>
                <th className="py-3 px-3 text-center bg-emerald-100 font-black">પરિણામ</th>
                <th className="py-3 px-2 text-center no-print">કાર્ડ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-black">
              {displayedResults.length === 0 ? (
                <tr>
                  <td colSpan={8 + subjects.length} className="py-8 text-center text-slate-400">
                    આ વર્ગમાં કોઈ વિદ્યાર્થી નથી.
                  </td>
                </tr>
              ) : (
                displayedResults.map((r, idx) => (
                  <tr
                    key={r.student.id}
                    className={`hover:bg-indigo-50/30 transition-colors ${
                      idx < 3 && sortBy === 'merit' ? 'bg-amber-50/30 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center font-black">
                      {sortBy === 'merit' ? (
                        <span
                          className={`w-6 h-6 rounded-xl inline-flex items-center justify-center text-xs font-black shadow-xs ${
                            r.rank === 1
                              ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300'
                              : r.rank === 2
                              ? 'bg-slate-300 text-slate-900'
                              : r.rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'text-slate-600'
                          }`}
                        >
                          {r.rank}
                        </span>
                      ) : (
                        idx + 1
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-black text-slate-900 text-sm">
                      {r.student.rollNumber}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-xs text-slate-800">
                      {r.student.grNumber}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                      {r.student.name}
                    </td>

                    {/* Subject-wise Marks */}
                    {subjects.map((sub) => {
                      const sw = r.subjectWise.find((x) => x.subjectId === sub.id);
                      return (
                        <td key={sub.id} className="py-2.5 px-2 text-center font-mono font-bold text-sm">
                          {sw ? (
                            <span className={sw.isPass ? 'text-slate-800 font-bold' : 'text-rose-600 font-black'}>
                              {sw.totalObtained}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      );
                    })}

                    <td className="py-2.5 px-3 text-center font-black text-blue-950 bg-blue-50/50">
                      {r.totalObtained} / {r.totalMax}
                    </td>
                    <td className="py-2.5 px-3 text-center font-black text-indigo-700 bg-indigo-50/50">
                      {r.percentage}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black border ${r.gradeColor}`}>
                        {r.grade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          r.status === 'પાસ'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center no-print">
                      <button
                        onClick={() => onNavigateToReport(r.student.id)}
                        className="text-indigo-600 hover:text-indigo-900 font-black text-xs cursor-pointer underline"
                      >
                        કાર્ડ →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Print Signatures */}
        <div className="hidden print:flex justify-between items-end p-8 pt-16 text-xs text-black">
          <div className="text-center">
            <div className="w-36 border-t border-black mb-1"></div>
            <span>વર્ગ શિક્ષકની સહી</span>
          </div>
          <div className="text-center">
            <div className="w-36 border-t border-black mb-1"></div>
            <span>તપાસનાર શિક્ષકની સહી</span>
          </div>
          <div className="text-center">
            <div className="w-36 border-t border-black mb-1"></div>
            <span>આચાર્યશ્રીની સહી & સિક્કો</span>
          </div>
        </div>
      </div>

      {/* Print & Download Modal */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title={`ધોરણ ${selectedStandard} સમગ્ર પરિણામ પત્રક (લેજર)`}
        documentType="ledger"
        onDownloadHtml={handleDownloadLedgerHtml}
        orientation="landscape"
        description={`ધોરણ ${selectedStandard} ના કુલ ${classStudents.length} વિદ્યાર્થીઓનું વાર્ષિક પરિણામ લેજર ટેબલ (A4 આડું ફોર્મેટ).`}
      />
    </div>
  );
};
