import React, { useState } from 'react';
import {
  Settings,
  Save,
  BookOpen,
  Sliders,
  Award,
  Database,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Scale,
  RotateCcw,
} from 'lucide-react';
import { AppData, CalculationMethod, SchoolSettings, Subject } from '../types';
import { DEFAULT_SUBJECTS } from '../utils/sampleData';
import { BackupRestoreManager } from './BackupRestoreManager';
import { FirebaseConfigSection } from './FirebaseConfigSection';
import { Cloud } from 'lucide-react';

interface SettingsManagerProps {
  appData: AppData;
  onUpdateAppData: (data: AppData) => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  appData,
  onUpdateAppData,
}) => {
  const [subTab, setSubTab] = useState<'general' | 'subjects' | 'grading' | 'patrakB' | 'backup' | 'firebase'>('general');
  const [settings, setSettings] = useState<SchoolSettings>(appData.settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Subject management state
  const [subjectsList, setSubjectsList] = useState<Subject[]>(appData.subjects);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  // Handle general save
  const handleSaveSettings = () => {
    onUpdateAppData({
      ...appData,
      settings,
      subjects: subjectsList,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Add Subject
  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    const newSub: Subject = {
      id: `sub_${Date.now()}`,
      name: newSubjectName.trim(),
      standards: [6, 7, 8],
      maxMarks: { quarterly1: 40, quarterly2: 40, sem1: 80, sem2: 80, assignment: 20 },
      patrakAMaxMarks: 40,
      weightage: 1,
    };
    const updated = [...subjectsList, newSub];
    setSubjectsList(updated);
    onUpdateAppData({ ...appData, subjects: updated });
    setNewSubjectName('');
    setIsAddSubjectOpen(false);
  };

  // Delete Subject
  const handleDeleteSubject = (id: string) => {
    if (subjectsList.length <= 1) {
      alert('ઓછામાં ઓછો એક વિષય રહેવો જરૂરી છે.');
      return;
    }
    const updated = subjectsList.filter((s) => s.id !== id);
    setSubjectsList(updated);
    onUpdateAppData({ ...appData, subjects: updated });
  };

  // Patrak B sum check
  const patrakBSum = settings.patrakBComponents.reduce((acc, c) => acc + (c.maxMarks || 0), 0);

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap gap-1.5">
        {[
          { id: 'general', label: 'શાળા વિગતો & પદ્ધતિ', icon: Settings },
          { id: 'subjects', label: 'વિષય વ્યવસ્થાપન', icon: BookOpen },
          { id: 'grading', label: 'ગ્રેડ & પાસિંગ નિયમો', icon: Sliders },
          { id: 'patrakB', label: 'પત્રક B ઘટકો (૪૦૦ ગુણ)', icon: Award },
          { id: 'backup', label: 'બેકઅપ & રિસ્ટોર સેન્ટર', icon: Database },
          { id: 'firebase', label: 'ફાયરબેઝ & સુરક્ષા', icon: Cloud },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>સેટિંગ્સ સફળતાપૂર્વક સાચવાઈ ગયા છે!</span>
        </div>
      )}

      {/* SUB TAB 1: GENERAL & CALCULATION METHOD */}
      {subTab === 'general' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-800">શાળા અને અધિકૃત ગુણપદ્ધતિ સેટિંગ્સ</h3>
            <p className="text-xs text-slate-500">રિપોર્ટ કાર્ડ અને લેજરમાં દર્શાવવા માટેની માહિતી</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">શાળાનું નામ *</label>
              <input
                type="text"
                value={settings.schoolName}
                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">શૈક્ષણિક વર્ષ *</label>
              <input
                type="text"
                value={settings.academicYear}
                onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">શાળાનો સૂત્ર / Tagline</label>
              <input
                type="text"
                value={settings.schoolTagline}
                onChange={(e) => setSettings({ ...settings, schoolTagline: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">આચાર્યશ્રીનું નામ</label>
              <input
                type="text"
                value={settings.principalName}
                onChange={(e) => setSettings({ ...settings, principalName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">શાળાનું સરનામું (ગામ, તાલુકો, જિલ્લો)</label>
              <input
                type="text"
                value={settings.schoolAddress}
                onChange={(e) => setSettings({ ...settings, schoolAddress: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          {/* CALCULATION METHOD CONFIG */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" /> અધિકૃત વાર્ષિક પરિણામ ગુણપદ્ધતિ પસંદ કરો:
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              શાળાની નીતિ અનુસાર કઈ કઈ કસોટીઓ અંતિમ પરિણામમાં ગણવી તે નક્કી કરો.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm">
              {[
                {
                  id: 'annual_combined' as CalculationMethod,
                  title: 'વાર્ષિક સંકલિત મૂલ્યાંકન (ભલામણ કરેલ)',
                  desc: 'ત્રિમાસિક ૧ (૪૦) + ત્રિમાસિક ૨ (૪૦) + સત્ર ૧ (૮૦) + સત્ર ૨ (૮૦) + સ્વાધ્યાય (૨૦) = ૨૬૦ ગુણ પ્રતિ વિષય',
                },
                {
                  id: 'semesters_only' as CalculationMethod,
                  title: 'બંને સત્ર સંયુક્ત ગુણપદ્ધતિ',
                  desc: 'સત્ર ૧ (૮૦) + સત્ર ૨ (૮૦) = ૧૬૦ ગુણ પ્રતિ વિષય (ત્રિમાસિક કસોટી સ્વતંત્ર રહે છે)',
                },
                {
                  id: 'sem2_only' as CalculationMethod,
                  title: 'માત્ર સત્ર ૨ વાર્ષિક કસોટી',
                  desc: 'સત્ર ૨ (૮૦) ગુણના આધારે અંતિમ પરિણામ',
                },
                {
                  id: 'pending_setup' as CalculationMethod,
                  title: 'અંતિમ કુલ બાકી – ગુણપદ્ધતિ સેટ કરો',
                  desc: 'અધિકૃત નિર્ણય ન થાય ત્યાં સુધી અંતિમ કુલ રોકી રાખવો',
                },
              ].map((meth) => (
                <label
                  key={meth.id}
                  className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                    settings.calculationMethod === meth.id
                      ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-300'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="calcMethod"
                    value={meth.id}
                    checked={settings.calculationMethod === meth.id}
                    onChange={() => setSettings({ ...settings, calculationMethod: meth.id })}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-bold text-slate-800">{meth.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{meth.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveSettings}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 btn-3d"
            >
              <CheckCircle2 className="w-4 h-4" /> સબમિટ કરો & સાચવો (Submit Settings)
            </button>
          </div>
        </div>
      )}

      {/* SUB TAB 2: SUBJECTS MANAGEMENT */}
      {subTab === 'subjects' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800">ધોરણ ૬ થી ૮ ના વિષયો</h3>
              <p className="text-xs text-slate-500">વિષયો ઉમેરો, નામ બદલો અથવા કસોટીઓના મહત્તમ ગુણ સંપાદિત કરો</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirm('શું તમે ધોરણ ૬ થી ૮ ના પ્રમાણભૂત મુખ્ય ૭ વિષયો (ગુજરાતી, હિન્દી, અંગ્રેજી, ગણિત, વિજ્ઞાન, સામાજિક વિજ્ઞાન, સંસ્કૃત) રીસેટ કરવા માંગો છો?')) {
                    setSubjectsList(DEFAULT_SUBJECTS);
                    onUpdateAppData({ ...appData, subjects: DEFAULT_SUBJECTS });
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl border border-slate-300 transition-all cursor-pointer btn-3d"
              >
                <RotateCcw className="w-3.5 h-3.5" /> મુખ્ય ૭ વિષયો રીસેટ કરો
              </button>
              <button
                onClick={() => setIsAddSubjectOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-sm transition-all cursor-pointer btn-3d"
              >
                <Plus className="w-4 h-4" /> નવો વિષય ઉમેરો
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {subjectsList.map((sub, idx) => (
              <div
                key={sub.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={sub.name}
                      onChange={(e) => {
                        const updated = subjectsList.map((s) =>
                          s.id === sub.id ? { ...s, name: e.target.value } : s
                        );
                        setSubjectsList(updated);
                      }}
                      className="text-sm font-bold text-slate-800 bg-white px-2.5 py-1 border border-slate-300 rounded-lg min-w-[200px]"
                    />
                  </div>
                  <div className="text-xs text-slate-500 pl-8">
                    ત્રિ ૧: {sub.maxMarks.quarterly1} | ત્રિ ૨: {sub.maxMarks.quarterly2} | સત્ર ૧: {sub.maxMarks.sem1} | સત્ર ૨: {sub.maxMarks.sem2} | સ્વાધ્યાય: {sub.maxMarks.assignment} | પત્રક A: {sub.patrakAMaxMarks}
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-8 md:pl-0">
                  <div className="text-xs font-semibold text-slate-600">ધોરણ:</div>
                  {[6, 7, 8].map((std) => {
                    const isChecked = sub.standards.includes(std as any);
                    return (
                      <button
                        key={std}
                        onClick={() => {
                          const newStds = isChecked
                            ? sub.standards.filter((s) => s !== std)
                            : [...sub.standards, std as any];
                          const updated = subjectsList.map((s) =>
                            s.id === sub.id ? { ...s, standards: newStds } : s
                          );
                          setSubjectsList(updated);
                        }}
                        className={`px-2 py-0.5 rounded text-xs font-bold border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-400 border-slate-300'
                        }`}
                      >
                        ધોરણ {std}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handleDeleteSubject(sub.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg ml-2 cursor-pointer"
                    title="વિષય કાઢી નાખો"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleSaveSettings}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> વિષયો સાચવો
            </button>
          </div>

          {/* Add Subject Modal */}
          {isAddSubjectOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-3">નવો વિષય ઉમેરો</h3>
                <label className="block text-xs font-semibold text-slate-700 mb-1">વિષયનું નામ *</label>
                <input
                  type="text"
                  placeholder="દા.ત. કમ્પ્યુટર શિક્ષણ"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl mb-4 text-sm"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsAddSubjectOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    રદ કરો
                  </button>
                  <button
                    onClick={handleAddSubject}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    ઉમેરો
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 3: GRADING RULES */}
      {subTab === 'grading' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-800">પાસિંગ ગુણ અને ગ્રેડિંગ માપદંડ</h3>
            <p className="text-xs text-slate-500">ગુજરાત પ્રાથમિક શિક્ષણ બોર્ડ માન્ય ધોરણ ૬ થી ૮ ગ્રેડ પદ્ધતિ</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ન્યૂનતમ પાસિંગ ટકાવારી (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.passingPercentage}
                onChange={(e) => setSettings({ ...settings, passingPercentage: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-sm"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">ડિફૉલ્ટ: 33% (પાસિંગ કટ-ઓફ)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">રિપોર્ટ કાર્ડમાં વર્ગ ક્રમ (Merit Rank)</label>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showRankInReportCard}
                  onChange={(e) => setSettings({ ...settings, showRankInReportCard: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800">પ્રગતિ પત્રકમાં વિદ્યાર્થીનો નંબર દર્શાવો</span>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="font-bold text-slate-800 text-sm mb-3">ગ્રેડિંગ માળખું (Grading Boundaries):</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {settings.gradeBoundaries.map((b, idx) => (
                <div key={b.grade} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between font-black text-sm mb-1">
                    <span className={`px-2 py-0.5 rounded border ${b.colorClass}`}>{b.grade}</span>
                    <span className="text-slate-600">≥ {b.minPercent}%</span>
                  </div>
                  <div className="text-[11px] text-slate-500">{b.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleSaveSettings}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> ગ્રેડ નિયમો સાચવો
            </button>
          </div>
        </div>
      )}

      {/* SUB TAB 4: PATRAK B COMPONENTS */}
      {subTab === 'patrakB' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800">પત્રક B ના ૮ ઘટકો (કુલ ૪૦૦ ગુણ)</h3>
              <p className="text-xs text-slate-500">દરેક ઘટકના ગુણનો સરવાળો બરાબર ૪૦૦ થવો જોઈએ.</p>
            </div>

            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                patrakBSum === 400
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              {patrakBSum === 400 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>સરવાળો: ૪૦૦ / ૪૦૦ (સંપૂર્ણ સંતુલિત)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>સરવાળો: {patrakBSum} / ૪૦૦ (સુધારો જરૂરી!)</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {settings.patrakBComponents.map((comp, idx) => (
              <div
                key={comp.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                  <span className="text-xs font-bold text-slate-500 w-6">{idx + 1}.</span>
                  <input
                    type="text"
                    value={comp.name}
                    onChange={(e) => {
                      const updated = settings.patrakBComponents.map((c) =>
                        c.id === comp.id ? { ...c, name: e.target.value } : c
                      );
                      setSettings({ ...settings, patrakBComponents: updated });
                    }}
                    className="text-xs sm:text-sm font-semibold text-slate-800 bg-white px-2.5 py-1.5 border border-slate-300 rounded-lg flex-1"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label className="text-xs font-semibold text-slate-600">મહત્તમ ગુણ:</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={comp.maxMarks}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      const updated = settings.patrakBComponents.map((c) =>
                        c.id === comp.id ? { ...c, maxMarks: val } : c
                      );
                      setSettings({ ...settings, patrakBComponents: updated });
                    }}
                    className="w-18 text-center text-xs sm:text-sm font-bold bg-white px-2 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleSaveSettings}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> પત્રક B સાચવો
            </button>
          </div>
        </div>
      )}

      {/* SUB TAB 5: BACKUP & RESTORE DEDICATED SECTION */}
      {subTab === 'backup' && (
        <BackupRestoreManager appData={appData} onUpdateAppData={onUpdateAppData} />
      )}

      {/* SUB TAB 6: FIREBASE CONFIG & SECURITY SPECIFICATION */}
      {subTab === 'firebase' && (
        <FirebaseConfigSection />
      )}
    </div>
  );
};
