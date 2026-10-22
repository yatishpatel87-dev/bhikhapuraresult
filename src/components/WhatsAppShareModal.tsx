import React, { useState, useMemo } from 'react';
import {
  X,
  MessageCircle,
  Copy,
  Check,
  Send,
  Sparkles,
  Smartphone,
  Sliders,
  Share2,
  CheckCheck,
  User,
  GraduationCap,
  Award,
} from 'lucide-react';
import { AppData, Standard, Student } from '../types';
import {
  buildStudentWhatsAppSummary,
  copyTextToClipboard,
  DEFAULT_WHATSAPP_OPTIONS,
  openWhatsAppShare,
  WhatsAppExportOptions,
} from '../utils/whatsappHelper';
import { calculateFinalStudentResult } from '../utils/calculations';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  appData: AppData;
  initialStudent: Student;
  rankNumber?: number;
  availableStudents?: Student[];
  onSelectStudent?: (student: Student) => void;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  appData,
  initialStudent,
  rankNumber,
  availableStudents = [],
  onSelectStudent,
}) => {
  const [currentStudent, setCurrentStudent] = useState<Student>(initialStudent);
  const [parentPhone, setParentPhone] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [options, setOptions] = useState<WhatsAppExportOptions>(DEFAULT_WHATSAPP_OPTIONS);
  const [preset, setPreset] = useState<'detailed' | 'brief' | 'compact'>('detailed');

  // Sync initial student when modal opens
  React.useEffect(() => {
    if (initialStudent) {
      setCurrentStudent(initialStudent);
    }
  }, [initialStudent]);

  const studentsList = availableStudents.length > 0 ? availableStudents : appData.students;

  // Handle preset change
  const handleApplyPreset = (type: 'detailed' | 'brief' | 'compact') => {
    setPreset(type);
    if (type === 'detailed') {
      setOptions({
        ...DEFAULT_WHATSAPP_OPTIONS,
        includeDetailedExams: false,
      });
    } else if (type === 'brief') {
      setOptions({
        includeSchoolHeader: true,
        includeStudentBio: true,
        includeSubjectMarks: true,
        includeDetailedExams: false,
        includePatrakA: false,
        includePatrakB: false,
        includeFinalSummary: true,
        includeAttendance: true,
        includeRank: true,
        includeRemarks: true,
        includeCongratulations: true,
        includeSignOff: true,
      });
    } else if (type === 'compact') {
      setOptions({
        includeSchoolHeader: true,
        includeStudentBio: true,
        includeSubjectMarks: false,
        includeDetailedExams: false,
        includePatrakA: false,
        includePatrakB: false,
        includeFinalSummary: true,
        includeAttendance: false,
        includeRank: true,
        includeRemarks: false,
        includeCongratulations: true,
        includeSignOff: true,
      });
    }
  };

  // Generate formatted text message
  const formattedMessage = useMemo(() => {
    return buildStudentWhatsAppSummary(currentStudent, appData, rankNumber, options);
  }, [currentStudent, appData, rankNumber, options]);

  // Current student final result for top badge
  const finalResult = useMemo(() => {
    return calculateFinalStudentResult(
      currentStudent,
      appData.subjects,
      appData.marks,
      appData.settings
    );
  }, [currentStudent, appData]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const success = await copyTextToClipboard(formattedMessage);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendWhatsApp = () => {
    openWhatsAppShare(formattedMessage, parentPhone);
  };

  const handleNativeShare = async () => {
    if (navigator?.share) {
      try {
        await navigator.share({
          title: `${currentStudent.name} - પરિણામ સારાંશ`,
          text: formattedMessage,
        });
      } catch {
        // User dismissed share dialog
      }
    } else {
      handleCopy();
    }
  };

  // Helper to render WhatsApp preview text with markdown highlights
  const renderFormattedPreview = (text: string) => {
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('━━━━━━━━━━')) {
        return <div key={idx} className="my-1.5 border-t border-emerald-200/80" />;
      }

      // Simple parser for bold *...* and italic _..._
      const parts = line.split(/(\*[^*]+\*|_[^_]+_)/g);

      return (
        <div key={idx} className="min-h-[1.25rem] leading-relaxed">
          {parts.map((part, pIdx) => {
            if (part.startsWith('*') && part.endsWith('*')) {
              return (
                <strong key={pIdx} className="font-bold text-slate-900">
                  {part.slice(1, -1)}
                </strong>
              );
            }
            if (part.startsWith('_') && part.endsWith('_')) {
              return (
                <em key={pIdx} className="italic text-slate-700">
                  {part.slice(1, -1)}
                </em>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-500/30 w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-inner">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black font-heading tracking-wide">
                  વોટ્સએપ પરિણામ શેરિંગ (WhatsApp Export)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-800 text-emerald-100 border border-emerald-400/40">
                  ગુજરાતી ફોર્મેટ
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                વાલીઓ અને વિદ્યાર્થીઓને સીધા વોટ્સએપ પર સુંદર ફોર્મેટમાં પરિણામ મોકલો
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center text-white cursor-pointer"
            title="બંધ કરો"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-header: Current Student Profile bar & Quick Switcher */}
        <div className="bg-emerald-50/80 px-4 py-3 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              {currentStudent.rollNumber}
            </div>
            <div>
              <div className="text-xs font-black text-slate-800 flex items-center gap-2">
                <span>{currentStudent.name}</span>
                <span className="text-[11px] font-bold text-slate-500">
                  (ધોરણ {currentStudent.standard} - {currentStudent.division} | રોલ {currentStudent.rollNumber})
                </span>
              </div>
              <div className="text-[11px] text-emerald-800 font-bold flex items-center gap-2">
                <span>કુલ: {finalResult.totalObtained}/{finalResult.totalMax}</span>
                <span>•</span>
                <span>ટકાવારી: {finalResult.percentage}%</span>
                <span>•</span>
                <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded font-black">
                  ગ્રેડ {finalResult.grade}
                </span>
                {rankNumber && (
                  <span className="text-amber-700 font-black">
                    • મેરિટ #{rankNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Student Switcher */}
          {studentsList.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">અન્ય વિદ્યાર્થી:</span>
              <select
                value={currentStudent.id}
                onChange={(e) => {
                  const found = studentsList.find((s) => s.id === e.target.value);
                  if (found) {
                    setCurrentStudent(found);
                    if (onSelectStudent) onSelectStudent(found);
                  }
                }}
                className="py-1 px-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-emerald-500"
              >
                {studentsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    રોલ {s.rollNumber} - {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Modal Body: Left controls & Right Live WhatsApp Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Recipient Phone Number */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>વાલીશ્રીનો વોટ્સએપ મોબાઈલ નંબર:</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="px-3 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="૧૦ અંકનો મોબાઈલ નંબર (વૈકલ્પિક)"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  maxLength={10}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 shadow-xs"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                નંબર લખવાથી વાલીની સીધી ચેટ ખૂલશે, ખાલી રાખવાથી તમે વોટ્સએપમાં સંપર્ક અથવા ગ્રૂપ પસંદ કરી શકશો.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>મેસેજ ફોર્મેટ શૈલી (Style Preset):</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('detailed')}
                  className={`py-2 px-2 text-[11px] font-black rounded-xl border transition-all cursor-pointer text-center ${
                    preset === 'detailed'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  સંપૂર્ણ વિગતવાર
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('brief')}
                  className={`py-2 px-2 text-[11px] font-black rounded-xl border transition-all cursor-pointer text-center ${
                    preset === 'brief'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  મધ્યમ સારાંશ
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('compact')}
                  className={`py-2 px-2 text-[11px] font-black rounded-xl border transition-all cursor-pointer text-center ${
                    preset === 'compact'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  માત્ર કુલ પરિણામ
                </button>
              </div>
            </div>

            {/* Advanced Toggle Options */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-xs font-black text-slate-800 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>મેસેજમાં શું સમાવવું? (Customize)</span>
                </span>
                <span className="text-[11px] text-indigo-600 underline">
                  {showAdvanced ? 'છુપાવો' : 'વધુ વિકલ્પો'}
                </span>
              </button>

              <div className={`space-y-2 text-xs pt-1 ${showAdvanced ? 'block' : 'space-y-2'}`}>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={options.includeSubjectMarks}
                    onChange={(e) =>
                      setOptions({ ...options, includeSubjectMarks: e.target.checked })
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <span>વિષયવાર ગુણ, ટકા અને ગ્રેડ</span>
                </label>

                {options.includeSubjectMarks && showAdvanced && (
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600 ml-5 text-[11px]">
                    <input
                      type="checkbox"
                      checked={options.includeDetailedExams}
                      onChange={(e) =>
                        setOptions({ ...options, includeDetailedExams: e.target.checked })
                      }
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                    />
                    <span>પરીક્ષાઓની વિગત (Q1, Q2, સત્ર 1, સત્ર 2)</span>
                  </label>
                )}

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={options.includePatrakA}
                    onChange={(e) =>
                      setOptions({ ...options, includePatrakA: e.target.checked })
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <span>પત્રક A (સર્વગ્રાહી મૂલ્યાંકન) ગ્રેડ</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={options.includePatrakB}
                    onChange={(e) =>
                      setOptions({ ...options, includePatrakB: e.target.checked })
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <span>પત્રક B (વ્યક્તિત્વ વિકાસ) ગ્રેડ</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={options.includeRank}
                    onChange={(e) =>
                      setOptions({ ...options, includeRank: e.target.checked })
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <span>વર્ગમાં મેરિટ ક્રમાંક (Rank #)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={options.includeAttendance}
                    onChange={(e) =>
                      setOptions({ ...options, includeAttendance: e.target.checked })
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <span>હાજરી વિગત અને ટકાવારી</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={options.includeCongratulations}
                    onChange={(e) =>
                      setOptions({ ...options, includeCongratulations: e.target.checked })
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <span>શુભકામના / અભિનંદન સંદેશ</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={options.includeSchoolHeader}
                    onChange={(e) =>
                      setOptions({ ...options, includeSchoolHeader: e.target.checked })
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <span>શાળાનું નામ અને હેડર</span>
                </label>
              </div>
            </div>
          </div>

          {/* WhatsApp Chat Preview Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>વોટ્સએપ પ્રિવ્યુ (WhatsApp Live Message Preview):</span>
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {formattedMessage.length} અક્ષરો
              </span>
            </div>

            {/* WhatsApp Phone Mockup Container */}
            <div className="flex-1 bg-[#E5DDD5] rounded-2xl p-3 sm:p-4 border-2 border-[#D1C7BA] shadow-inner flex flex-col overflow-hidden relative">
              {/* WhatsApp Chat Date Pill */}
              <div className="text-center mb-3">
                <span className="px-3 py-1 bg-white/80 backdrop-blur-xs text-[10px] font-bold text-slate-600 rounded-lg shadow-2xs">
                  આજે
                </span>
              </div>

              {/* Chat Speech Bubble */}
              <div className="bg-white rounded-2xl p-4 sm:p-4.5 shadow-md border border-[#E2D9CE] max-w-full relative self-start text-xs sm:text-[13px] text-slate-800 font-sans whitespace-pre-wrap select-text leading-relaxed overflow-y-auto max-h-[380px]">
                {/* Speech tail */}
                <div className="absolute top-0 -left-1.5 w-3 h-3 bg-white border-l border-t border-[#E2D9CE] transform rotate-45" />

                {/* Parsed WhatsApp message content */}
                <div className="space-y-0.5">{renderFormattedPreview(formattedMessage)}</div>

                {/* Timestamp and blue ticks */}
                <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-slate-400">
                  <span>{nowTime}</span>
                  <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-xs border ${
                copied
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>કોપી થઈ ગયું! (Copied!)</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>મેસેજ કોપી કરો (Copy)</span>
                </>
              )}
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs"
                title="અન્ય એપ્લિકેશનમાં શેર કરો"
              >
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span>શેર (Share)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              બંધ કરો
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 btn-3d"
            >
              <Send className="w-4 h-4" />
              <span>
                {parentPhone.trim()
                  ? `+91 ${parentPhone.trim()} પર WhatsApp મોકલો`
                  : 'વોટ્સએપ પર મોકલો (Open WhatsApp)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
