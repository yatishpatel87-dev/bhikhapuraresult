import React, { useState } from 'react';
import {
  Printer,
  Download,
  School,
  Award,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Calendar,
  CheckCircle2,
  Sparkles,
  Crown,
  Trophy,
  Flame,
  Star,
  MessageCircle,
  Share2,
} from 'lucide-react';
import { AppData, Standard, Student } from '../types';
import {
  calculateExamSummary,
  calculateFinalStudentResult,
  calculatePatrakASummary,
  calculatePatrakBSummary,
  computeClassMeritList,
  getGradeFromPercentage,
} from '../utils/calculations';
import { StudentProgressChart } from './StudentProgressChart';
import { PrintModal } from './PrintModal';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import {
  triggerBrowserPrint,
  buildReportCardPrintHtml,
  downloadPrintableHtml,
} from '../utils/printHelper';

interface ReportCardProps {
  appData: AppData;
  selectedStudentId?: string;
  onSelectStudent?: (id: string) => void;
}

const SUBJECT_COLORS: Record<string, { bg: string; text: string; bar: string; border: string }> = {
  sub_guj: { bg: 'bg-amber-50', text: 'text-amber-800', bar: 'bg-amber-500', border: 'border-amber-300' },
  sub_hin: { bg: 'bg-rose-50', text: 'text-rose-800', bar: 'bg-rose-500', border: 'border-rose-300' },
  sub_eng: { bg: 'bg-sky-50', text: 'text-sky-800', bar: 'bg-sky-500', border: 'border-sky-300' },
  sub_math: { bg: 'bg-indigo-50', text: 'text-indigo-800', bar: 'bg-indigo-600', border: 'border-indigo-300' },
  sub_sci: { bg: 'bg-emerald-50', text: 'text-emerald-800', bar: 'bg-emerald-500', border: 'border-emerald-300' },
  sub_ss: { bg: 'bg-orange-50', text: 'text-orange-800', bar: 'bg-orange-500', border: 'border-orange-300' },
  sub_sans: { bg: 'bg-purple-50', text: 'text-purple-800', bar: 'bg-purple-500', border: 'border-purple-300' },
  sub_art: { bg: 'bg-pink-50', text: 'text-pink-800', bar: 'bg-pink-500', border: 'border-pink-300' },
};

export const ReportCard: React.FC<ReportCardProps> = ({
  appData,
  selectedStudentId: propStudentId,
}) => {
  const { students, subjects, marks, patrakA, patrakB, settings } = appData;

  const [activeStandard, setActiveStandard] = useState<Standard>(8);
  const [activeStudentId, setActiveStudentId] = useState<string>(
    propStudentId || students[0]?.id || ''
  );
  const [printBatchAll, setPrintBatchAll] = useState<boolean>(false);
  const [themeMode, setThemeMode] = useState<'3d_vibrant' | 'classic'>('3d_vibrant');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);
  const [whatsAppTargetStudent, setWhatsAppTargetStudent] = useState<Student | null>(null);
  const [whatsAppRank, setWhatsAppRank] = useState<number | undefined>(undefined);

  // If propStudentId changes, adjust
  React.useEffect(() => {
    if (propStudentId) {
      setActiveStudentId(propStudentId);
      const st = students.find((s) => s.id === propStudentId);
      if (st) setActiveStandard(st.standard);
    }
  }, [propStudentId, students]);

  const classStudents = students
    .filter((s) => s.standard === activeStandard)
    .sort((a, b) => a.rollNumber - b.rollNumber);

  const currentStudent =
    students.find((s) => s.id === activeStudentId) || classStudents[0] || students[0];

  // Rank computation for current class
  const classResults = classStudents.map((st) =>
    calculateFinalStudentResult(st, subjects, marks, settings)
  );
  const meritRanked = computeClassMeritList(classResults);

  const studentRank = meritRanked.find((r) => r.student.id === currentStudent?.id)?.rank;

  const handleOpenWhatsApp = (student?: Student, rank?: number) => {
    const target = student || currentStudent;
    if (!target) return;
    setWhatsAppTargetStudent(target);
    const r = rank !== undefined ? rank : meritRanked.find((m) => m.student.id === target.id)?.rank;
    setWhatsAppRank(r);
    setIsWhatsAppModalOpen(true);
  };

  // Single Student Report Card renderer with 3D Pop elements
  const renderSingleCard = (student: Student, rankNumber?: number) => {
    const studentSubjects = subjects.filter((s) => s.standards.includes(student.standard));
    const patrakASum = calculatePatrakASummary(student, subjects, patrakA, settings.gradeBoundaries);
    const patrakBSum = calculatePatrakBSummary(
      student.id,
      settings.patrakBComponents,
      patrakB,
      settings.gradeBoundaries
    );
    const finalResult = calculateFinalStudentResult(student, subjects, marks, settings);

    const attPct =
      student.attendance.totalDays > 0
        ? Math.round((student.attendance.presentDays / student.attendance.totalDays) * 100)
        : 0;

    const isTopStudent = rankNumber !== undefined && rankNumber <= 3;
    const isA1 = finalResult.grade === 'A1' || finalResult.grade === 'A2';

    return (
      <div
        key={student.id}
        className={`report-card-container bg-white rounded-3xl border-3 shadow-2xl p-6 sm:p-9 max-w-4xl mx-auto my-6 text-slate-800 page-break relative overflow-hidden ${
          themeMode === '3d_vibrant'
            ? 'card-3d border-indigo-200 ring-4 ring-indigo-50/50'
            : 'border-slate-300'
        }`}
      >
        {/* Hologram / Rainbow decorative top strip */}
        <div className="h-2.5 w-full -mt-6 sm:-mt-9 -mx-6 sm:-mx-9 mb-6 hologram-border" />

        {/* Top-Right Badges & Actions (Merit Ribbon + WhatsApp Quick Share) */}
        <div className="absolute top-4 right-4 flex items-center gap-2 no-print z-10 flex-wrap justify-end">
          {isTopStudent && (
            <div className="px-3 py-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 font-black rounded-full text-xs shadow-md border-2 border-white flex items-center gap-1.5 badge-3d">
              <Crown className="w-4 h-4 text-amber-800" />
              <span>મેરિટ ક્રમ: #{rankNumber}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => handleOpenWhatsApp(student, rankNumber)}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black rounded-full text-xs shadow-md border border-white/60 transition-all cursor-pointer btn-3d"
            title="આ વિદ્યાર્થીનું પરિણામ WhatsApp પર શેર કરો"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp શેર</span>
          </button>
        </div>

        {/* Header with School Details & 3D Emblem */}
        <div className="border-b-2 border-slate-900 pb-5 text-center relative">
          <div className="flex items-center justify-center gap-3.5 mb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-indigo-500/20 border-2 border-white badge-3d shrink-0">
              <School className="w-9 h-9" />
            </div>
            <div className="text-left sm:text-center">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase font-heading">
                {settings.schoolName}
              </h1>
              <p className="text-xs sm:text-sm font-bold text-indigo-700">{settings.schoolTagline}</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">{settings.schoolAddress}</p>
          <div className="inline-flex items-center gap-2 mt-3 px-5 py-1.5 bg-gradient-to-r from-blue-100 via-indigo-100 to-pink-100 print:bg-transparent rounded-full border border-indigo-300 text-xs font-black tracking-wide text-indigo-950 badge-3d">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>વાર્ષિક સર્વગ્રાહી પ્રગતિ પત્રક (રિપોર્ટ કાર્ડ) – શૈક્ષણિક વર્ષ {settings.academicYear}</span>
          </div>
        </div>

        {/* Student Biodata Box with 3D Pop Styling */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 p-4 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 print:bg-white rounded-2xl border-2 border-slate-200 text-xs shadow-xs">
          <div>
            <span className="text-slate-500 block font-semibold">વિદ્યાર્થીનું પૂરું નામ:</span>
            <strong className="text-slate-900 text-base font-heading font-black">{student.name}</strong>
          </div>
          <div>
            <span className="text-slate-500 block font-semibold">ધોરણ અને વર્ગ:</span>
            <strong className="text-slate-900 text-base font-heading font-black">
              ધોરણ {student.standard} - વર્ગ {student.division}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block font-semibold">રોલ નંબર / GR નંબર:</span>
            <strong className="text-slate-900 text-base font-heading font-black">
              રોલ {student.rollNumber} | {student.grNumber}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block font-semibold">હાજરી પ્રમાણ:</span>
            <strong className="text-slate-900 text-base font-heading font-black">
              {student.attendance.presentDays} / {student.attendance.totalDays} દિવસ ({attPct}%)
            </strong>
          </div>
        </div>

        {/* Main Scholastic Evaluation Table */}
        <div className="overflow-x-auto mb-5 rounded-2xl border-2 border-slate-300 shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 via-indigo-50 to-slate-100 print:bg-slate-200 text-slate-900 font-black border-b-2 border-slate-300">
                <th className="p-2.5 border-r border-slate-300">વિષયનું નામ</th>
                <th className="p-2.5 border-r border-slate-300 text-center">પ્રથમ ત્રિમાસિક (૪૦)</th>
                <th className="p-2.5 border-r border-slate-300 text-center">બીજી ત્રિમાસિક (૪૦)</th>
                <th className="p-2.5 border-r border-slate-300 text-center">સત્ર ૧ (૮૦)</th>
                <th className="p-2.5 border-r border-slate-300 text-center">સત્ર ૨ (૮૦)</th>
                <th className="p-2.5 border-r border-slate-300 text-center">સ્વાધ્યાય (૨૦)</th>
                <th className="p-2.5 border-r border-slate-300 text-center bg-blue-100 font-black">
                  કુલ ગુણ
                </th>
                <th className="p-2.5 border-r border-slate-300 text-center bg-indigo-100 font-black">
                  ટકા (%)
                </th>
                <th className="p-2.5 text-center font-black">ગ્રેડ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {studentSubjects.map((sub) => {
                const subEntry = marks[student.id]?.[sub.id] || {};
                const sw = finalResult.subjectWise.find((x) => x.subjectId === sub.id);
                const colorCfg = SUBJECT_COLORS[sub.id] || { bg: '', text: '', bar: 'bg-blue-500', border: '' };

                return (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className={`p-2.5 font-bold border-r border-slate-300 flex items-center gap-2 ${colorCfg.text}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${colorCfg.bar} inline-block shadow-xs`}></span>
                      <span>{sub.name}</span>
                    </td>
                    <td className="p-2.5 text-center border-r border-slate-300 font-mono font-bold text-slate-900">
                      {subEntry.quarterly1?.isAbsent
                        ? 'AB'
                        : subEntry.quarterly1?.marks !== undefined
                        ? subEntry.quarterly1.marks
                        : '-'}
                    </td>
                    <td className="p-2.5 text-center border-r border-slate-300 font-mono font-bold text-slate-900">
                      {subEntry.quarterly2?.isAbsent
                        ? 'AB'
                        : subEntry.quarterly2?.marks !== undefined
                        ? subEntry.quarterly2.marks
                        : '-'}
                    </td>
                    <td className="p-2.5 text-center border-r border-slate-300 font-mono font-bold text-slate-900">
                      {subEntry.sem1?.isAbsent
                        ? 'AB'
                        : subEntry.sem1?.marks !== undefined
                        ? subEntry.sem1.marks
                        : '-'}
                    </td>
                    <td className="p-2.5 text-center border-r border-slate-300 font-mono font-bold text-slate-900">
                      {subEntry.sem2?.isAbsent
                        ? 'AB'
                        : subEntry.sem2?.marks !== undefined
                        ? subEntry.sem2.marks
                        : '-'}
                    </td>
                    <td className="p-2.5 text-center border-r border-slate-300 font-mono font-bold text-slate-900">
                      {subEntry.assignment?.isAbsent
                        ? 'AB'
                        : subEntry.assignment?.marks !== undefined
                        ? subEntry.assignment.marks
                        : '-'}
                    </td>
                    <td className="p-2.5 text-center border-r border-slate-300 font-black bg-blue-50/70 text-blue-950 font-heading text-sm">
                      {sw ? `${sw.totalObtained} / ${sw.totalMax}` : '-'}
                    </td>
                    <td className="p-2.5 text-center border-r border-slate-300 font-black text-indigo-700">
                      {sw ? (
                        <div className="flex flex-col items-center">
                          <span>{sw.percentage}%</span>
                          <div className="w-14 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full ${colorCfg.bar} rounded-full`}
                              style={{ width: `${Math.min(100, sw.percentage)}%` }}
                            />
                          </div>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="p-2.5 text-center font-black">
                      {sw ? (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-slate-100 border border-slate-300">
                          {sw.grade}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Visual Progress Chart for Student (Unit Test 1, Unit Test 2, Session 1, Session 2) */}
        <StudentProgressChart
          student={student}
          studentSubjects={studentSubjects}
          marks={marks}
          themeMode={themeMode}
        />

        {/* Patrak A and Patrak B Summary Grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Patrak A Mini Box */}
          <div className="p-4 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 print:bg-white rounded-2xl border-2 border-indigo-200 text-xs shadow-xs">
            <div className="font-black text-indigo-950 pb-2 border-b border-indigo-200 flex justify-between items-center">
              <span className="font-heading text-sm">પત્રક A (વિષયવાર સર્વગ્રાહી મૂલ્યાંકન - ૪૦ ગુણ):</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-600 text-white shadow-xs">
                ગ્રેડ {patrakASum.grade}
              </span>
            </div>
            <div className="pt-2 text-indigo-900 font-black text-sm">
              કુલ મેળવેલા: {patrakASum.totalObtained} / {patrakASum.totalMax} ({patrakASum.percentage}%)
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-2 text-[11px] text-slate-700">
              {patrakASum.subjectDetails.slice(0, 6).map((sd) => (
                <div key={sd.subjectId} className="truncate bg-white/70 p-1 rounded-lg border border-indigo-100">
                  • {sd.subjectName.split(' ')[0]}: <strong>{sd.obtainedMarks ?? '-'}</strong> ({sd.grade})
                </div>
              ))}
            </div>
          </div>

          {/* Patrak B Mini Box */}
          <div className="p-4 bg-gradient-to-br from-emerald-50/60 to-teal-50/60 print:bg-white rounded-2xl border-2 border-emerald-200 text-xs shadow-xs">
            <div className="font-black text-emerald-950 pb-2 border-b border-emerald-200 flex justify-between items-center">
              <span className="font-heading text-sm">પત્રક B (વ્યક્તિત્વ વિકાસ - ૪૦૦ ગુણ):</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs">
                ગ્રેડ {patrakBSum.grade}
              </span>
            </div>
            <div className="pt-2 text-emerald-900 font-black text-sm">
              કુલ મેળવેલા: {patrakBSum.totalObtained} / ૪૦૦ ({patrakBSum.percentage}%)
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-2 text-[11px] text-slate-700">
              {patrakBSum.componentDetails.slice(0, 4).map((cd) => (
                <div key={cd.componentId} className="truncate bg-white/70 p-1 rounded-lg border border-emerald-100">
                  • {cd.componentName.split(' ')[1] || cd.componentName.slice(0, 10)}: <strong>{cd.obtainedMarks ?? '-'}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3D POP FINAL ACADEMIC SUMMARY BANNER */}
        <div className="p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white rounded-2xl shadow-xl border-2 border-indigo-400 print:bg-white print:text-black print:border-black flex flex-wrap items-center justify-between gap-4 mb-5 card-3d">
          <div>
            <span className="text-blue-200 print:text-slate-600 block text-xs font-bold">વાર્ષિક કુલ પરિણામ</span>
            <div className="text-2xl sm:text-3xl font-black font-heading text-yellow-300 print:text-black">
              {finalResult.totalObtained} / {finalResult.totalMax}
            </div>
            <div className="text-xs text-blue-100 print:text-slate-600">
              સમગ્ર ટકાવારી: <strong className="text-white print:text-black">{finalResult.percentage}%</strong>
            </div>
          </div>

          <div className="text-center">
            <span className="text-blue-200 print:text-slate-600 block text-xs font-bold">અંતિમ ગ્રેડ</span>
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-3xl font-black font-heading text-white print:text-black shadow-inner badge-3d mx-auto">
              {finalResult.grade}
            </div>
          </div>

          <div className="text-center">
            <span className="text-blue-200 print:text-slate-600 block text-xs font-bold">પરિણામ સ્થિતિ</span>
            <div
              className={`mt-1 text-base font-black px-4 py-1.5 rounded-2xl shadow-md border-2 border-white/30 badge-3d ${
                finalResult.status === 'પાસ'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {finalResult.status}
            </div>
          </div>

          {settings.showRankInReportCard && (
            <div className="text-center">
              <span className="text-blue-200 print:text-slate-600 block text-xs font-bold">વર્ગમાં ક્રમાંક</span>
              <div className="text-2xl sm:text-3xl font-black font-heading text-amber-300 print:text-black flex items-center justify-center gap-1">
                <Trophy className="w-6 h-6 text-yellow-300" />
                <span>{rankNumber || studentRank ? `#${rankNumber || studentRank}` : '-'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Teacher's Remarks Box */}
        <div className="p-3.5 bg-slate-50 print:bg-white rounded-2xl border border-slate-200 text-xs mb-4">
          <strong className="text-slate-700">શિક્ષકની નોંધ / અભિપ્રાય: </strong>
          <span className="text-slate-900 font-medium italic">
            {student.remarks || 'વિદ્યાર્થી અભ્યાસ અને સહઅભ્યાસિક પ્રવૃત્તિઓમાં ઉત્સાહ દાખવે છે.'}
          </span>
        </div>

        {/* Quick WhatsApp Share Action Strip */}
        <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 print:hidden rounded-2xl border border-emerald-200/80 mb-6 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-950 font-bold">
            <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>આ પરિણામ વાલીશ્રીને વોટ્સએપ પર સુંદર ગુજરાતી ફોર્મેટમાં મોકલવા માટે:</span>
          </div>
          <button
            type="button"
            onClick={() => handleOpenWhatsApp(student, rankNumber)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black rounded-xl text-xs shadow-sm transition-all cursor-pointer btn-3d"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>વોટ્સએપ મેસેજ તૈયાર કરો 💬</span>
          </button>
        </div>

        {/* Signature Box */}
        <div className="flex justify-between items-end pt-12 text-xs text-slate-800 border-t-2 border-slate-200">
          <div className="text-center">
            <div className="w-36 border-t-2 border-slate-500 mb-1 mx-auto"></div>
            <span className="font-bold">વર્ગ શિક્ષકની સહી</span>
          </div>
          <div className="text-center">
            <div className="w-36 border-t-2 border-slate-500 mb-1 mx-auto"></div>
            <span className="font-bold">વાલીશ્રીની સહી</span>
          </div>
          <div className="text-center">
            <div className="w-40 border-t-2 border-slate-500 mb-1 mx-auto"></div>
            <span className="font-black text-sm">આચાર્યશ્રીની સહી & સિક્કો</span>
            <div className="text-[11px] text-slate-500 font-medium">{settings.principalName}</div>
          </div>
        </div>
      </div>
    );
  };

  const handlePrint = () => {
    // 1. Open the helpful Print & Download Dialog
    setIsPrintModalOpen(true);
    // 2. Also try direct browser print immediately
    triggerBrowserPrint();
  };

  const handleDownloadReportCardHtml = () => {
    const studentsToExport = printBatchAll ? classStudents : currentStudent ? [currentStudent] : [];
    if (studentsToExport.length === 0) return;

    const html = buildReportCardPrintHtml(studentsToExport, appData, true);
    const fileName = printBatchAll
      ? `${settings.schoolName || 'School'}_Std${activeStandard}_All_ReportCards`
      : `${settings.schoolName || 'School'}_Std${currentStudent?.standard}_Roll${currentStudent?.rollNumber}_${currentStudent?.name || 'ReportCard'}`;

    downloadPrintableHtml(
      printBatchAll ? `ધોરણ ${activeStandard} ના રિપોર્ટ કાર્ડ્સ` : `${currentStudent?.name} - રિપોર્ટ કાર્ડ`,
      html,
      fileName,
      'portrait'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Controller Header */}
      <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-lg no-print card-3d">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> કલરફુલ 3D પોપ રિપોર્ટ કાર્ડ
            </div>
            <h2 className="text-2xl font-black text-slate-900 font-heading flex items-center gap-2">
              <Printer className="w-6 h-6 text-indigo-600" /> વિદ્યાર્થી પ્રગતિ પત્રક (રિપોર્ટ કાર્ડ)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              સત્તાવાર માર્કશીટ, પત્રક A, પત્રક B અને ગ્રેડિંગનું સુંદર 3D પ્રિન્ટેબલ પરિણામ
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <label className="flex items-center gap-2 text-xs font-black text-slate-700 cursor-pointer bg-slate-100 px-3.5 py-2.5 rounded-2xl border border-slate-300 hover:bg-slate-200 transition-all">
              <input
                type="checkbox"
                checked={printBatchAll}
                onChange={(e) => setPrintBatchAll(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span>આખા વર્ગના બધા કાર્ડ પ્રિન્ટ કરો (Batch Print)</span>
            </label>

            <button
              onClick={() => handleOpenWhatsApp(currentStudent, studentRank)}
              disabled={!currentStudent}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs sm:text-sm font-black rounded-2xl shadow-xl shadow-emerald-600/25 transition-all cursor-pointer btn-3d"
              title="વિદ્યાર્થી પરિણામ WhatsApp પર શેર કરો"
            >
              <MessageCircle className="w-4 h-4" />
              <span>વોટ્સએપ શેર (WhatsApp) 💬</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs sm:text-sm font-black rounded-2xl shadow-xl shadow-indigo-500/25 transition-all cursor-pointer btn-3d"
            >
              <Printer className="w-4 h-4" />
              <span>પ્રિન્ટ / Save as PDF ✨</span>
            </button>
          </div>
        </div>

        {/* Student Selector */}
        {!printBatchAll && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">૧. ધોરણ પસંદ કરો:</label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                {([6, 7, 8] as const).map((std) => (
                  <button
                    key={std}
                    onClick={() => {
                      setActiveStandard(std);
                      const first = students.find((s) => s.standard === std);
                      if (first) setActiveStudentId(first.id);
                    }}
                    className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                      activeStandard === std
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md transform -translate-y-0.5'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ધોરણ {std}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">૨. વિદ્યાર્થી પસંદ કરો:</label>
              <select
                value={activeStudentId}
                onChange={(e) => setActiveStudentId(e.target.value)}
                className="w-full py-2.5 px-3 bg-white border-2 border-indigo-200 rounded-2xl text-xs sm:text-sm font-black text-indigo-950 focus:ring-2 focus:ring-indigo-500 shadow-xs"
              >
                {classStudents.map((st) => (
                  <option key={st.id} value={st.id}>
                    રોલ {st.rollNumber} - {st.name} ({st.division})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* RENDER REPORT CARD(S) */}
      {printBatchAll ? (
        <div className="space-y-8">
          <div className="text-center text-xs font-bold text-slate-500 no-print">
            ધોરણ {activeStandard} ના કુલ {classStudents.length} વિદ્યાર્થીઓના રિપોર્ટ કાર્ડ દર્શાવેલ છે.
          </div>
          {classStudents.map((st) => {
            const r = meritRanked.find((m) => m.student.id === st.id)?.rank;
            return renderSingleCard(st, r);
          })}
        </div>
      ) : currentStudent ? (
        renderSingleCard(currentStudent, studentRank)
      ) : (
        <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-slate-400">
          કોઈ વિદ્યાર્થી ઉપલબ્ધ નથી.
        </div>
      )}

      {/* Print and Export Helper Modal */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title={printBatchAll ? `ધોરણ ${activeStandard} ના તમામ રિપોર્ટ કાર્ડ્સ` : `${currentStudent?.name} - રિપોર્ટ કાર્ડ પ્રિન્ટ`}
        documentType="report_card"
        onDownloadHtml={handleDownloadReportCardHtml}
        orientation="portrait"
        description={
          printBatchAll
            ? `ધોરણ ${activeStandard} ના કુલ ${classStudents.length} વિદ્યાર્થીઓના રિપોર્ટ કાર્ડ એકસાથે પ્રિન્ટ કે સેવ થશે.`
            : `રોલ ${currentStudent?.rollNumber} – ${currentStudent?.name} નું પ્રગતિ પત્રક (ગુણ, હાજરી, ગ્રેડ અને સહી સિક્કા સહિત).`
        }
      />

      {/* WhatsApp Formatted Message Share Modal */}
      {whatsAppTargetStudent && (
        <WhatsAppShareModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
          appData={appData}
          initialStudent={whatsAppTargetStudent}
          rankNumber={whatsAppRank}
          availableStudents={classStudents}
          onSelectStudent={(st) => {
            setWhatsAppTargetStudent(st);
            setActiveStudentId(st.id);
            const r = meritRanked.find((m) => m.student.id === st.id)?.rank;
            setWhatsAppRank(r);
          }}
        />
      )}
    </div>
  );
};
