import React, { useState } from 'react';
import {
  Edit3,
  Save,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Filter,
  CheckSquare,
  Sparkles,
  ClipboardPaste,
  Layers,
  Table,
  Columns,
  Zap,
  Send,
  Check,
  X,
  ExternalLink,
  Award,
  FileCheck,
} from 'lucide-react';
import { AppData, ExamKey, EXAM_CONFIGS, Standard, StudentMarksRecord, Subject } from '../types';

interface MarksEntryProps {
  appData: AppData;
  onUpdateAppData: (data: AppData) => void;
  initialStandard?: Standard;
  onNavigate?: (tab: any, standard?: Standard) => void;
}

export const MarksEntry: React.FC<MarksEntryProps> = ({
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
  const [selectedExamKey, setSelectedExamKey] = useState<ExamKey>('sem1');
  const [entryMode, setEntryMode] = useState<'single_subject' | 'all_subjects_matrix'>('all_subjects_matrix');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitToast, setSubmitToast] = useState<string | null>(null);
  const [submitStats, setSubmitStats] = useState<{
    totalStudents: number;
    totalSlots: number;
    enteredCount: number;
    absentCount: number;
    pendingCount: number;
    standard: Standard;
    division: string;
    examName: string;
    subjectName?: string;
    timestamp: string;
  } | null>(null);

  // Bulk Fill State
  const [bulkMarkInput, setBulkMarkInput] = useState<string>('');
  const [seqMarksInput, setSeqMarksInput] = useState<string>('');
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);

  // Active Subject & Exam info
  const currentSubject = appData.subjects.find((s) => s.id === selectedSubjectId) || appData.subjects[0];
  const currentExam = EXAM_CONFIGS.find((e) => e.key === selectedExamKey) || EXAM_CONFIGS[2];
  const maxAllowed = currentSubject?.maxMarks[selectedExamKey] || currentExam.defaultMaxMarks;

  // Subjects for the selected standard
  const standardSubjects = appData.subjects.filter((s) => s.standards.includes(selectedStandard));

  // Filter students for this standard & division
  const classStudents = appData.students
    .filter((s) => s.standard === selectedStandard)
    .filter((s) => (selectedDivision === 'all' ? true : s.division === selectedDivision))
    .sort((a, b) => a.rollNumber - b.rollNumber);

  const triggerAutoSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  // Keyboard navigation handler: Enter / Down goes to next row, Up goes to previous row
  const handleInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    studentIdx: number,
    subjectIdx?: number
  ) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = studentIdx + 1;
      const targetId =
        subjectIdx !== undefined
          ? `matrix_input_${nextIdx}_${subjectIdx}`
          : `single_input_${nextIdx}`;
      const el = document.getElementById(targetId);
      if (el) el.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = studentIdx - 1;
      if (prevIdx >= 0) {
        const targetId =
          subjectIdx !== undefined
            ? `matrix_input_${prevIdx}_${subjectIdx}`
            : `single_input_${prevIdx}`;
        const el = document.getElementById(targetId);
        if (el) el.focus();
      }
    } else if (subjectIdx !== undefined && e.key === 'ArrowRight') {
      const nextSub = subjectIdx + 1;
      const el = document.getElementById(`matrix_input_${studentIdx}_${nextSub}`);
      if (el) el.focus();
    } else if (subjectIdx !== undefined && e.key === 'ArrowLeft') {
      const prevSub = subjectIdx - 1;
      if (prevSub >= 0) {
        const el = document.getElementById(`matrix_input_${studentIdx}_${prevSub}`);
        if (el) el.focus();
      }
    }
  };

  // Handle Mark Change for a specific student, subject, and exam
  const handleMarkChange = (studentId: string, subjectId: string, examKey: ExamKey, valStr: string) => {
    setErrorMessage(null);
    const updatedMarks: StudentMarksRecord = { ...appData.marks };
    if (!updatedMarks[studentId]) updatedMarks[studentId] = {};
    if (!updatedMarks[studentId][subjectId]) updatedMarks[studentId][subjectId] = {} as any;

    const sub = appData.subjects.find((s) => s.id === subjectId);
    const maxM = sub?.maxMarks[examKey] || 80;

    if (valStr === '') {
      updatedMarks[studentId][subjectId][examKey] = {
        marks: undefined,
        isAbsent: false,
      };
      onUpdateAppData({ ...appData, marks: updatedMarks });
      triggerAutoSave();
      return;
    }

    const num = Number(valStr);
    if (isNaN(num)) {
      setErrorMessage(`અમાન્ય એન્ટ્રી: કૃપા કરીને ફક્ત આંકડાકીય ગુણ દાખલ કરો.`);
      return;
    }

    if (num < 0) {
      setErrorMessage(`ગુણ ૦ (શૂન્ય) કરતાં ઓછા ન હોઈ શકે.`);
      return;
    }

    if (num > maxM) {
      setErrorMessage(
        `ભૂલ: ${sub?.name || 'વિષય'} ના ${currentExam.name} માં મહત્તમ ગુણ ${maxM} છે. તમે દાખલ કરેલ ગુણ (${num}) તેના કરતાં વધારે છે!`
      );
      return;
    }

    // Valid mark entry
    updatedMarks[studentId][subjectId][examKey] = {
      marks: num,
      isAbsent: false,
    };
    onUpdateAppData({ ...appData, marks: updatedMarks });
    triggerAutoSave();
  };

  // Toggle Absent State
  const toggleAbsent = (studentId: string, subjectId: string, examKey: ExamKey) => {
    setErrorMessage(null);
    const updatedMarks: StudentMarksRecord = { ...appData.marks };
    if (!updatedMarks[studentId]) updatedMarks[studentId] = {};
    if (!updatedMarks[studentId][subjectId]) updatedMarks[studentId][subjectId] = {} as any;

    const currentEntry = updatedMarks[studentId][subjectId][examKey];
    const isCurrentlyAbsent = !!currentEntry?.isAbsent;

    updatedMarks[studentId][subjectId][examKey] = {
      marks: undefined,
      isAbsent: !isCurrentlyAbsent,
    };

    onUpdateAppData({ ...appData, marks: updatedMarks });
    triggerAutoSave();
  };

  // BULK ACTION 1: Apply Mark to All or Empty Students
  const handleBulkFill = (onlyEmpty = false) => {
    if (bulkMarkInput === '') {
      setErrorMessage('કૃપા કરીને ભરવા માટેના ગુણ દાખલ કરો.');
      return;
    }
    const num = Number(bulkMarkInput);
    if (isNaN(num) || num < 0 || num > maxAllowed) {
      setErrorMessage(`ગુણ ૦ થી ${maxAllowed} ની વચ્ચે હોવા જોઈએ.`);
      return;
    }

    const updatedMarks: StudentMarksRecord = { ...appData.marks };
    let filledCount = 0;

    for (const st of classStudents) {
      if (!updatedMarks[st.id]) updatedMarks[st.id] = {};
      if (!updatedMarks[st.id][selectedSubjectId]) updatedMarks[st.id][selectedSubjectId] = {} as any;

      const existing = updatedMarks[st.id][selectedSubjectId][selectedExamKey];
      if (onlyEmpty) {
        if (existing?.marks === undefined && !existing?.isAbsent) {
          updatedMarks[st.id][selectedSubjectId][selectedExamKey] = { marks: num, isAbsent: false };
          filledCount++;
        }
      } else {
        updatedMarks[st.id][selectedSubjectId][selectedExamKey] = { marks: num, isAbsent: false };
        filledCount++;
      }
    }

    onUpdateAppData({ ...appData, marks: updatedMarks });
    triggerAutoSave();
    setSubmitToast(`સફળતા! ${filledCount} વિદ્યાર્થીઓમાં ગુણ (${num}) એકી સાથે દાખલ થઈ ગયા છે.`);
    setTimeout(() => setSubmitToast(null), 3000);
    setBulkMarkInput('');
  };

  // BULK ACTION 2: Quick Percentage Presets
  const handlePresetFill = (pct: number) => {
    const calculatedMark = Math.round((maxAllowed * pct) / 100);
    const updatedMarks: StudentMarksRecord = { ...appData.marks };
    let filledCount = 0;

    for (const st of classStudents) {
      if (!updatedMarks[st.id]) updatedMarks[st.id] = {};
      if (!updatedMarks[st.id][selectedSubjectId]) updatedMarks[st.id][selectedSubjectId] = {} as any;
      updatedMarks[st.id][selectedSubjectId][selectedExamKey] = { marks: calculatedMark, isAbsent: false };
      filledCount++;
    }

    onUpdateAppData({ ...appData, marks: updatedMarks });
    triggerAutoSave();
    setSubmitToast(`સફળતા! બધા ${filledCount} વિદ્યાર્થીઓમાં ${pct}% મુજબ (${calculatedMark}/${maxAllowed} ગુણ) એકી સાથે ભરાઈ ગયા.`);
    setTimeout(() => setSubmitToast(null), 3000);
  };

  // BULK ACTION 3: Sequential / Comma-separated Quick Entry
  const handleApplySequential = () => {
    if (!seqMarksInput.trim()) {
      setErrorMessage('કૃપા કરીને અલ્પવિરામ કે સ્પેસ સાથે ગુણ લખો (દા.ત. 36, 38, 28, 40, 32...)');
      return;
    }
    const rawTokens = seqMarksInput.split(/[\n,\s\t]+/).map(t => t.trim()).filter(Boolean);
    if (rawTokens.length === 0) return;

    const updatedMarks: StudentMarksRecord = { ...appData.marks };
    let filledCount = 0;

    rawTokens.forEach((token, index) => {
      if (index >= classStudents.length) return;
      const st = classStudents[index];
      if (!updatedMarks[st.id]) updatedMarks[st.id] = {};
      if (!updatedMarks[st.id][selectedSubjectId]) updatedMarks[st.id][selectedSubjectId] = {} as any;

      const upper = token.toUpperCase();
      if (upper === 'AB' || upper === 'A' || upper === 'ગેરહાજર') {
        updatedMarks[st.id][selectedSubjectId][selectedExamKey] = { marks: undefined, isAbsent: true };
        filledCount++;
      } else {
        const val = Number(token);
        if (!isNaN(val) && val >= 0 && val <= maxAllowed) {
          updatedMarks[st.id][selectedSubjectId][selectedExamKey] = { marks: val, isAbsent: false };
          filledCount++;
        }
      }
    });

    onUpdateAppData({ ...appData, marks: updatedMarks });
    triggerAutoSave();
    setSubmitToast(`સફળતા! રોલ નં. ૧ થી ક્રમશઃ ${filledCount} વિદ્યાર્થીઓમાં ગુણ એકી સાથે દાખલ થઈ ગયા છે.`);
    setTimeout(() => setSubmitToast(null), 3000);
    setSeqMarksInput('');
  };

  // SUBMIT MARKS HANDLER (મુખ્ય સબમિટ અને સેવ બટન ક્રિયા)
  const handleSubmitMarks = () => {
    setErrorMessage(null);
    let enteredCount = 0;
    let absentCount = 0;
    let totalSlots = 0;

    if (entryMode === 'all_subjects_matrix') {
      classStudents.forEach((st) => {
        standardSubjects.forEach((sub) => {
          totalSlots++;
          const entry = appData.marks[st.id]?.[sub.id]?.[selectedExamKey];
          if (entry?.isAbsent) {
            absentCount++;
          } else if (entry?.marks !== undefined && entry?.marks !== null) {
            enteredCount++;
          }
        });
      });
    } else {
      classStudents.forEach((st) => {
        totalSlots++;
        const entry = appData.marks[st.id]?.[selectedSubjectId]?.[selectedExamKey];
        if (entry?.isAbsent) {
          absentCount++;
        } else if (entry?.marks !== undefined && entry?.marks !== null) {
          enteredCount++;
        }
      });
    }

    const pendingCount = Math.max(0, totalSlots - enteredCount - absentCount);

    // Save and commit app state
    onUpdateAppData({ ...appData });
    triggerAutoSave();

    const now = new Date();
    const timeStr = now.toLocaleTimeString('gu-IN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('gu-IN');

    setSubmitStats({
      totalStudents: classStudents.length,
      totalSlots,
      enteredCount,
      absentCount,
      pendingCount,
      standard: selectedStandard,
      division: selectedDivision,
      examName: currentExam.name,
      subjectName: entryMode === 'single_subject' ? currentSubject?.name : 'બધા ૭ વિષયો (સંયુક્ત ગ્રીડ)',
      timestamp: `${dateStr} ${timeStr}`,
    });

    setIsSubmitModalOpen(true);
    setSubmitToast(`ધોરણ ${selectedStandard} ના ગુણ સફળતાપૂર્વક સબમિટ અને સાચવાઈ ગયા છે!`);
    setTimeout(() => setSubmitToast(null), 4000);
  };

  // BULK ACTION 4: Batch Paste Column of Marks
  const handleApplyPaste = () => {
    if (!pasteText.trim()) {
      setPasteNotice('કૃપા કરીને ગુણની યાદી પેસ્ટ કરો.');
      return;
    }

    // Split by newlines, tabs, or commas
    const rawTokens = pasteText
      .split(/[\n,\t\r]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (rawTokens.length === 0) {
      setPasteNotice('કોઈ માન્ય ગુણ મળ્યા નથી.');
      return;
    }

    const updatedMarks: StudentMarksRecord = { ...appData.marks };
    let successCount = 0;
    const errors: string[] = [];

    rawTokens.forEach((token, index) => {
      if (index >= classStudents.length) return;
      const st = classStudents[index];

      if (!updatedMarks[st.id]) updatedMarks[st.id] = {};
      if (!updatedMarks[st.id][selectedSubjectId]) updatedMarks[st.id][selectedSubjectId] = {} as any;

      const upper = token.toUpperCase();
      if (upper === 'AB' || upper === 'A' || upper === 'ગેરહાજર') {
        updatedMarks[st.id][selectedSubjectId][selectedExamKey] = { marks: undefined, isAbsent: true };
        successCount++;
      } else {
        const val = Number(token);
        if (!isNaN(val) && val >= 0 && val <= maxAllowed) {
          updatedMarks[st.id][selectedSubjectId][selectedExamKey] = { marks: val, isAbsent: false };
          successCount++;
        } else {
          errors.push(`રોલ ${st.rollNumber}: અમાન્ય ગુણ (${token})`);
        }
      }
    });

    onUpdateAppData({ ...appData, marks: updatedMarks });
    triggerAutoSave();

    if (errors.length > 0) {
      setPasteNotice(`સફળ: ${successCount} વિદ્યાર્થીઓ. કેટલીક ભૂલો: ${errors.slice(0, 3).join(', ')}`);
    } else {
      setPasteNotice(`સફળતા! ${successCount} વિદ્યાર્થીઓના ગુણ એકી સાથે પેસ્ટ થઈ ગયા!`);
      setTimeout(() => {
        setIsPasteModalOpen(false);
        setPasteText('');
        setPasteNotice(null);
      }, 1500);
    }
  };

  // Quick Action: Fill all blank with absent / present
  const handleMarkAllAbsentPresent = (setAbsent: boolean) => {
    const updatedMarks: StudentMarksRecord = { ...appData.marks };
    for (const st of classStudents) {
      if (!updatedMarks[st.id]) updatedMarks[st.id] = {};
      if (!updatedMarks[st.id][selectedSubjectId]) updatedMarks[st.id][selectedSubjectId] = {} as any;

      if (setAbsent) {
        updatedMarks[st.id][selectedSubjectId][selectedExamKey] = {
          marks: undefined,
          isAbsent: true,
        };
      } else {
        const curr = updatedMarks[st.id][selectedSubjectId][selectedExamKey];
        if (curr?.isAbsent) {
          updatedMarks[st.id][selectedSubjectId][selectedExamKey] = {
            marks: undefined,
            isAbsent: false,
          };
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Config Header with 3D Pop Design */}
      <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-xl card-3d">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-200 mb-1 badge-3d">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>એકી સાથે બલ્ક ગુણ નોંધણી પ્રણાલી (Bulk Marks Entry)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading flex items-center gap-2">
              <Edit3 className="w-6 h-6 text-blue-600" /> ગુણ નોંધણી – પરીક્ષા અને વિષયવાર
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              બધા જ વિદ્યાર્થીઓના ગુણ એકી સાથે દાખલ કરો અથવા આખા વર્ગનો સંયુક્ત ગ્રીડ વાપરો
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {savedNotice && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-black animate-pulse badge-3d">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" /> આપમેળે સાચવાઈ ગયું!
              </div>
            )}

            {/* Submit Button in Header (સબમિટ બટન) */}
            <button
              onClick={handleSubmitMarks}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/25 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 transition-all btn-3d"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>સબમિટ કરો (Submit)</span>
            </button>

            {/* Mode Toggle: All Subjects Matrix vs Single Subject */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
              <button
                onClick={() => setEntryMode('all_subjects_matrix')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  entryMode === 'all_subjects_matrix'
                    ? 'bg-blue-600 text-white shadow-md transform -translate-y-0.5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>બધા વિષયો સંયુક્ત ગ્રીડ</span>
              </button>
              <button
                onClick={() => setEntryMode('single_subject')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  entryMode === 'single_subject'
                    ? 'bg-blue-600 text-white shadow-md transform -translate-y-0.5'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>એક વિષય કોષ્ટક</span>
              </button>
            </div>
          </div>
        </div>

        {/* Submit Toast / Notice Banner */}
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

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          {/* Standard Selector */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">૧. ધોરણ પસંદ કરો:</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
              {([6, 7, 8] as const).map((std) => (
                <button
                  key={std}
                  onClick={() => setSelectedStandard(std)}
                  className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    selectedStandard === std
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ધોરણ {std}
                </button>
              ))}
            </div>
          </div>

          {/* Division Selector */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">૨. વર્ગ પસંદ કરો:</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
              {(['all', 'A', 'B'] as const).map((div) => (
                <button
                  key={div}
                  onClick={() => setSelectedDivision(div)}
                  className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    selectedDivision === div
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {div === 'all' ? 'બધા' : `વર્ગ ${div}`}
                </button>
              ))}
            </div>
          </div>

          {/* Exam Selector */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">૩. પરીક્ષા / કસોટી:</label>
            <select
              value={selectedExamKey}
              onChange={(e) => setSelectedExamKey(e.target.value as ExamKey)}
              className="w-full py-2 px-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-black text-blue-800 focus:ring-2 focus:ring-blue-500 shadow-xs"
            >
              {EXAM_CONFIGS.map((exam) => (
                <option key={exam.key} value={exam.key}>
                  {exam.name} ({currentSubject?.maxMarks[exam.key] || exam.defaultMaxMarks} ગુણ)
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selector (if single subject mode) */}
          {entryMode === 'single_subject' ? (
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">૪. વિષય પસંદ કરો (મુખ્ય ૭ વિષયો):</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full py-2 px-3 bg-white border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-black text-slate-800 focus:ring-2 focus:ring-blue-500 shadow-xs"
              >
                {standardSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col justify-end">
              <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 border-2 border-emerald-300 rounded-xl p-2 text-center shadow-xs">
                ✨ આખા વર્ગના મુખ્ય ૭ વિષયો એકી સાથે સ્ક્રીન પર ખુલ્લા છે
              </span>
            </div>
          )}
        </div>
      </div>

      {/* BULK MARKS TOOLBAR (બધા વિદ્યાર્થીઓના ગુણ એકી સાથે દાખલ કરો) */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-3xl p-4 sm:p-5 shadow-lg card-3d space-y-3.5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-blue-200/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md badge-3d">
              <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
            </div>
            <div>
              <h4 className="font-black text-sm sm:text-base text-slate-900 font-heading flex items-center gap-2">
                <span>બધા વિદ્યાર્થીઓના ગુણ એકી સાથે દાખલ કરો</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-900 border border-blue-300">
                  Bulk Fast Entry
                </span>
              </h4>
              <p className="text-xs text-slate-600">
                વિષય: <strong className="text-blue-700">{currentSubject.name}</strong> • કસોટી: <strong className="text-indigo-700">{currentExam.name}</strong> (મહત્તમ <strong className="text-slate-900 font-black">{maxAllowed}</strong> ગુણ)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsPasteModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5 btn-3d"
            >
              <ClipboardPaste className="w-4 h-4" />
              <span>Excel / લિસ્ટ પેસ્ટ કરો</span>
            </button>
          </div>
        </div>

        {/* METHOD 1: Uniform Mark to All + Presets */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-slate-700 whitespace-nowrap">પદ્ધતિ ૧ (સરખા ગુણ):</span>
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border-2 border-blue-300 shadow-xs">
              <label className="text-xs font-black text-slate-600">ગુણ:</label>
              <input
                type="number"
                min={0}
                max={maxAllowed}
                placeholder={`૦-${maxAllowed}`}
                value={bulkMarkInput}
                onChange={(e) => setBulkMarkInput(e.target.value)}
                className="w-16 text-center py-0.5 px-1 font-black text-sm text-blue-950 focus:outline-hidden"
              />
            </div>
            <button
              onClick={() => handleBulkFill(false)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer btn-3d"
            >
              બધામાં ભરો
            </button>
            <button
              onClick={() => handleBulkFill(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer btn-3d"
            >
              માત્ર ખાલીમાં ભરો
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500">ઝડપી ટકા:</span>
            {[
              { label: `પૂર્ણ (${maxAllowed})`, pct: 100, color: 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200' },
              { label: `૯૦% (${Math.round(maxAllowed * 0.9)})`, pct: 90, color: 'bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200' },
              { label: `૭૫% (${Math.round(maxAllowed * 0.75)})`, pct: 75, color: 'bg-indigo-100 text-indigo-900 border-indigo-300 hover:bg-indigo-200' },
              { label: `૫૦% (${Math.round(maxAllowed * 0.5)})`, pct: 50, color: 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' },
              { label: `૩૩% (${Math.ceil(maxAllowed * 0.33)})`, pct: 33, color: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200' },
            ].map((p) => (
              <button
                key={p.pct}
                onClick={() => handlePresetFill(p.pct)}
                className={`px-2 py-1 rounded-lg text-[11px] font-black border transition-all cursor-pointer ${p.color}`}
                title={`બધા વિદ્યાર્થીઓમાં ${p.pct}% ગુણ ભરો`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* METHOD 2: Sequential Comma-separated list */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-2 border-t border-blue-200/40">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <span className="text-xs font-black text-slate-700 whitespace-nowrap">પદ્ધતિ ૨ (ક્રમિક ગુણ):</span>
            <input
              type="text"
              placeholder="રોલ ૧, ૨, ૩... મુજબ ગુણ દા.ત. 36, 38, 29, 40, 32, 35..."
              value={seqMarksInput}
              onChange={(e) => setSeqMarksInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplySequential();
              }}
              className="w-full max-w-md bg-white border-2 border-blue-300 px-3 py-1.5 rounded-xl text-xs font-black text-blue-950 placeholder:text-slate-400 placeholder:font-normal focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
            <button
              onClick={handleApplySequential}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap btn-3d"
            >
              રોલ વાઈઝ એકી સાથે ભરો
            </button>
          </div>

          <div className="text-[11px] font-bold text-slate-500 bg-white/70 px-2.5 py-1 rounded-lg border border-blue-100">
            ⌨️ Enter અથવા ↓ દબાવી તરત આગલા વિદ્યાર્થી પર જાઓ
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 text-rose-900 text-xs sm:text-sm font-black flex items-center justify-between gap-3 shadow-md animate-shake">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-black text-rose-600 hover:text-rose-900 px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* VIEW 1: ALL SUBJECTS SIMULTANEOUS MATRIX GRID (બધા વિષયો એકી સાથે) */}
      {entryMode === 'all_subjects_matrix' ? (
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden card-3d">
          <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-pink-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-black text-slate-900 text-base font-heading flex items-center gap-2">
                <Columns className="w-5 h-5 text-blue-600" /> આખા વર્ગનો સંયુક્ત ગ્રીડ – {currentExam.name}
              </span>
              <p className="text-xs text-slate-500">
                દરેક વિદ્યાર્થી માટે બધા વિષયોના ગુણ એકી સાથે દાખલ કરો. (Tab કી દબાવી આગલા ખાનામાં જઈ શકાય છે)
              </p>
            </div>
            <span className="text-xs font-black px-3 py-1 bg-blue-100 text-blue-900 rounded-full border border-blue-200">
              કુલ {classStudents.length} વિદ્યાર્થીઓ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-300 text-slate-800 font-black">
                  <th className="py-3 px-3 w-14 text-center">રોલ</th>
                  <th className="py-3 px-3 w-20">GR નં</th>
                  <th className="py-3 px-3 min-w-[170px]">વિદ્યાર્થીનું નામ</th>
                  {standardSubjects.map((sub) => {
                    const maxM = sub.maxMarks[selectedExamKey] || 80;
                    return (
                      <th key={sub.id} className="py-3 px-2 text-center min-w-[100px]">
                        <div className="truncate font-bold text-slate-800">{sub.name.split(' ')[0]}</div>
                        <div className="text-[10px] text-blue-700 font-black">/{maxM} ગુણ</div>
                      </th>
                    );
                  })}
                  <th className="py-3 px-3 text-center bg-blue-100 text-blue-950 font-black min-w-[90px]">
                    કુલ મેળવેલા
                  </th>
                  <th className="py-3 px-3 text-center bg-indigo-100 text-indigo-950 font-black min-w-[70px]">
                    ટકા (%)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5 + standardSubjects.length} className="py-8 text-center text-slate-400">
                      ધોરણ {selectedStandard} માં કોઈ વિદ્યાર્થી નોંધાયેલા નથી.
                    </td>
                  </tr>
                ) : (
                  classStudents.map((st, stIdx) => {
                    let studentTotal = 0;
                    let studentMax = 0;
                    let enteredCount = 0;

                    return (
                      <tr key={st.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-2.5 px-3 text-center font-black text-slate-900 text-sm">
                          {st.rollNumber}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-xs text-slate-800">
                          {st.grNumber}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {st.name}
                          <span className="text-[10px] text-slate-400 ml-1">({st.division})</span>
                        </td>

                        {/* Subject Marks Columns */}
                        {standardSubjects.map((sub, subIdx) => {
                          const maxM = sub.maxMarks[selectedExamKey] || 80;
                          studentMax += maxM;

                          const entry = appData.marks[st.id]?.[sub.id]?.[selectedExamKey];
                          const isAbsent = !!entry?.isAbsent;
                          const val = entry?.marks;
                          if (!isAbsent && val !== undefined) {
                            studentTotal += val;
                            enteredCount++;
                          }

                          return (
                            <td key={sub.id} className="py-2 px-1 text-center">
                              {isAbsent ? (
                                <button
                                  onClick={() => toggleAbsent(st.id, sub.id, selectedExamKey)}
                                  className="px-2 py-1 bg-rose-100 text-rose-800 font-black text-xs rounded-lg"
                                  title="હાજર કરવા ક્લિક કરો"
                                >
                                  AB
                                </button>
                              ) : (
                                <div className="relative inline-block">
                                  <input
                                    id={`matrix_input_${stIdx}_${subIdx}`}
                                    type="number"
                                    min={0}
                                    max={maxM}
                                    placeholder="-"
                                    value={val !== undefined ? val : ''}
                                    onKeyDown={(e) => handleInputKeyDown(e, stIdx, subIdx)}
                                    onChange={(e) =>
                                      handleMarkChange(st.id, sub.id, selectedExamKey, e.target.value)
                                    }
                                    className={`w-16 text-center py-1 px-1 border-2 rounded-xl font-black text-sm transition-all focus:ring-2 focus:ring-blue-500 ${
                                      val !== undefined
                                        ? 'bg-white border-blue-300 text-blue-950 shadow-2xs'
                                        : 'bg-slate-50 border-slate-300 text-slate-600'
                                    }`}
                                  />
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {/* Row Total & Percentage */}
                        <td className="py-2.5 px-3 text-center font-black text-blue-950 bg-blue-50/50 text-sm">
                          {studentTotal} <span className="text-[10px] text-slate-400 font-normal">/{studentMax}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-indigo-700 bg-indigo-50/50 text-sm">
                          {studentMax > 0 && enteredCount > 0
                            ? `${Math.round((studentTotal / studentMax) * 100)}%`
                            : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Matrix Footer Action Bar with Submit Button */}
          <div className="p-4 bg-gradient-to-r from-slate-50 via-blue-50/40 to-emerald-50/40 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-slate-700 flex-wrap">
              <div className="flex items-center gap-1.5 font-black text-slate-900">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>કુલ વિદ્યાર્થીઓ: <strong>{classStudents.length}</strong></span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="font-semibold text-slate-600">
                કસોટી: <strong className="text-blue-900">{currentExam.name}</strong>
              </div>
              <span className="text-slate-300">•</span>
              <div className="font-semibold text-slate-600">
                વિષયો: <strong className="text-indigo-900">{standardSubjects.length} મુખ્ય વિષયો</strong>
              </div>
            </div>

            <button
              onClick={handleSubmitMarks}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/25 cursor-pointer btn-3d transform hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span>બધા વિષયોના ગુણ સબમિટ કરો (Submit Marks) ✨</span>
            </button>
          </div>
        </div>
      ) : (
        /* VIEW 2: SINGLE SUBJECT TABLE */
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden card-3d">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <div>
                <span className="font-black text-slate-900 text-base font-heading">
                  {currentSubject?.name} – {currentExam.name}
                </span>
                <span className="ml-2 text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                  મહત્તમ ગુણ: {maxAllowed}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-bold">ઝડપી હાજરી:</span>
              <button
                onClick={() => handleMarkAllAbsentPresent(false)}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-bold cursor-pointer"
              >
                બધાને હાજર કરો
              </button>
              <button
                onClick={() => handleMarkAllAbsentPresent(true)}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-rose-700 font-bold cursor-pointer"
              >
                બધાને ગેરહાજર કરો
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-black">
                  <th className="py-3 px-4 w-16 text-center">રોલ નં</th>
                  <th className="py-3 px-4 w-28">GR નંબર</th>
                  <th className="py-3 px-4">વિદ્યાર્થીનું નામ</th>
                  <th className="py-3 px-4 w-32 text-center">ગેરહાજર (AB)?</th>
                  <th className="py-3 px-4 w-44 text-center">મેળવેલા ગુણ (/{maxAllowed})</th>
                  <th className="py-3 px-4 w-28 text-center">ટકાવારી (%)</th>
                  <th className="py-3 px-4 w-32 text-center">સ્થિતિ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      ધોરણ {selectedStandard} માં કોઈ વિદ્યાર્થી નોંધાયેલા નથી.
                    </td>
                  </tr>
                ) : (
                  classStudents.map((st, stIdx) => {
                    const entry = appData.marks[st.id]?.[selectedSubjectId]?.[selectedExamKey];
                    const isAbsent = !!entry?.isAbsent;
                    const marksVal = entry?.marks;
                    const isEntered = marksVal !== undefined && marksVal !== null;

                    const pct = isEntered ? Number(((marksVal / maxAllowed) * 100).toFixed(1)) : 0;
                    const isPass = pct >= appData.settings.passingPercentage;

                    return (
                      <tr
                        key={st.id}
                        className={`transition-colors ${
                          isAbsent
                            ? 'bg-rose-50/40 hover:bg-rose-50/60'
                            : isEntered
                            ? 'hover:bg-blue-50/30'
                            : 'bg-amber-50/20 hover:bg-amber-50/40'
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-black text-slate-900 text-sm">
                          {st.rollNumber}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-xs text-slate-800">
                          {st.grNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {st.name}
                          <span className="ml-1.5 text-[11px] font-normal text-slate-400">
                            ({st.division})
                          </span>
                        </td>

                        {/* Absent Toggle Checkbox */}
                        <td className="py-3 px-4 text-center">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold px-2 py-1 rounded-lg border transition-all">
                            <input
                              type="checkbox"
                              checked={isAbsent}
                              onChange={() => toggleAbsent(st.id, selectedSubjectId, selectedExamKey)}
                              className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                            />
                            <span className={isAbsent ? 'text-rose-700 font-bold' : 'text-slate-500'}>
                              {isAbsent ? 'ગેરહાજર' : 'હાજર'}
                            </span>
                          </label>
                        </td>

                        {/* Marks Input */}
                        <td className="py-3 px-4 text-center">
                          {isAbsent ? (
                            <div className="py-1 px-3 bg-rose-100 text-rose-800 font-bold text-xs rounded-xl inline-block">
                              ગેરહાજર (AB)
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <input
                                id={`single_input_${stIdx}`}
                                type="number"
                                min={0}
                                max={maxAllowed}
                                step="any"
                                placeholder="ગુણ..."
                                value={marksVal !== undefined ? marksVal : ''}
                                onKeyDown={(e) => handleInputKeyDown(e, stIdx)}
                                onChange={(e) =>
                                  handleMarkChange(st.id, selectedSubjectId, selectedExamKey, e.target.value)
                                }
                                className={`w-24 text-center py-1.5 px-2 border rounded-xl font-black text-base focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                                  isEntered
                                    ? 'bg-white border-blue-400 text-blue-950 shadow-sm'
                                    : 'bg-amber-50/60 border-amber-300 text-slate-700 font-bold'
                                }`}
                              />
                              <span className="text-xs text-slate-700 font-black">/{maxAllowed}</span>
                            </div>
                          )}
                        </td>

                        {/* Percentage */}
                        <td className="py-3 px-4 text-center font-black text-sm">
                          {isAbsent ? (
                            <span className="text-rose-500 text-xs">--</span>
                          ) : isEntered ? (
                            <span className={pct >= 70 ? 'text-emerald-700' : pct >= 33 ? 'text-blue-700' : 'text-rose-700'}>
                              {pct}%
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          {isAbsent ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                              ગેરહાજર
                            </span>
                          ) : isEntered ? (
                            isPass ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                પાસ
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                                નાપાસ
                              </span>
                            )
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              નોંધ બાકી
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Single Subject Footer Action Bar with Submit Button */}
          <div className="p-4 bg-gradient-to-r from-slate-50 via-blue-50/40 to-emerald-50/40 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-slate-700 flex-wrap">
              <div className="flex items-center gap-1.5 font-black text-slate-900">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span>કુલ વિદ્યાર્થીઓ: <strong>{classStudents.length}</strong></span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="font-semibold text-slate-600">
                વિષય: <strong className="text-blue-900">{currentSubject?.name}</strong>
              </div>
              <span className="text-slate-300">•</span>
              <div className="font-semibold text-slate-600">
                મહત્તમ ગુણ: <strong className="text-emerald-800">{maxAllowed}</strong>
              </div>
            </div>

            <button
              onClick={handleSubmitMarks}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/25 cursor-pointer btn-3d transform hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span>{currentSubject?.name} ના ગુણ સબમિટ કરો (Submit Marks) ✨</span>
            </button>
          </div>
        </div>
      )}

      {/* STICKY / FLOATING BOTTOM ACTION STRIP WITH SUBMIT BUTTON */}
      <div className="sticky bottom-4 z-30 bg-slate-900/95 backdrop-blur-md text-white p-3 sm:px-6 sm:py-3.5 rounded-2xl shadow-2xl border-2 border-slate-700/80 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 card-3d">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black flex items-center gap-2">
              <span>ધોરણ {selectedStandard} {selectedDivision !== 'all' ? `(વર્ગ ${selectedDivision})` : ''} – {currentExam.name}</span>
              {entryMode === 'single_subject' && (
                <span className="text-[11px] text-blue-300 font-bold bg-blue-900/60 px-2 py-0.5 rounded-md">
                  {currentSubject?.name}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-300">
              કુલ વિદ્યાર્થીઓ: <strong>{classStudents.length}</strong> • ગુણ સબમિટ અને સેવ કરવા માટે સબમિટ બટન દબાવો
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSubmitMarks}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/30 cursor-pointer transform hover:scale-105 active:scale-95 transition-all btn-3d"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>સબમિટ કરો (Submit Marks)</span>
          </button>
        </div>
      </div>

      {/* SUBMIT SUCCESS MODAL */}
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
                    ગુણ સબમિટ થઈ ગયા છે!
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3 mb-4 leading-relaxed">
              શ્રી ભીખાપુરા પ્રાથમિક શાળાના ડેટાબેઝમાં ધોરણ {submitStats.standard} ના تمام વિદ્યાર્થીઓના ગુણ રેકોર્ડ સાચવી લેવામાં આવ્યા છે.
            </p>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 gap-2.5 mb-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 text-[11px] block">ધોરણ અને વર્ગ:</span>
                <span className="font-black text-slate-900 text-sm">
                  ધોરણ {submitStats.standard} {submitStats.division === 'all' ? '(બધા વર્ગ)' : `(વર્ગ ${submitStats.division})`}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 text-[11px] block">કસોટી / સત્ર:</span>
                <span className="font-black text-blue-900 text-sm">{submitStats.examName}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 text-[11px] block">વિષય:</span>
                <span className="font-black text-indigo-900 text-sm truncate block">{submitStats.subjectName}</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-emerald-700 text-[11px] block font-bold">ગુણ ભરેલ સંખ્યા:</span>
                <span className="font-black text-emerald-950 text-sm">
                  {submitStats.enteredCount} વિષય-એન્ટ્રીઓ
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 mb-5 flex items-center justify-between">
              <span>કુલ વિદ્યાર્થીઓ: <strong>{submitStats.totalStudents}</strong></span>
              <span>ગેરહાજર: <strong className="text-rose-600">{submitStats.absentCount}</strong></span>
              <span>નોંધણી સમય: <strong>{submitStats.timestamp}</strong></span>
            </div>

            {/* Navigation / Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              {onNavigate && (
                <>
                  <button
                    onClick={() => {
                      setIsSubmitModalOpen(false);
                      onNavigate('result', submitStats.standard);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>પરિણામ લેજર જુઓ</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setIsSubmitModalOpen(false);
                      onNavigate('reportCard', submitStats.standard);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>રિપોર્ટ કાર્ડ જુઓ</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </>
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

      {/* BATCH PASTE MODAL */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-slate-200 card-3d animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 mb-2 text-slate-900 font-heading">
              <ClipboardPaste className="w-6 h-6 text-emerald-600" />
              <h3 className="text-xl font-black">એક્સેલ / યાદીમાંથી એકી સાથે ગુણ પેસ્ટ કરો</h3>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              વિષય: <strong>{currentSubject.name}</strong> • કસોટી: <strong>{currentExam.name}</strong> (મહત્તમ: {maxAllowed} ગુણ)
              <br />
              Excel ની ગુણવાળી કોલમ કોપી કરી અહીં સીધી પેસ્ટ કરો (નવી લાઇન અથવા અલ્પવિરામ વડે અલગ થયેલ ગુણ):
            </p>

            <div className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-600 mb-3">
              ઉદાહરણ:<br />
              35<br />
              38<br />
              AB (ગેરહાજર માટે)<br />
              40
            </div>

            <textarea
              rows={6}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="અહીં ગુણ પેસ્ટ કરો..."
              className="w-full p-3 font-mono font-bold text-sm border-2 border-slate-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 mb-3"
            />

            {pasteNotice && (
              <div className="p-3 rounded-xl text-xs font-bold mb-3 bg-blue-50 text-blue-900 border border-blue-200">
                {pasteNotice}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
              <span>વર્ગમાં કુલ વિદ્યાર્થીઓ: <strong>{classStudents.length}</strong></span>
              <span>
                પેસ્ટ કરેલ ગુણ સંખ્યા: <strong>{pasteText.trim().split(/[\n,\t\r]+/).filter(Boolean).length}</strong>
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsPasteModalOpen(false);
                  setPasteText('');
                  setPasteNotice(null);
                }}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                રદ કરો
              </button>
              <button
                onClick={handleApplyPaste}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 cursor-pointer btn-3d"
              >
                હા, બધા ગુણ એકી સાથે દાખલ કરો ✨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
