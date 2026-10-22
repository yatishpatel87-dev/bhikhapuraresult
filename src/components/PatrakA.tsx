import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  CheckSquare,
  Sparkles,
  Zap,
  RotateCcw,
  LayoutGrid,
  Columns,
  Printer,
  Download,
  Check,
  HelpCircle,
} from 'lucide-react';
import { AppData, PatrakAItem, PatrakARecord, Standard } from '../types';
import { calculatePatrakASummary, getGradeFromPercentage } from '../utils/calculations';
import { PrintModal } from './PrintModal';
import {
  triggerBrowserPrint,
  buildPatrakAPrintHtml,
  downloadPrintableHtml,
} from '../utils/printHelper';

interface PatrakAProps {
  appData: AppData;
  onUpdateAppData: (data: AppData) => void;
  initialStandard?: Standard;
  onNavigate?: (tab: any, standard?: Standard) => void;
}

export const PatrakA: React.FC<PatrakAProps> = ({
  appData,
  onUpdateAppData,
  initialStandard,
  onNavigate,
}) => {
  const [selectedStandard, setSelectedStandard] = useState<Standard>(initialStandard || 8);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    appData.subjects[0]?.id || 'sub_guj'
  );
  const [viewMode, setViewMode] = useState<'bySubject' | 'allSubjectsStudent'>('bySubject');
  const [displayStyle, setDisplayStyle] = useState<'boxes_grid' | 'compact'>('boxes_grid');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [activeMarkingTool, setActiveMarkingTool] = useState<'✓' | '?' | 'cycle'>('✓');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bulkMarkA, setBulkMarkA] = useState<string>('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitToast, setSubmitToast] = useState<string | null>(null);
  const [submitStats, setSubmitStats] = useState<{
    totalStudents: number;
    evaluatedCount: number;
    totalBoxesChecked: number;
    standard: Standard;
    division: string;
    subjectName: string;
    timestamp: string;
  } | null>(null);

  const currentSubject = appData.subjects.find((s) => s.id === selectedSubjectId) || appData.subjects[0];
  const TOTAL_BOXES = 20; // ૨૦ ખાના
  const MARKS_PER_BOX = 2; // દરેક ખાનાના ૨ ગુણ
  const maxMarks = 40; // ૨૦ ખાના × ૨ = ૪૦ કુલ ગુણ

  const handlePrint = () => {
    setIsPrintModalOpen(true);
    triggerBrowserPrint();
  };

  const handleDownloadPatrakAHtml = () => {
    const html = buildPatrakAPrintHtml(appData, selectedStandard, selectedSubjectId, selectedDivision);
    const fileName = `${appData.settings.schoolName || 'School'}_Std${selectedStandard}_${currentSubject.name}_PatrakA`;
    downloadPrintableHtml(
      `ધોરણ ${selectedStandard} પત્રક A - ${currentSubject.name}`,
      html,
      fileName,
      'landscape'
    );
  };

  // SUBMIT PATRAK A HANDLER (પત્રક A સબમિટ અને સેવ બટન)
  const handleSubmitPatrakA = () => {
    setErrorMessage(null);
    let evaluatedCount = 0;
    let totalBoxes = 0;

    classStudents.forEach((st) => {
      const item = appData.patrakA[st.id]?.[selectedSubjectId];
      if (item?.marks !== undefined && item.marks > 0) {
        evaluatedCount++;
        const checkedCount = item.outcomes ? item.outcomes.filter(Boolean).length : Math.round(item.marks / MARKS_PER_BOX);
        totalBoxes += checkedCount;
      }
    });

    onUpdateAppData({ ...appData });

    const now = new Date();
    const timeStr = now.toLocaleTimeString('gu-IN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('gu-IN');

    setSubmitStats({
      totalStudents: classStudents.length,
      evaluatedCount,
      totalBoxesChecked: totalBoxes,
      standard: selectedStandard,
      division: selectedDivision,
      subjectName: currentSubject.name,
      timestamp: `${dateStr} ${timeStr}`,
    });

    setIsSubmitModalOpen(true);
    setSubmitToast(`ધોરણ ${selectedStandard} (${currentSubject.name}) પત્રક A સફળતાપૂર્વક સબમિટ થઈ ગયું છે!`);
    setTimeout(() => setSubmitToast(null), 4000);
  };

  // Filter students
  const classStudents = appData.students
    .filter((s) => s.standard === selectedStandard)
    .filter((s) => (selectedDivision === 'all' ? true : s.division === selectedDivision))
    .sort((a, b) => a.rollNumber - b.rollNumber);

  // Helper: get 20 outcome marks for a student and subject ('✓' = 2 marks, '?' = 0 marks, '' = 0 marks)
  const getOutcomes = (studentId: string, subjectId: string): ('✓' | '?' | '')[] => {
    const item = appData.patrakA[studentId]?.[subjectId];
    if (item?.outcomes && Array.isArray(item.outcomes) && item.outcomes.length === TOTAL_BOXES) {
      return item.outcomes.map((v) => {
        if (v === '✓' || v === true || v === 'check') return '✓';
        if (v === '?' || v === 'question') return '?';
        return '';
      });
    }
    // Backward compatibility if previous data had 40 outcomes
    if (item?.outcomes && Array.isArray(item.outcomes) && item.outcomes.length === 40) {
      const checked40 = item.outcomes.filter((v) => v === true || v === '✓' || v === 'check').length;
      const count20 = Math.min(TOTAL_BOXES, Math.round(checked40 / 2));
      return Array.from({ length: TOTAL_BOXES }, (_, idx) => (idx < count20 ? '✓' : '?'));
    }
    const currentM = item?.marks !== undefined ? item.marks : 0;
    const count20 = Math.min(TOTAL_BOXES, Math.round(currentM / MARKS_PER_BOX));
    return Array.from({ length: TOTAL_BOXES }, (_, idx) => (idx < count20 ? '✓' : ''));
  };

  // Toggle a single box based on the active marking tool ('✓' True, '?' Question, or 'cycle')
  const toggleBox = (
    studentId: string,
    subjectId: string,
    boxIndex: number,
    forcedSign?: '✓' | '?' | ''
  ) => {
    const currentOutcomes = [...getOutcomes(studentId, subjectId)];
    const currentSign = currentOutcomes[boxIndex];

    let nextSign: '✓' | '?' | '' = '';
    if (forcedSign !== undefined) {
      nextSign = forcedSign;
    } else if (activeMarkingTool === '✓') {
      // If True option is selected: clicking sets '✓' (or toggles to empty if already '✓')
      nextSign = currentSign === '✓' ? '' : '✓';
    } else if (activeMarkingTool === '?') {
      // If Question option is selected: clicking sets '?' (or toggles to empty if already '?')
      nextSign = currentSign === '?' ? '' : '?';
    } else {
      // Cycle mode: Empty -> ✓ -> ? -> Empty
      if (currentSign === '' || !currentSign) {
        nextSign = '✓';
      } else if (currentSign === '✓') {
        nextSign = '?';
      } else {
        nextSign = '';
      }
    }

    currentOutcomes[boxIndex] = nextSign;

    // ૨ ગુણ ખરાની નિશાની [✓] ના ઉમેરાય, પ્રશ્નાર્થ [?] ના ૦ ગુણ ઉમેરાય
    const checkCount = currentOutcomes.filter((v) => v === '✓').length;
    const newTotalMarks = Math.min(maxMarks, checkCount * MARKS_PER_BOX);

    const updatedPatrakA: PatrakARecord = { ...appData.patrakA };
    if (!updatedPatrakA[studentId]) updatedPatrakA[studentId] = {};

    updatedPatrakA[studentId][subjectId] = {
      ...(updatedPatrakA[studentId][subjectId] || {}),
      marks: newTotalMarks,
      outcomes: currentOutcomes,
      isAbsent: false,
    };

    onUpdateAppData({ ...appData, patrakA: updatedPatrakA });
  };

  // Fill empty boxes of a single student with '?' (0 marks)
  const fillStudentEmptyWithQuestion = (studentId: string, subjectId: string) => {
    const currentOutcomes = [...getOutcomes(studentId, subjectId)];
    let changed = false;
    for (let i = 0; i < TOTAL_BOXES; i++) {
      if (!currentOutcomes[i] || currentOutcomes[i] === '') {
        currentOutcomes[i] = '?';
        changed = true;
      }
    }
    if (changed) {
      const checkCount = currentOutcomes.filter((v) => v === '✓').length;
      const newTotalMarks = Math.min(maxMarks, checkCount * MARKS_PER_BOX);
      const updatedPatrakA: PatrakARecord = { ...appData.patrakA };
      if (!updatedPatrakA[studentId]) updatedPatrakA[studentId] = {};
      updatedPatrakA[studentId][subjectId] = {
        ...(updatedPatrakA[studentId][subjectId] || {}),
        marks: newTotalMarks,
        outcomes: currentOutcomes,
        isAbsent: false,
      };
      onUpdateAppData({ ...appData, patrakA: updatedPatrakA });
    }
  };

  // Set marks directly (syncs 20 boxes automatically: '✓' for marks/2, '?' for rest)
  const handleMarkChange = (studentId: string, subjectId: string, valStr: string) => {
    setErrorMessage(null);
    const updatedPatrakA: PatrakARecord = { ...appData.patrakA };
    if (!updatedPatrakA[studentId]) updatedPatrakA[studentId] = {};

    if (valStr === '') {
      updatedPatrakA[studentId][subjectId] = {
        ...(updatedPatrakA[studentId][subjectId] || {}),
        marks: undefined,
        outcomes: Array(TOTAL_BOXES).fill(''),
        isAbsent: false,
      };
      onUpdateAppData({ ...appData, patrakA: updatedPatrakA });
      return;
    }

    const num = Number(valStr);
    if (isNaN(num)) {
      setErrorMessage('કૃપા કરીને ફક્ત આંકડાકીય ગુણ દાખલ કરો.');
      return;
    }

    if (num < 0 || num > maxMarks) {
      setErrorMessage(
        `પત્રક A માં ૨૦ ખાના છે અને કુલ ગુણ ૪૦ છે (ખરા [✓] ના ૨ ગુણ, પ્રશ્નાર્થ [?] ના ૦ ગુણ). ગુણ ૦ થી ૪૦ ની વચ્ચે હોવા જોઈએ!`
      );
      return;
    }

    // Auto sync 20 boxes: Math.round(num / 2) boxes get '✓', remaining get '?'
    const checkCount = Math.min(TOTAL_BOXES, Math.round(num / MARKS_PER_BOX));
    const newOutcomes: ('✓' | '?' | '')[] = Array.from({ length: TOTAL_BOXES }, (_, idx) =>
      idx < checkCount ? '✓' : num > 0 ? '?' : ''
    );

    updatedPatrakA[studentId][subjectId] = {
      ...(updatedPatrakA[studentId][subjectId] || {}),
      marks: num,
      outcomes: newOutcomes,
      isAbsent: false,
    };
    onUpdateAppData({ ...appData, patrakA: updatedPatrakA });
  };

  // Quick fill student: set specific number of '✓' boxes (2 marks each) and rest '?' (0 marks)
  const setStudentBoxesCount = (studentId: string, subjectId: string, checkCount: number) => {
    const clampedCheck = Math.max(0, Math.min(TOTAL_BOXES, checkCount));
    const newOutcomes: ('✓' | '?' | '')[] = Array.from({ length: TOTAL_BOXES }, (_, idx) => {
      if (checkCount === 0) return '';
      return idx < clampedCheck ? '✓' : '?';
    });
    const marks = clampedCheck * MARKS_PER_BOX;

    const updatedPatrakA: PatrakARecord = { ...appData.patrakA };
    if (!updatedPatrakA[studentId]) updatedPatrakA[studentId] = {};

    updatedPatrakA[studentId][subjectId] = {
      ...(updatedPatrakA[studentId][subjectId] || {}),
      marks,
      outcomes: newOutcomes,
      isAbsent: false,
    };
    onUpdateAppData({ ...appData, patrakA: updatedPatrakA });
  };

  // Bulk Fill Patrak A across all students in class
  const handleBulkFillA = (targetCheckCount: number, fillQuestionRemaining = true, onlyEmpty = false) => {
    let checkCount = targetCheckCount;
    let marksVal = targetCheckCount * MARKS_PER_BOX;

    if (targetCheckCount > TOTAL_BOXES) {
      marksVal = Math.max(0, Math.min(maxMarks, targetCheckCount));
      checkCount = Math.min(TOTAL_BOXES, Math.round(marksVal / MARKS_PER_BOX));
    } else {
      checkCount = Math.max(0, Math.min(TOTAL_BOXES, targetCheckCount));
      marksVal = Math.min(maxMarks, checkCount * MARKS_PER_BOX);
    }

    const newOutcomes: ('✓' | '?' | '')[] = Array.from({ length: TOTAL_BOXES }, (_, idx) => {
      if (checkCount === 0 && !fillQuestionRemaining) return '';
      return idx < checkCount ? '✓' : fillQuestionRemaining ? '?' : '';
    });

    const updated = { ...appData.patrakA };
    let affected = 0;

    for (const st of classStudents) {
      if (!updated[st.id]) updated[st.id] = {};
      const curr = updated[st.id][selectedSubjectId];

      if (onlyEmpty) {
        if (curr?.marks === undefined && !curr?.isAbsent) {
          updated[st.id][selectedSubjectId] = {
            ...(curr || {}),
            marks: marksVal,
            outcomes: newOutcomes,
            isAbsent: false,
          };
          affected++;
        }
      } else {
        updated[st.id][selectedSubjectId] = {
          ...(curr || {}),
          marks: marksVal,
          outcomes: newOutcomes,
          isAbsent: false,
        };
        affected++;
      }
    }
    onUpdateAppData({ ...appData, patrakA: updated });
    setSubmitToast(
      `સફળતા! ${affected} વિદ્યાર્થીઓમાં ${checkCount} ખરા [✓] (${marksVal}/૪૦ ગુણ) અને બાકીમાં [?] (૦ ગુણ) ભરાઈ ગયા છે.`
    );
    setTimeout(() => setSubmitToast(null), 3500);
    setBulkMarkA('');
  };

  // Fill empty boxes with '?' (0 marks) keeping '✓' unchanged
  const handleFillEmptyWithQuestion = () => {
    const updated = { ...appData.patrakA };
    let affected = 0;

    for (const st of classStudents) {
      if (!updated[st.id]) updated[st.id] = {};
      const currOutcomes = [...getOutcomes(st.id, selectedSubjectId)];
      let modified = false;

      for (let i = 0; i < TOTAL_BOXES; i++) {
        if (currOutcomes[i] === '' || !currOutcomes[i]) {
          currOutcomes[i] = '?';
          modified = true;
        }
      }

      if (modified) {
        const checkCount = currOutcomes.filter((v) => v === '✓').length;
        const newTotalMarks = Math.min(maxMarks, checkCount * MARKS_PER_BOX);
        updated[st.id][selectedSubjectId] = {
          ...(updated[st.id][selectedSubjectId] || {}),
          marks: newTotalMarks,
          outcomes: currOutcomes,
          isAbsent: false,
        };
        affected++;
      }
    }

    onUpdateAppData({ ...appData, patrakA: updated });
    setSubmitToast(`સફળતા! ${affected} વિદ્યાર્થીઓના ખાલી ખાનાઓમાં પ્રશ્નાર્થ [?] (૦ ગુણ) ભરાઈ ગયા છે.`);
    setTimeout(() => setSubmitToast(null), 3500);
  };

  // Toggle Absent
  const toggleAbsent = (studentId: string, subjectId: string) => {
    const updatedPatrakA: PatrakARecord = { ...appData.patrakA };
    if (!updatedPatrakA[studentId]) updatedPatrakA[studentId] = {};
    const curr = updatedPatrakA[studentId][subjectId];
    const isAbs = !curr?.isAbsent;

    updatedPatrakA[studentId][subjectId] = {
      ...curr,
      isAbsent: isAbs,
      marks: isAbs ? undefined : curr?.marks,
    };
    onUpdateAppData({ ...appData, patrakA: updatedPatrakA });
  };

  // Update Remark
  const handleRemarkChange = (studentId: string, subjectId: string, remark: string) => {
    const updatedPatrakA: PatrakARecord = { ...appData.patrakA };
    if (!updatedPatrakA[studentId]) updatedPatrakA[studentId] = {};
    updatedPatrakA[studentId][subjectId] = {
      ...updatedPatrakA[studentId][subjectId],
      remarks: remark,
    };
    onUpdateAppData({ ...appData, patrakA: updatedPatrakA });
  };

  const activeStudent = classStudents.find((s) => s.id === selectedStudentId) || classStudents[0];
  const activeStudentSummary = activeStudent
    ? calculatePatrakASummary(activeStudent, appData.subjects, appData.patrakA, appData.settings.gradeBoundaries)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Banner with 3D Pop Header */}
      <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-xl card-3d">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-900 border border-indigo-200 mb-1 badge-3d">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>સર્વગ્રાહી મૂલ્યાંકન – ૨૦ ખાના પદ્ધતિ (દરેક ખાનાના ૨ ગુણ • કુલ ૪૦ ગુણ)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-indigo-600" /> પત્રક A – વિષયવાર ૨૦ ખાના અને કુલ ૪૦ ગુણ
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              દરેક વિષયના ૨૦ અધ્યયન ખાના ટીક કરો (દરેક ખાનાના ૨ ગુણ) અથવા સીધા ૪૦ માંથી ગુણ લખો – અંતે ૪૦ માંથી આપોઆપ સરવાળો, ટકાવારી અને ગ્રેડ તૈયાર થશે
            </p>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
              <button
                onClick={() => setDisplayStyle('boxes_grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  displayStyle === 'boxes_grid'
                    ? 'bg-indigo-600 text-white shadow-md transform -translate-y-0.5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>૨૦ ખાના ગ્રીડ</span>
              </button>
              <button
                onClick={() => setDisplayStyle('compact')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  displayStyle === 'compact'
                    ? 'bg-indigo-600 text-white shadow-md transform -translate-y-0.5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>સંક્ષિપ્ત કોષ્ટક</span>
              </button>
            </div>

            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
              <button
                onClick={() => setViewMode('bySubject')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'bySubject' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                આખા વર્ગનો વિષયવાર પત્રક
              </button>
              <button
                onClick={() => {
                  setViewMode('allSubjectsStudent');
                  if (!selectedStudentId && classStudents[0]) setSelectedStudentId(classStudents[0].id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'allSubjectsStudent' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                એક વિદ્યાર્થીના ૭ વિષયો
              </button>
            </div>

            {/* Print Patrak A Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-500/20 transition-all cursor-pointer btn-3d"
            >
              <Printer className="w-4 h-4" />
              <span>પત્રક A પ્રિન્ટ / PDF</span>
            </button>

            {/* Submit Patrak A Button */}
            <button
              onClick={handleSubmitPatrakA}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer btn-3d"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>સબમિટ કરો (Submit)</span>
            </button>
          </div>
        </div>

        {/* Submit Toast */}
        {submitToast && (
          <div className="mt-3 p-3 bg-emerald-50 border-2 border-emerald-300 text-emerald-950 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{submitToast}</span>
            </div>
            <button
              onClick={() => setSubmitToast(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">૧. ધોરણ પસંદ કરો:</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
              {([6, 7, 8] as const).map((std) => (
                <button
                  key={std}
                  onClick={() => setSelectedStandard(std)}
                  className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    selectedStandard === std
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ધોરણ {std}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">૨. વર્ગ પસંદ કરો:</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
              {(['all', 'A', 'B'] as const).map((div) => (
                <button
                  key={div}
                  onClick={() => setSelectedDivision(div)}
                  className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    selectedDivision === div
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {div === 'all' ? 'બધા' : `વર્ગ ${div}`}
                </button>
              ))}
            </div>
          </div>

          {viewMode === 'bySubject' ? (
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">૩. વિષય પસંદ કરો (મુખ્ય ૭ વિષયો):</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full py-2 px-3 bg-white border-2 border-indigo-200 rounded-xl text-xs sm:text-sm font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-xs"
              >
                {appData.subjects
                  .filter((s) => s.standards.includes(selectedStandard))
                  .map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} (૨૦ ખાના • ૪૦ ગુણ)
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">૩. વિદ્યાર્થી પસંદ કરો:</label>
              <select
                value={selectedStudentId || classStudents[0]?.id || ''}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full py-2 px-3 bg-white border-2 border-indigo-200 rounded-xl text-xs sm:text-sm font-black text-indigo-950 focus:ring-2 focus:ring-indigo-500 shadow-xs"
              >
                {classStudents.map((st) => (
                  <option key={st.id} value={st.id}>
                    રોલ {st.rollNumber} - {st.name} ({st.division})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Fill Toolbar for Patrak A */}
      {viewMode === 'bySubject' && (
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border-2 border-indigo-200 rounded-3xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 shadow-md card-3d">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-slate-900 text-xs sm:text-sm">
                  પત્રક A ઝડપી મૂલ્યાંકન ટૂલબાર ({currentSubject.name}):
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <Check className="w-3 h-3 stroke-[3]" /> [✓] = ૨ ગુણ
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                  <HelpCircle className="w-3 h-3" /> [?] = ૦ ગુણ
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ૨૦ ખાના (૪૦ ગુણ) • ખાના પર ક્લિક કરતાં: <strong>ખાલી ➔ [✓] (+૨ ગુણ) ➔ [?] (૦ ગુણ) ➔ ખાલી</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="inline-flex items-center gap-1 bg-white border-2 border-indigo-300 rounded-xl px-1.5 py-0.5 shadow-xs">
              <input
                type="number"
                min={0}
                max={maxMarks}
                placeholder="ગુણ (૦-૪૦)"
                value={bulkMarkA}
                onChange={(e) => setBulkMarkA(e.target.value)}
                className="w-20 text-center py-1 font-black text-xs text-indigo-950 focus:outline-hidden"
              />
              <button
                onClick={() => handleBulkFillA(Number(bulkMarkA) || 0, true)}
                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black transition-all cursor-pointer"
              >
                ભરો
              </button>
            </div>

            <button
              onClick={() => handleBulkFillA(20, true)}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-1"
              title="બધા ૨૦ ખાના [✓] ખરા ભરો (૪૦ ગુણ)"
            >
              <span>૨૦ [✓] (૪૦ ગુણ)</span>
            </button>

            <button
              onClick={() => handleBulkFillA(18, true)}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-1"
              title="૧૮ ખરા [✓] + ૨ પ્રશ્નાર્થ [?] (૩૬ ગુણ)"
            >
              <span>૧૮ [✓] + ૨ [?] (૩૬)</span>
            </button>

            <button
              onClick={() => handleBulkFillA(15, true)}
              className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-1"
              title="૧૫ ખરા [✓] + ૫ પ્રશ્નાર્થ [?] (૩૦ ગુણ)"
            >
              <span>૧૫ [✓] + ૫ [?] (૩૦)</span>
            </button>

            <button
              onClick={handleFillEmptyWithQuestion}
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer flex items-center gap-1 border border-amber-600"
              title="જે ખાના ખાલી છે તેમાં [?] પ્રશ્નાર્થ (૦ ગુણ) ભરો"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>ખાલીમાં [?] ભરો</span>
            </button>

            <button
              onClick={() => handleBulkFillA(0, false)}
              className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="બધા ખાના સાફ કરો"
            >
              સાફ (૦)
            </button>
          </div>
        </div>
      )}

      {/* Interactive 2-Option Selector Bar (True [✓] vs Question [?]) */}
      <div className="bg-gradient-to-r from-emerald-50/90 via-indigo-50/90 to-amber-50/90 border-2 border-indigo-200 rounded-3xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md card-3d">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
            <span className="font-black text-slate-900 text-xs sm:text-sm">
              ખાનામાં પૂરવા માટે વિકલ્પ પસંદ કરો (Select Option):
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Option 1: True / ખરું [✓] */}
            <button
              type="button"
              onClick={() => setActiveMarkingTool('✓')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeMarkingTool === '✓'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-105 border-2 border-emerald-700 ring-2 ring-emerald-300'
                  : 'bg-white text-emerald-800 border-2 border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-lg flex items-center justify-center font-black text-xs ${
                  activeMarkingTool === '✓' ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white'
                }`}
              >
                ✓
              </div>
              <div className="text-left leading-tight">
                <span className="block font-black">ઓપ્શન ૧: True (ખરું)</span>
                <span
                  className={`text-[10px] ${
                    activeMarkingTool === '✓' ? 'text-emerald-100 font-bold' : 'text-emerald-700'
                  }`}
                >
                  +૨ ગુણ ઉમેરાય
                </span>
              </div>
              {activeMarkingTool === '✓' && <CheckCircle2 className="w-4 h-4 ml-1 text-white" />}
            </button>

            {/* Option 2: Question / પ્રશ્નાર્થ [?] */}
            <button
              type="button"
              onClick={() => setActiveMarkingTool('?')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                activeMarkingTool === '?'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-105 border-2 border-amber-600 ring-2 ring-amber-300'
                  : 'bg-white text-amber-900 border-2 border-amber-300 hover:bg-amber-50'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-lg flex items-center justify-center font-black text-xs ${
                  activeMarkingTool === '?' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'
                }`}
              >
                ?
              </div>
              <div className="text-left leading-tight">
                <span className="block font-black">ઓપ્શન ૨: Question (પ્રશ્નાર્થ)</span>
                <span
                  className={`text-[10px] ${
                    activeMarkingTool === '?' ? 'text-slate-900 font-black' : 'text-amber-800'
                  }`}
                >
                  ૦ ગુણ ઉમેરાય
                </span>
              </div>
              {activeMarkingTool === '?' && <CheckCircle2 className="w-4 h-4 ml-1 text-slate-950" />}
            </button>

            {/* Option 3: Cycle Mode */}
            <button
              type="button"
              onClick={() => setActiveMarkingTool('cycle')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeMarkingTool === 'cycle'
                  ? 'bg-indigo-600 text-white shadow-md border-2 border-indigo-700 ring-2 ring-indigo-300'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
              }`}
              title="ક્લિક કરવાથી ક્રમશઃ: ખાલી ➔ [✓] ➔ [?] ➔ ખાલી થશે"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ચક્ર (Cycle)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 bg-white text-indigo-950 font-black rounded-xl border border-indigo-200 shadow-2xs">
            હાલ પસંદ કરેલ:{' '}
            {activeMarkingTool === '✓' ? (
              <span className="text-emerald-700 font-black">True [✓] (+૨ ગુણ) • ખાના પર ક્લિક કરતાં [✓] થશે</span>
            ) : activeMarkingTool === '?' ? (
              <span className="text-amber-800 font-black">Question [?] (૦ ગુણ) • ખાના પર ક્લિક કરતાં [?] થશે</span>
            ) : (
              <span className="text-indigo-700 font-black">ચક્ર (Cycle મોડ)</span>
            )}
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 text-xs font-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)}>✕</button>
        </div>
      )}

      {/* VIEW 1: BY SUBJECT (ALL STUDENTS IN CLASS WITH 40 BOXES) */}
      {viewMode === 'bySubject' && (
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden card-3d">
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span className="font-black text-slate-900 text-sm md:text-base font-heading">
                {currentSubject?.name} – પત્રક A (૨૦ ખાના વિસ્તૃત મૂલ્યાંકન • ૪૦ ગુણ)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-black">
              <span className="px-3 py-1 bg-white text-indigo-900 rounded-full border border-indigo-300 shadow-xs">
                ખાના ૧ થી ૨૦ • દરેક ખાનાના ૨ ગુણ • અંતે ઓટોમેટિક કુલ સરવાળો (૪૦)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-300 text-slate-800 font-black">
                  <th className="py-2.5 px-2.5 w-12 text-center">રોલ</th>
                  <th className="py-2.5 px-2 w-16">GR</th>
                  <th className="py-2.5 px-3 min-w-[150px]">વિદ્યાર્થીનું નામ</th>
                  <th className="py-2.5 px-2 w-14 text-center">ગેરહાજર</th>

                  {/* 20 BOXES HEADERS (૧ થી ૨૦) */}
                  {displayStyle === 'boxes_grid' && (
                    <th className="py-2.5 px-2 min-w-[640px] text-center bg-indigo-50/50">
                      <div className="flex items-center justify-between px-2 mb-1">
                        <span className="text-[11px] font-black text-indigo-900">
                          અધ્યયન નિષ્પત્તિ ૧ થી ૨૦ ખાના (દરેક ખાનાના ૨ ગુણ • કુલ ૪૦ ગુણ)
                        </span>
                        <span className="text-[10px] text-indigo-900 font-black bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                          ક્લિક: [✓] ખરું = ૨ ગુણ  |  [?] પ્રશ્નાર્થ = ૦ ગુણ
                        </span>
                      </div>
                      <div className="grid grid-cols-10 sm:grid-cols-20 gap-1">
                        {Array.from({ length: 20 }, (_, i) => (
                          <div
                            key={i}
                            className="text-[10px] font-black text-slate-700 text-center py-1 bg-slate-200/90 rounded border border-slate-300"
                            title={`ખાનું નં. ${i + 1} (૨ ગુણ)`}
                          >
                            {i + 1}
                          </div>
                        ))}
                      </div>
                    </th>
                  )}

                  {/* AUTO TOTAL AT THE END (અંતે કુલ સરવાળો) */}
                  <th className="py-2.5 px-3 min-w-[130px] text-center bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-950 font-black border-x-2 border-amber-300">
                    <div className="flex items-center justify-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>અંતે કુલ સરવાળો</span>
                    </div>
                    <span className="text-[10px] text-amber-800 font-black block">(Auto Total / ૪૦)</span>
                  </th>
                  <th className="py-2.5 px-3 w-20 text-center bg-indigo-100 text-indigo-950 font-black">
                    ટકા (%)
                  </th>
                  <th className="py-2.5 px-2 w-16 text-center font-black">ગ્રેડ</th>
                  <th className="py-2.5 px-3 min-w-[150px] font-black">શિક્ષકની નોંધ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      કોઈ વિદ્યાર્થી નોંધાયેલ નથી.
                    </td>
                  </tr>
                ) : (
                  classStudents.map((st) => {
                    const item = appData.patrakA[st.id]?.[selectedSubjectId];
                    const isAbsent = !!item?.isAbsent;
                    const outcomes = getOutcomes(st.id, selectedSubjectId);
                    const checkCount = outcomes.filter((v) => v === '✓').length;
                    const questionCount = outcomes.filter((v) => v === '?').length;
                    const calculatedMarks = isAbsent
                      ? undefined
                      : item?.marks !== undefined
                      ? item.marks
                      : checkCount * MARKS_PER_BOX;
                    const pct =
                      calculatedMarks !== undefined
                        ? Number(((calculatedMarks / maxMarks) * 100).toFixed(1))
                        : 0;
                    const gradeInfo = getGradeFromPercentage(pct, appData.settings.gradeBoundaries);

                    return (
                      <tr key={st.id} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="py-2.5 px-2.5 text-center font-black text-slate-900 text-sm">
                          {st.rollNumber}
                        </td>
                        <td className="py-2.5 px-2 font-mono font-bold text-xs text-slate-700">
                          {st.grNumber}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {st.name}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => toggleAbsent(st.id, selectedSubjectId)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                              isAbsent ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {isAbsent ? 'AB' : 'હાજર'}
                          </button>
                        </td>

                        {/* 20 INTERACTIVE BOXES (૧ થી ૨૦ ખાના) */}
                        {displayStyle === 'boxes_grid' && (
                          <td className="py-2.5 px-2 text-center">
                            {isAbsent ? (
                              <div className="py-1 px-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg inline-block">
                                ગેરહાજર (કોઈ ખાનું ગણાશે નહીં)
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1.5">
                                <div className="grid grid-cols-10 sm:grid-cols-20 gap-1">
                                  {outcomes.map((sign, boxIdx) => {
                                    const isCheck = sign === '✓';
                                    const isQuestion = sign === '?';
                                    return (
                                      <button
                                        key={boxIdx}
                                        onClick={() => toggleBox(st.id, selectedSubjectId, boxIdx)}
                                        onContextMenu={(e) => {
                                          e.preventDefault();
                                          toggleBox(st.id, selectedSubjectId, boxIdx, sign === '?' ? '✓' : '?');
                                        }}
                                        title={`ખાનું નં. ${boxIdx + 1}: ${
                                          isCheck
                                            ? 'ખરું [✓] (+૨ ગુણ) • લેફ્ટ-ક્લિક: ખાલી | રાઇટ-ક્લિક: [?]'
                                            : isQuestion
                                            ? 'પ્રશ્નાર્થ [?] (૦ ગુણ) • લેફ્ટ-ક્લિક: ખાલી | રાઇટ-ક્લિક: [✓]'
                                            : `ખાલી (૦ ગુણ) • ક્લિક કરતાં ${activeMarkingTool === '?' ? '[?] (૦)' : '[✓] (+૨)'} થશે | રાઇટ-ક્લિક: [?]`
                                        }`}
                                        className={`h-8 rounded-lg text-xs font-black transition-all flex flex-col items-center justify-center cursor-pointer border select-none ${
                                          isCheck
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-2xs ring-1 ring-emerald-400'
                                            : isQuestion
                                            ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 border-amber-500 shadow-2xs ring-1 ring-amber-400'
                                            : 'bg-white text-slate-300 hover:text-slate-600 hover:bg-slate-100 border-slate-300'
                                        }`}
                                      >
                                        <span className="text-[8px] leading-none opacity-75 font-mono">{boxIdx + 1}</span>
                                        <span className="leading-none text-xs font-black">
                                          {isCheck ? '✓' : isQuestion ? '?' : ''}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5 flex-wrap gap-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1 font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                      <span>{checkCount} ખરા = {calculatedMarks || 0} ગુણ</span>
                                    </span>
                                    {questionCount > 0 && (
                                      <span className="inline-flex items-center gap-1 font-black text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                        <HelpCircle className="w-3 h-3" />
                                        <span>{questionCount} પ્રશ્નાર્થ = ૦ ગુણ</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 font-bold flex-wrap">
                                    <button
                                      onClick={() => setStudentBoxesCount(st.id, selectedSubjectId, 20)}
                                      className="text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 cursor-pointer text-[10px]"
                                      title="બધા ૨૦ ખાના [✓] ખરા ભરો (૪૦ ગુણ)"
                                    >
                                      બધા [✓] (૪૦)
                                    </button>
                                    <button
                                      onClick={() => fillStudentEmptyWithQuestion(st.id, selectedSubjectId)}
                                      className="text-amber-900 hover:text-amber-950 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300 cursor-pointer text-[10px]"
                                      title="ખાલી ખાનાઓમાં [?] પ્રશ્નાર્થ (૦ ગુણ) ભરો"
                                    >
                                      બાકીમાં [?] ભરો
                                    </button>
                                    <span>•</span>
                                    <button
                                      onClick={() => setStudentBoxesCount(st.id, selectedSubjectId, 18)}
                                      className="text-blue-700 hover:text-blue-900 underline cursor-pointer text-[10px]"
                                      title="૧૮ [✓] + ૨ [?] (૩૬ ગુણ)"
                                    >
                                      ૧૮ [✓] (૩૬)
                                    </button>
                                    <span>•</span>
                                    <button
                                      onClick={() => setStudentBoxesCount(st.id, selectedSubjectId, 15)}
                                      className="text-purple-700 hover:text-purple-900 underline cursor-pointer text-[10px]"
                                      title="૧૫ [✓] + ૫ [?] (૩૦ ગુણ)"
                                    >
                                      ૧૫ [✓] (૩૦)
                                    </button>
                                    <span>•</span>
                                    <button
                                      onClick={() => setStudentBoxesCount(st.id, selectedSubjectId, 0)}
                                      className="text-slate-400 hover:text-slate-700 cursor-pointer text-[10px]"
                                      title="ખાલી કરો"
                                    >
                                      સાફ
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                        )}

                        {/* AUTO CALCULATED TOTAL AT THE END (અંતે કુલ સરવાળો) */}
                        <td className="py-2.5 px-3 text-center bg-gradient-to-b from-amber-50 to-yellow-50 border-x-2 border-amber-300">
                          {isAbsent ? (
                            <span className="text-rose-600 font-black text-xs">ગેરહાજર</span>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <div className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-xl border-2 border-amber-400 shadow-xs">
                                <input
                                  type="number"
                                  min={0}
                                  max={maxMarks}
                                  value={calculatedMarks !== undefined ? calculatedMarks : ''}
                                  onChange={(e) =>
                                    handleMarkChange(st.id, selectedSubjectId, e.target.value)
                                  }
                                  className="w-14 text-center font-black text-base text-amber-950 focus:outline-hidden"
                                />
                                <span className="text-xs font-black text-amber-800">/ ૪૦</span>
                              </div>
                              <span className="text-[10px] font-black text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300">
                                આપમેળે કુલ ✓
                              </span>
                            </div>
                          )}
                        </td>

                        {/* PERCENTAGE */}
                        <td className="py-2.5 px-3 text-center font-black text-sm text-indigo-700 bg-indigo-50/50">
                          {isAbsent ? '--' : `${pct}%`}
                        </td>

                        {/* GRADE */}
                        <td className="py-2.5 px-2 text-center">
                          {isAbsent ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-bold">
                              AB
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-black border ${gradeInfo.colorClass}`}>
                              {gradeInfo.grade}
                            </span>
                          )}
                        </td>

                        {/* REMARKS */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            placeholder="દા.ત. સંતોષકારક રસ દાખવે છે"
                            value={item?.remarks || ''}
                            onChange={(e) =>
                              handleRemarkChange(st.id, selectedSubjectId, e.target.value)
                            }
                            className="w-full text-xs py-1 px-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-400 font-medium"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Patrak A Table Footer with Submit Button */}
          <div className="p-4 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-emerald-50/30 border-t-2 border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-bold text-slate-800">
                નોંધ: ૨૦ ખાનામાંથી જેટલા ખાનામાં (✓) કરશો તેનો સ્વચાલિત સરવાળો ૨ ગુણ લેખે ૪૦ માંથી અંતે ગણાઈ જશે.
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-indigo-700 font-bold">
                {appData.settings.schoolName || 'શ્રી પ્રાથમિક શાળા'}
              </span>
            </div>

            <button
              onClick={handleSubmitPatrakA}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer btn-3d"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>પત્રક A સબમિટ કરો (Submit Patrak A) ✨</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: SINGLE STUDENT ALL 7 MAIN SUBJECTS */}
      {viewMode === 'allSubjectsStudent' && activeStudent && activeStudentSummary && (
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-6 space-y-5 card-3d">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <span className="text-xs text-indigo-700 font-black uppercase">
                પત્રક A – વિદ્યાર્થીના તમામ ૭ મુખ્ય વિષયો
              </span>
              <h3 className="text-xl font-black text-slate-900 font-heading">
                {activeStudent.name} (રોલ નં: {activeStudent.rollNumber}, ધોરણ: {activeStudent.standard}-{activeStudent.division})
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-2xl">
                <div className="text-[11px] text-indigo-700 font-bold">૭ વિષયોનો કુલ સરવાળો (૨૮૦ માંથી):</div>
                <div className="text-xl font-black text-indigo-950 font-heading">
                  {activeStudentSummary.totalObtained} / {activeStudentSummary.totalMax} ({activeStudentSummary.percentage}%)
                </div>
              </div>
              <span className={`px-4 py-2 rounded-2xl text-base font-black border ${activeStudentSummary.gradeColor}`}>
                ગ્રેડ: {activeStudentSummary.grade}
              </span>
            </div>
          </div>

          {/* 7 Subjects with their 40 Boxes each */}
          <div className="space-y-4">
            {appData.subjects
              .filter((s) => s.standards.includes(activeStudent.standard))
              .map((sub, sIdx) => {
                const item = appData.patrakA[activeStudent.id]?.[sub.id];
                const isAbsent = !!item?.isAbsent;
                const outcomes = getOutcomes(activeStudent.id, sub.id);
                const checkCount = outcomes.filter((v) => v === '✓').length;
                const questionCount = outcomes.filter((v) => v === '?').length;
                const subMarks = isAbsent
                  ? 0
                  : item?.marks !== undefined
                  ? item.marks
                  : checkCount * MARKS_PER_BOX;
                const subPct = Number(((subMarks / maxMarks) * 100).toFixed(1));
                const gradeInfo = getGradeFromPercentage(subPct, appData.settings.gradeBoundaries);

                return (
                  <div
                    key={sub.id}
                    className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl hover:border-indigo-300 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
                          {sIdx + 1}
                        </span>
                        <span className="font-black text-slate-900 text-sm font-heading">
                          {sub.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="flex items-center gap-1.5 bg-white border border-slate-300 px-3 py-1 rounded-xl text-xs font-bold text-slate-700">
                          <span className="inline-flex items-center gap-1 text-emerald-800 font-black">
                            <span className="w-3.5 h-3.5 rounded bg-emerald-600 text-white flex items-center justify-center text-[9px]">✓</span>
                            {checkCount} ખરા = {subMarks} ગુણ
                          </span>
                          {questionCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-amber-900 font-black ml-1">
                              <span className="w-3.5 h-3.5 rounded bg-amber-500 text-slate-950 flex items-center justify-center text-[9px]">?</span>
                              {questionCount} પ્રશ્નાર્થ = ૦ ગુણ
                            </span>
                          )}
                          <span className="text-slate-400">/ ૪૦ ({subPct}%)</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${gradeInfo.colorClass}`}>
                          {gradeInfo.grade}
                        </span>
                      </div>
                    </div>

                    {/* 20 Boxes Grid with ✓ (+2 marks) and ? (0 marks) */}
                    <div className="grid grid-cols-10 sm:grid-cols-20 gap-1">
                      {outcomes.map((sign, bIdx) => {
                        const isCheck = sign === '✓';
                        const isQuestion = sign === '?';
                        return (
                          <button
                            key={bIdx}
                            onClick={() => toggleBox(activeStudent.id, sub.id, bIdx)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              toggleBox(activeStudent.id, sub.id, bIdx, sign === '?' ? '✓' : '?');
                            }}
                            title={`ખાનું ${bIdx + 1}: ${
                              isCheck
                                ? 'ખરું [✓] (+૨ ગુણ) • લેફ્ટ-ક્લિક: ખાલી | રાઇટ-ક્લિક: [?]'
                                : isQuestion
                                ? 'પ્રશ્નાર્થ [?] (૦ ગુણ) • લેફ્ટ-ક્લિક: ખાલી | રાઇટ-ક્લિક: [✓]'
                                : `ખાલી • ક્લિક કરતાં ${activeMarkingTool === '?' ? '[?] (૦)' : '[✓] (+૨)'} થશે`
                            }`}
                            className={`h-7 sm:h-8 rounded text-xs font-black flex items-center justify-center border transition-all cursor-pointer select-none ${
                              isCheck
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-2xs ring-1 ring-emerald-400'
                                : isQuestion
                                ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 border-amber-500 shadow-2xs ring-1 ring-amber-400'
                                : 'bg-white text-slate-400 border-slate-300 hover:bg-slate-100 hover:text-slate-700'
                            }`}
                          >
                            {isCheck ? '✓' : isQuestion ? '?' : bIdx + 1}
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick helper buttons */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 font-bold flex-wrap">
                        <span>ઝડપી ભરો:</span>
                        <button
                          onClick={() => setStudentBoxesCount(activeStudent.id, sub.id, 20)}
                          className="text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                        >
                          ૨૦ [✓] (૪૦)
                        </button>
                        <span>•</span>
                        <button
                          onClick={() => fillStudentEmptyWithQuestion(activeStudent.id, sub.id)}
                          className="text-amber-800 hover:text-amber-950 underline cursor-pointer font-black"
                          title="આ વિષયના બાકીના ખાનાઓમાં [?] ભરો"
                        >
                          બાકીમાં [?] ભરો
                        </button>
                        <span>•</span>
                        <button
                          onClick={() => setStudentBoxesCount(activeStudent.id, sub.id, 18)}
                          className="text-blue-700 hover:text-blue-900 underline cursor-pointer"
                        >
                          ૧૮ [✓] + ૨ [?] (૩૬)
                        </button>
                        <span>•</span>
                        <button
                          onClick={() => setStudentBoxesCount(activeStudent.id, sub.id, 15)}
                          className="text-purple-700 hover:text-purple-900 underline cursor-pointer"
                        >
                          ૧૫ [✓] + ૫ [?] (૩૦)
                        </button>
                        <span>•</span>
                        <button
                          onClick={() => setStudentBoxesCount(activeStudent.id, sub.id, 0)}
                          className="text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          સાફ
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="શિક્ષકની નોંધ..."
                        value={item?.remarks || ''}
                        onChange={(e) => handleRemarkChange(activeStudent.id, sub.id, e.target.value)}
                        className="text-xs py-1 px-3 bg-white border border-slate-300 rounded-xl w-60"
                      />
                    </div>
                  </div>
                );
              })}
          </div>

          {/* View 2 Footer Submit Button */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleSubmitPatrakA}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer btn-3d"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>આ વિદ્યાર્થીનું પત્રક A સબમિટ કરો ✨</span>
            </button>
          </div>
        </div>
      )}

      {/* Print Patrak A Modal */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title={`ધોરણ ${selectedStandard} પત્રક A (૨૦ ખાના પત્રક • ૪૦ ગુણ) – ${currentSubject.name}`}
        documentType="patrak_a"
        onDownloadHtml={handleDownloadPatrakAHtml}
        orientation="landscape"
        description={`વિષય: ${currentSubject.name} • ધોરણ ${selectedStandard} ના તમામ વિદ્યાર્થીઓનું ૨૦ અધ્યયન નિષ્પત્તિ/ખાના અને અંતે કુલ ૪૦ ગુણ (Auto Total) ધરાવતું અધિકૃત પત્રક A.`}
      />

      {/* SUBMIT SUCCESS MODAL FOR PATRAK A */}
      {isSubmitModalOpen && submitStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border-2 border-emerald-400/50 card-3d animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 mb-0.5">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>સફળતાપૂર્વક સાચવાઈ ગયું</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 font-heading">
                    પત્રક A સબમિટ થઈ ગયું છે!
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3 mb-4 leading-relaxed">
              ધોરણ {submitStats.standard} {submitStats.division !== 'all' ? `(વર્ગ ${submitStats.division})` : ''} નું વિષય <strong>{submitStats.subjectName}</strong> માટે પત્રક A સફળતાપૂર્વક સબમિટ કરી સેવ કરી લેવાયું છે.
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 text-[11px] block">ધોરણ અને વર્ગ:</span>
                <span className="font-black text-slate-900 text-sm">
                  ધોરણ {submitStats.standard} {submitStats.division === 'all' ? '(બધા)' : `(${submitStats.division})`}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 text-[11px] block">વિષય:</span>
                <span className="font-black text-indigo-900 text-sm">{submitStats.subjectName}</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-emerald-700 text-[11px] block font-bold">મૂલ્યાંકન થયેલ:</span>
                <span className="font-black text-emerald-950 text-sm">
                  {submitStats.evaluatedCount} / {submitStats.totalStudents} વિદ્યાર્થીઓ
                </span>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-blue-700 text-[11px] block font-bold">કુલ ટીક ખાના:</span>
                <span className="font-black text-blue-950 text-sm">
                  {submitStats.totalBoxesChecked} ખાના (✓)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 mb-5 pt-1">
              <span>સમય: <strong>{submitStats.timestamp}</strong></span>
              <span className="text-emerald-700 font-bold">✓ ડેટા સુરક્ષિત સંગ્રહિત</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              {onNavigate && (
                <button
                  onClick={() => {
                    setIsSubmitModalOpen(false);
                    onNavigate('result', submitStats.standard);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>પરિણામ લેજર જુઓ</span>
                </button>
              )}
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 cursor-pointer btn-3d"
              >
                સમજાઈ ગયું (Done)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
