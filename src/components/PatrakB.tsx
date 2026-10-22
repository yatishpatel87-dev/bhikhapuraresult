import React, { useState } from 'react';
import {
  Award,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  X,
  ExternalLink,
  Printer,
  Download,
  LayoutGrid,
  User,
  Users,
} from 'lucide-react';
import { AppData, PatrakBItem, PatrakBRecord, Standard } from '../types';
import { calculatePatrakBSummary, getGradeFromPercentage } from '../utils/calculations';
import { PrintModal } from './PrintModal';
import {
  triggerBrowserPrint,
  buildPatrakBPrintHtml,
  downloadPrintableHtml,
} from '../utils/printHelper';

interface PatrakBProps {
  appData: AppData;
  onUpdateAppData: (data: AppData) => void;
  initialStandard?: Standard;
  onNavigate?: (tab: any, standard?: Standard) => void;
}

export const PatrakB: React.FC<PatrakBProps> = ({
  appData,
  onUpdateAppData,
  initialStandard,
  onNavigate,
}) => {
  const [selectedStandard, setSelectedStandard] = useState<Standard>(initialStandard || 8);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'class_table' | 'single_student'>('class_table');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitToast, setSubmitToast] = useState<string | null>(null);

  const handlePrint = () => {
    setIsPrintModalOpen(true);
    triggerBrowserPrint();
  };

  const handleDownloadPatrakBHtml = () => {
    const html = buildPatrakBPrintHtml(appData, selectedStandard, selectedDivision);
    const fileName = `${appData.settings.schoolName || 'School'}_Std${selectedStandard}_PatrakB`;
    downloadPrintableHtml(
      `ધોરણ ${selectedStandard} પત્રક B (વ્યક્તિત્વ વિકાસ & સહઅભ્યાસિક મૂલ્યાંકન)`,
      html,
      fileName,
      'landscape'
    );
  };

  const handleSubmitPatrakB = () => {
    onUpdateAppData({ ...appData });
    setIsSubmitModalOpen(true);
    setSubmitToast(`ધોરણ ${selectedStandard} પત્રક B સફળતાપૂર્વક સબમિટ થઈ ગયું છે!`);
    setTimeout(() => setSubmitToast(null), 4000);
  };

  const components = appData.settings.patrakBComponents || [];
  const totalMaxSum = components.reduce((acc, c) => acc + (c.maxMarks || 0), 0);
  const is400Valid = totalMaxSum === 400;

  // Filter students
  const classStudents = appData.students
    .filter((s) => s.standard === selectedStandard)
    .filter((s) => (selectedDivision === 'all' ? true : s.division === selectedDivision))
    .sort((a, b) => a.rollNumber - b.rollNumber);

  const activeStudent =
    classStudents.find((s) => s.id === selectedStudentId) || classStudents[0];

  // Update mark
  const handleMarkChange = (studentId: string, compId: string, valStr: string, maxMarks: number) => {
    setErrorMessage(null);
    const updatedPatrakB: PatrakBRecord = { ...appData.patrakB };
    if (!updatedPatrakB[studentId]) updatedPatrakB[studentId] = {};

    if (valStr === '') {
      updatedPatrakB[studentId][compId] = {
        marks: undefined,
        isAbsent: false,
      };
      onUpdateAppData({ ...appData, patrakB: updatedPatrakB });
      return;
    }

    const num = Number(valStr);
    if (isNaN(num)) {
      setErrorMessage('કૃપા કરીને ફક્ત આંકડાકીય ગુણ દાખલ કરો.');
      return;
    }

    if (num < 0 || num > maxMarks) {
      setErrorMessage(`આ ઘટક માટે ગુણ ૦ થી ${maxMarks} ની વચ્ચે હોવા જોઈએ!`);
      return;
    }

    updatedPatrakB[studentId][compId] = {
      marks: num,
      isAbsent: false,
    };
    onUpdateAppData({ ...appData, patrakB: updatedPatrakB });
  };

  const activeStudentSummary = activeStudent
    ? calculatePatrakBSummary(
        activeStudent.id,
        components,
        appData.patrakB,
        appData.settings.gradeBoundaries
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-xl card-3d">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-200 mb-1 badge-3d">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>સર્વાંગી મૂલ્યાંકન – ૮ ઘટકો × ૫૦ ગુણ = કુલ ૪૦૦ ગુણ</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading flex items-center gap-2">
              <Award className="w-6 h-6 text-emerald-600" /> પત્રક B – વ્યક્તિત્વ વિકાસ & સહઅભ્યાસિક મૂલ્યાંકન
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              કુલ ૪૦૦ ગુણનું સર્વાંગી મૂલ્યાંકન (૮ ઘટકો × ૫૦ ગુણ) • પ્રિન્ટ અને પીડીએફ સપોર્ટ સાથે
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
              <button
                onClick={() => setViewMode('class_table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'class_table'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>આખા વર્ગનું પત્રક B</span>
              </button>
              <button
                onClick={() => setViewMode('single_student')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'single_student'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>વિદ્યાર્થીવાર કાર્ડ</span>
              </button>
            </div>

            {/* Print Patrak B Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer btn-3d"
            >
              <Printer className="w-4 h-4" />
              <span>પત્રક B પ્રિન્ટ / PDF</span>
            </button>

            {/* Submit Patrak B Button */}
            <button
              onClick={handleSubmitPatrakB}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>સબમિટ કરો</span>
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

        {/* Standard & Division selector */}
        <div className={`grid gap-3 pt-4 ${viewMode === 'single_student' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">૧. ધોરણ પસંદ કરો:</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
              {([6, 7, 8] as const).map((std) => (
                <button
                  key={std}
                  onClick={() => setSelectedStandard(std)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedStandard === std
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ધોરણ {std}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">૨. વર્ગ પસંદ કરો:</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
              {(['all', 'A', 'B'] as const).map((div) => (
                <button
                  key={div}
                  onClick={() => setSelectedDivision(div)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedDivision === div
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {div === 'all' ? 'બધા' : `વર્ગ ${div}`}
                </button>
              ))}
            </div>
          </div>

          {viewMode === 'single_student' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">૩. વિદ્યાર્થી પસંદ કરો:</label>
              <select
                value={selectedStudentId || classStudents[0]?.id || ''}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-emerald-800 focus:ring-2 focus:ring-emerald-500"
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

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)}>✕</button>
        </div>
      )}

      {/* VIEW 1: FULL CLASS TABLE FOR PATRAK B (આખા વર્ગનું પત્રક B કોષ્ટક) */}
      {viewMode === 'class_table' && (
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden card-3d">
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <span className="font-black text-slate-900 text-sm md:text-base font-heading">
                ધોરણ {selectedStandard} – આખા વર્ગનું પત્રક B (૮ ઘટકો • ૪૦૦ ગુણ)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>પ્રિન્ટ / PDF</span>
              </button>
              <button
                onClick={handleDownloadPatrakBHtml}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>HTML ડાઉનલોડ</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-300 text-slate-800 font-black">
                  <th className="py-2.5 px-2.5 w-12 text-center">રોલ</th>
                  <th className="py-2.5 px-2 w-16">GR</th>
                  <th className="py-2.5 px-3 min-w-[150px]">વિદ્યાર્થીનું નામ</th>
                  {components.map((c, idx) => (
                    <th
                      key={c.id}
                      className="py-2.5 px-1.5 text-center min-w-[70px] bg-emerald-50/50 border-r border-slate-200"
                      title={c.name}
                    >
                      <div className="truncate max-w-[85px] mx-auto text-[10px]">{idx + 1}. {c.name}</div>
                      <span className="text-[9px] text-emerald-800 font-black">({c.maxMarks})</span>
                    </th>
                  ))}
                  <th className="py-2.5 px-3 min-w-[90px] text-center bg-emerald-100 text-emerald-950 font-black">
                    કુલ (૪૦૦)
                  </th>
                  <th className="py-2.5 px-2 w-16 text-center bg-blue-100 text-blue-950 font-black">
                    ટકા (%)
                  </th>
                  <th className="py-2.5 px-2 w-14 text-center bg-amber-100 text-amber-950 font-black">
                    ગ્રેડ
                  </th>
                  <th className="py-2.5 px-2 w-16 text-center">ક્રિયા</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.length === 0 ? (
                  <tr>
                    <td colSpan={components.length + 5} className="py-8 text-center text-slate-400">
                      કોઈ વિદ્યાર્થી નોંધાયેલ નથી.
                    </td>
                  </tr>
                ) : (
                  classStudents.map((st) => {
                    const summary = calculatePatrakBSummary(
                      st.id,
                      components,
                      appData.patrakB,
                      appData.settings.gradeBoundaries
                    );

                    return (
                      <tr key={st.id} className="hover:bg-emerald-50/20 transition-colors">
                        <td className="py-2.5 px-2.5 text-center font-black text-slate-900 text-sm">
                          {st.rollNumber}
                        </td>
                        <td className="py-2.5 px-2 font-mono font-bold text-xs text-slate-700">
                          {st.grNumber}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {st.name}
                        </td>

                        {/* 8 Component Inputs */}
                        {components.map((comp) => {
                          const item = appData.patrakB[st.id]?.[comp.id];
                          const m = item?.marks;
                          return (
                            <td key={comp.id} className="py-1.5 px-1 text-center border-r border-slate-100">
                              <input
                                type="number"
                                min={0}
                                max={comp.maxMarks}
                                placeholder="-"
                                value={m !== undefined ? m : ''}
                                onChange={(e) =>
                                  handleMarkChange(st.id, comp.id, e.target.value, comp.maxMarks)
                                }
                                className="w-14 text-center py-1 px-1 bg-white border border-slate-300 rounded-lg font-black text-xs text-slate-900 focus:border-emerald-500 focus:bg-emerald-50/30 shadow-2xs"
                              />
                            </td>
                          );
                        })}

                        {/* Total Marks / 400 */}
                        <td className="py-2.5 px-3 text-center bg-emerald-50/60 font-black text-sm text-emerald-950">
                          {summary.totalObtained} / ૪૦૦
                        </td>

                        {/* Percentage */}
                        <td className="py-2.5 px-2 text-center bg-blue-50/60 font-black text-xs text-blue-900">
                          {summary.percentage}%
                        </td>

                        {/* Grade */}
                        <td className="py-2.5 px-2 text-center bg-amber-50/60">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-black border ${summary.gradeColor}`}>
                            {summary.grade}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => {
                              setSelectedStudentId(st.id);
                              setViewMode('single_student');
                            }}
                            className="px-2 py-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-md cursor-pointer transition-colors"
                            title="આ વિદ્યાર્થીની વિગતો જુઓ"
                          >
                            વિગત
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              કુલ વિદ્યાર્થીઓ: <strong className="text-slate-900">{classStudents.length}</strong> • ૮ સહઅભ્યાસિક ઘટકો (દરેકના ૫૦ ગુણ = ૪૦૦ ગુણ)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>સંપૂર્ણ પત્રક B પ્રિન્ટ કરો</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SINGLE STUDENT PATRAK B CARD ENTRY */}
      {viewMode === 'single_student' && activeStudent && activeStudentSummary ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          {/* Student Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                પત્રક B ગુણ નોંધણી પત્રક
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                {activeStudent.name} (રોલ નં: {activeStudent.rollNumber}, ધોરણ: {activeStudent.standard}-{activeStudent.division})
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-right">
                <div className="text-[11px] text-emerald-700 font-semibold">કુલ મેળવેલા ગુણ (૪૦૦ માંથી)</div>
                <div className="text-xl font-black text-emerald-900">
                  {activeStudentSummary.totalObtained} / ૪૦૦ ({activeStudentSummary.percentage}%)
                </div>
              </div>
              <span className={`px-3 py-2 rounded-xl text-sm font-black border ${activeStudentSummary.gradeColor}`}>
                ગ્રેડ: {activeStudentSummary.grade}
              </span>
            </div>
          </div>

          {/* 8 Components Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {components.map((comp, idx) => {
              const item = appData.patrakB[activeStudent.id]?.[comp.id];
              const marks = item?.marks;
              const hasMark = marks !== undefined && marks !== null;
              const pct = hasMark ? Math.round((marks / comp.maxMarks) * 100) : 0;
              const grade = hasMark ? getGradeFromPercentage(pct, appData.settings.gradeBoundaries).grade : '-';

              return (
                <div
                  key={comp.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-bold text-slate-800 text-xs sm:text-sm leading-snug">
                      {comp.name}
                    </span>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-900 shrink-0">
                      મહત્તમ {comp.maxMarks}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-700">મેળવેલા ગુણ:</label>
                      <input
                        type="number"
                        min={0}
                        max={comp.maxMarks}
                        placeholder={`૦-${comp.maxMarks}`}
                        value={marks !== undefined ? marks : ''}
                        onChange={(e) =>
                          handleMarkChange(activeStudent.id, comp.id, e.target.value, comp.maxMarks)
                        }
                        className="w-20 text-center py-1.5 px-2 bg-white border border-slate-400 rounded-lg font-black text-base text-slate-950 focus:ring-2 focus:ring-emerald-500 shadow-xs"
                      />
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <span className="text-sm font-black text-emerald-800">{pct}%</span>
                      <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-white border border-slate-300 text-slate-900">
                        ગ્રેડ: {grade}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Info callout & Submit Button */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-medium">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              પત્રક B ના ૪૦૦ ગુણ વિદ્યાર્થીના વ્યક્તિત્વ, સહઅભ્યાસિક અને શારીરિક વિકાસને દર્શાવે છે.
            </span>
            <div className="flex items-center gap-3">
              <span className="font-bold">
                અંતિમ ટકાવારી: {activeStudentSummary.percentage}% (ગ્રેડ: {activeStudentSummary.grade})
              </span>
              <button
                onClick={handleSubmitPatrakB}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer btn-3d"
              >
                પત્રક B સબમિટ કરો ✨
              </button>
            </div>
          </div>
        </div>
      ) : viewMode === 'single_student' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
          કોઈ વિદ્યાર્થી ઉપલબ્ધ નથી.
        </div>
      ) : null}

      {/* Print Patrak B Modal */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title={`ધોરણ ${selectedStandard} પત્રક B (વ્યક્તિત્વ વિકાસ & સહઅભ્યાસિક મૂલ્યાંકન • ૪૦૦ ગુણ)`}
        documentType="patrak_b"
        onDownloadHtml={handleDownloadPatrakBHtml}
        orientation="landscape"
        description={`ધોરણ ${selectedStandard} ના તમામ વિદ્યાર્થીઓનું ૮ સહઅભ્યાસિક ઘટકો (દરેકના ૫૦ ગુણ • કુલ ૪૦૦ ગુણ) ધરાવતું સત્તાવાર પત્રક B.`}
      />

      {/* SUBMIT SUCCESS MODAL FOR PATRAK B */}
      {isSubmitModalOpen && (
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
                    પત્રક B સબમિટ થઈ ગયું છે!
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
              ધોરણ {selectedStandard} {selectedDivision !== 'all' ? `(વર્ગ ${selectedDivision})` : ''} નું પત્રક B (સહઅભ્યાસિક અને વ્યક્તિત્વ વિકાસના ૪૦૦ ગુણ) સફળતાપૂર્વક સબમિટ થઈ ગયું છે.
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 text-[11px] block">ધોરણ અને વર્ગ:</span>
                <span className="font-black text-slate-900 text-sm">
                  ધોરણ {selectedStandard} {selectedDivision === 'all' ? '(બધા વર્ગ)' : `(${selectedDivision})`}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-500 text-[11px] block">કુલ વિદ્યાર્થીઓ:</span>
                <span className="font-black text-blue-900 text-sm">{classStudents.length} વિદ્યાર્થીઓ</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-emerald-700 text-[11px] block font-bold">કુલ ઘટકો:</span>
                <span className="font-black text-emerald-950 text-sm">૮ ઘટકો (૪૦૦ ગુણ)</span>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-blue-700 text-[11px] block font-bold">ડેટા સ્ટેટસ:</span>
                <span className="font-black text-blue-950 text-sm">સફળતાપૂર્વક સાચવેલ</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              {onNavigate && (
                <button
                  onClick={() => {
                    setIsSubmitModalOpen(false);
                    onNavigate('reportCard', selectedStandard);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>રિપોર્ટ કાર્ડ જુઓ</span>
                  <ExternalLink className="w-3.5 h-3.5" />
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
