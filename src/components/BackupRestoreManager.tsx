import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  Database,
  AlertTriangle,
  CheckCircle2,
  FileText,
  RotateCcw,
  Trash2,
  Info,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { AppData } from '../types';
import { applyImport, exportBackup, inspectBackupJSON, ImportInspection } from '../utils/storage';
import { generateInitialAppData } from '../utils/sampleData';

interface BackupRestoreManagerProps {
  appData: AppData;
  onUpdateAppData: (newData: AppData) => void;
}

export const BackupRestoreManager: React.FC<BackupRestoreManagerProps> = ({
  appData,
  onUpdateAppData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<ImportInspection | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState<boolean>(false);
  const [statusNotification, setStatusNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Handle Export Backup
  const handleExport = () => {
    exportBackup(appData);
    setStatusNotification({
      type: 'success',
      message: 'સફળતા! શ્રી ભીખાપુરા શાળાનો બેકઅપ ફાઇલ સફળતાપૂર્વક ડાઉનલોડ થઈ ગયો છે.',
    });
    setTimeout(() => setStatusNotification(null), 5000);
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setStatusNotification({
        type: 'error',
        message: 'કૃપા કરીને ફક્ત માન્ય .json ફાઇલ પસંદ કરો.',
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = inspectBackupJSON(content);
      setInspection(res);
      if (!res.isValid) {
        setStatusNotification({
          type: 'error',
          message: res.errorMessage || 'અમાન્ય બેકઅપ ફાઇલ છે.',
        });
      } else {
        setStatusNotification(null);
      }
    };
    reader.readAsText(file);
  };

  // Perform Import after Confirmation
  const confirmAndApplyImport = () => {
    if (!inspection || !inspection.isValid || !inspection.parsedData) return;

    try {
      const updatedData = applyImport(inspection.parsedData, importMode, appData);
      onUpdateAppData(updatedData);
      setShowConfirmModal(false);
      setSelectedFile(null);
      setInspection(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setStatusNotification({
        type: 'success',
        message: `સફળતા! ${
          importMode === 'replace' ? 'સંપૂર્ણ ડેટા નવો સેટ' : 'ડેટા સફળતાપૂર્વક મર્જ'
        } થઈ ગયો છે. કુલ ${updatedData.students.length} વિદ્યાર્થીઓ ઉપલબ્ધ છે.`,
      });
    } catch (err: any) {
      setStatusNotification({
        type: 'error',
        message: `આયાત કરવામાં ભૂલ: ${err?.message || 'અજ્ઞાત ક્ષતિ'}`,
      });
    }
  };

  // Reset to Sample Data
  const handleResetToSample = () => {
    const sample = generateInitialAppData();
    onUpdateAppData(sample);
    setShowResetConfirmModal(false);
    setStatusNotification({
      type: 'success',
      message: 'નમૂનારૂપ (ડેમો) વિદ્યાર્થીઓ અને પરિણામ ફરીથી સેટ થઈ ગયા છે.',
    });
  };

  // Clear All Data
  const handleClearAll = () => {
    const emptyData: AppData = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      students: [],
      subjects: appData.subjects,
      marks: {},
      patrakA: {},
      patrakB: {},
      settings: appData.settings,
    };
    onUpdateAppData(emptyData);
    setShowClearConfirmModal(false);
    setStatusNotification({
      type: 'info',
      message: 'તમામ વિદ્યાર્થીઓ અને ગુણ દૂર કરવામાં આવ્યા છે. સેટિંગ્સ જળવાઈ રહ્યાં છે.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Status Alert */}
      {statusNotification && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all duration-300 ${
            statusNotification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : statusNotification.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-blue-50 border-blue-300 text-blue-900'
          }`}
        >
          {statusNotification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : statusNotification.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-medium text-sm md:text-base">
            {statusNotification.message}
          </div>
          <button
            onClick={() => setStatusNotification(null)}
            className="text-xs text-gray-500 hover:text-gray-800 font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Info Card */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white rounded-2xl p-6 md:p-8 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold tracking-wide">
              <Database className="w-3.5 h-3.5 text-yellow-300" /> સ્થાનિક સંગ્રહ & ડેટા સુરક્ષા વ્યવસ્થા
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              ડેટા બેકઅપ અને રિસ્ટોર (સંગ્રહ & પુનઃસ્થાપન)
            </h2>
            <p className="text-blue-100 text-sm md:text-base max-w-3xl leading-relaxed">
              શાળાના વિદ્યાર્થીઓ, તમામ વિષયોના મેળવેલા ગુણ, પત્રક A, પત્રક B અને સેટિંગ્સનો ડેટા તમારા બ્રાઉઝરમાં સુરક્ષિત સંગ્રહિત છે.
              નિયમિત રીતે બેકઅપ ડાઉનલોડ કરી સુરક્ષિત સાચવવાની ભલામણ કરવામાં આવે છે.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center min-w-[200px]">
            <div className="text-xs text-blue-200">હાલનો સંગ્રહિત ડેટા</div>
            <div className="text-2xl font-bold mt-1 text-white">{appData.students.length} વિદ્યાર્થીઓ</div>
            <div className="text-xs text-blue-200 mt-1">
              છેલ્લો ફેરફાર: {new Date(appData.lastUpdated || Date.now()).toLocaleDateString('gu-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Export Backup & Import Backup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EXPORT BACKUP CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-blue-400 transition-all">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Export Backup (બેકઅપ ડાઉનલોડ કરો)</h3>
                <p className="text-xs text-slate-500">સમગ્ર ડેટાને .json ફાઇલ તરીકે સુરક્ષિત સાચવો</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 text-sm space-y-2">
              <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> આ બેકઅપમાં નીચેની તમામ વિગતો સામેલ થશે:
              </div>
              <ul className="text-xs md:text-sm text-slate-600 space-y-1.5 list-disc pl-5">
                <li>કુલ <strong className="text-slate-800">{appData.students.length}</strong> વિદ્યાર્થીઓની માહિતી (ધોરણ 6, 7, 8)</li>
                <li>તમામ કસોટીઓ: ત્રિમાસિક 1 & 2, સત્ર 1 & 2, સ્વાધ્યાય ગુણ</li>
                <li>પત્રક A (40 ગુણ વિષયવાર) અને પત્રક B (400 ગુણ વ્યક્તિત્વ વિકાસ)</li>
                <li>શાળાનું નામ, પાસિંગ ધોરણ અને કસ્ટમ ગ્રેડ સેટિંગ્સ</li>
              </ul>
            </div>

            <div className="text-xs text-slate-500 mb-6 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>સૂચના:</strong> દર અઠવાડિયે અથવા પરીક્ષાના ગુણ નોંધ્યા પછી આ બટન દબાવી બેકઅપ ફાઇલ કમ્પ્યુટર અથવા ગૂગલ ડ્રાઇવમાં સાચવો.
              </span>
            </div>
          </div>

          <button
            onClick={handleExport}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all text-base cursor-pointer"
          >
            <Download className="w-5 h-5" />
            <span>હમણાં Export Backup ડાઉનલોડ કરો</span>
          </button>
        </div>

        {/* IMPORT BACKUP CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-emerald-400 transition-all">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Import Backup (બેકઅપ પુનઃસ્થાપિત કરો)</h3>
                <p className="text-xs text-slate-500">અગાઉ ડાઉનલોડ કરેલ .json ફાઇલ અપલોડ કરો</p>
              </div>
            </div>

            {/* File Input */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                બેકઅપ ફાઇલ પસંદ કરો (.json)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-dashed border-slate-300 rounded-xl p-2 bg-slate-50"
              />
            </div>

            {/* File Inspection Result Card */}
            {inspection && inspection.isValid && (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 mb-4 text-xs md:text-sm space-y-2">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> ફાઇલ ચકાસણી સફળ:
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                  <div>શાળા: <strong>{inspection.schoolName}</strong></div>
                  <div>વિદ્યાર્થીઓ: <strong className="text-emerald-700">{inspection.studentsCount}</strong></div>
                  <div>શૈક્ષણિક વર્ષ: <strong>{inspection.academicYear || '-'}</strong></div>
                  <div>વિષયો: <strong>{inspection.subjectsCount}</strong></div>
                </div>

                {/* Import Mode Selection */}
                <div className="pt-2 border-t border-emerald-200">
                  <div className="font-semibold text-slate-800 mb-1.5">આયાત કરવાની પદ્ધતિ પસંદ કરો:</div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                      <input
                        type="radio"
                        name="importMode"
                        value="replace"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span><strong>સંપૂર્ણ બદલો (Replace):</strong> વર્તમાન ડેટા દૂર કરી નવી ફાઇલનો ડેટા સેટ થશે</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                      <input
                        type="radio"
                        name="importMode"
                        value="merge"
                        checked={importMode === 'merge'}
                        onChange={() => setImportMode('merge')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span><strong>ડેટા મર્જ કરો (Merge):</strong> હાલના વિદ્યાર્થીઓમાં નવી ફાઇલના વિદ્યાર્થીઓ ઉમેરાશે</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {!inspection && (
              <div className="text-xs text-slate-500 mb-6 bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  કોઈપણ કોમ્પ્યુટર કે મોબાઇલમાંથી લીધેલો બેકઅપ અહીં આયાત કરી શકાય છે.
                  ફાઇલ પસંદ કર્યા બાદ તમને ખાતરી (Confirmation) પૂછવામાં આવશે.
                </span>
              </div>
            )}
          </div>

          <button
            disabled={!inspection || !inspection.isValid}
            onClick={() => setShowConfirmModal(true)}
            className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 font-semibold rounded-xl shadow-md transition-all text-base cursor-pointer ${
              inspection && inspection.isValid
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Upload className="w-5 h-5" />
            <span>બેકઅપ Import કરવા આગળ વધો</span>
          </button>
        </div>
      </div>

      {/* Safety & Danger Zone: Sample Data Reset & Clear */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-slate-600" /> સહાયક ટૂલ્સ & રીસેટ વિકલ્પો
        </h4>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-slate-800 text-sm">નમૂનારૂપ ડેટા (Sample Demo Data) ફરીથી ભરો</div>
            <p className="text-xs text-slate-500">
              પરીક્ષણ માટે ધોરણ 6, 7 અને 8 ના ડેમો વિદ્યાર્થીઓ અને ગુણ ફરી લોડ કરો.
            </p>
          </div>
          <button
            onClick={() => setShowResetConfirmModal(true)}
            className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs md:text-sm font-semibold rounded-lg shadow-sm transition-all shrink-0 cursor-pointer"
          >
            ડેમો ડેટા રીસેટ કરો
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-rose-800 text-sm flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-rose-600" /> તમામ વિદ્યાર્થીઓ & ગુણ ક્લિયર કરો
            </div>
            <p className="text-xs text-slate-500">
              નવા શૈક્ષણિક સત્ર માટે તમામ વિદ્યાર્થીઓ અને માર્ક્સ સંપૂર્ણ સાફ કરવા. (સેટિંગ્સ જળવાશે)
            </p>
          </div>
          <button
            onClick={() => setShowClearConfirmModal(true)}
            className="px-4 py-2 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs md:text-sm font-semibold rounded-lg shadow-sm transition-all shrink-0 cursor-pointer"
          >
            તમામ ડેટા ખાલી કરો
          </button>
        </div>
      </div>

      {/* Instructions Guide Card */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-6 text-slate-800">
        <h4 className="font-bold text-blue-900 text-base mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-700" />
          શિક્ષકો માટે ઉપયોગી માર્ગદર્શિકા (સૂચનાઓ)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs md:text-sm pt-2">
          <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-xs">
            <div className="font-bold text-slate-900 mb-1">૧. સ્થાનિક સંગ્રહ શું છે?</div>
            <p className="text-slate-600 leading-relaxed">
              તમે જે પણ વિદ્યાર્થી અથવા ગુણ દાખલ કરો છો તે તમારા કમ્પ્યુટર કે મોબાઇલના LocalStorage માં સાચવાય છે. ઇન્ટરનેટ ન હોય તો પણ ઓફલાઇન કાર્ય કરે છે.
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-xs">
            <div className="font-bold text-slate-900 mb-1">૨. ડેટા ક્યારે ખોવાઈ શકે?</div>
            <p className="text-slate-600 leading-relaxed">
              જો બ્રાઉઝરની હિસ્ટ્રી અથવા કૂકીઝ 'Clear Browsing Data' કરો તો સ્થાનિક ડેટા સાફ થઈ શકે છે. માટે <strong>Export Backup</strong> થી ફાઇલ સાચવી રાખવી.
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-xs">
            <div className="font-bold text-slate-900 mb-1">૩. અન્ય કમ્પ્યુટરમાં ટ્રાન્સફર</div>
            <p className="text-slate-600 leading-relaxed">
              એક કમ્પ્યુટર પર Export Backup કરો. પછી તે ફાઇલ પેનડ્રાઇવ અથવા વોટ્સએપ દ્વારા બીજા કમ્પ્યુટર પર મોકલી ત્યાં <strong>Import Backup</strong> કરો.
            </p>
          </div>
        </div>
      </div>

      {/* CONFIRM IMPORT MODAL */}
      {showConfirmModal && inspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <AlertTriangle className="w-7 h-7" />
              <h3 className="text-xl font-bold text-slate-900">બેકઅપ આયાતની પુષ્ટિ (Confirm Import)</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              તમે પસંદ કરેલ ફાઇલ: <strong>{selectedFile?.name}</strong>
              <br />
              આયાત પદ્ધતિ: <strong className="text-blue-700">{importMode === 'replace' ? 'સંપૂર્ણ બદલો (Replace Existing Data)' : 'મર્જ કરો (Merge with Existing)'}</strong>
            </p>

            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-900 mb-5">
              {importMode === 'replace' ? (
                <span>
                  <strong>ચેતવણી:</strong> આ પ્રક્રિયાથી હાલનો ડેટા દૂર થઈ જશે અને ફાઇલમાંથી <strong>{inspection.studentsCount}</strong> વિદ્યાર્થીઓ સેટ થશે.
                </span>
              ) : (
                <span>
                  <strong>નોંધ:</strong> વર્તમાન ડેટા સુરક્ષિત રહેશે અને નવી ફાઇલના વિદ્યાર્થીઓ તેમાં જોડાશે.
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-medium text-sm cursor-pointer"
              >
                રદ કરો (Cancel)
              </button>
              <button
                onClick={confirmAndApplyImport}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                હા, ડેટા આયાત કરો
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESET TO SAMPLE MODAL */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-blue-600 mb-3">
              <RotateCcw className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">ડેમો ડેટા રીસેટ કરવો છે?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              આનાથી ધોરણ 6, 7 અને 8 ના પ્રારંભિક નમૂના વિદ્યાર્થીઓ અને ગુણ લોડ થશે.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 text-sm font-medium cursor-pointer"
              >
                રદ કરો
              </button>
              <button
                onClick={handleResetToSample}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer"
              >
                હા, ડેમો રીસેટ કરો
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM CLEAR ALL MODAL */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">તમામ ડેટા ખાલી કરવો છે?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              આનાથી બધા જ વિદ્યાર્થીઓ અને માર્ક્સ કાયમી માટે ડિલીટ થઈ જશે. ખાતરી કરો કે તમે અગાઉ <strong>Export Backup</strong> લીધો છે!
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 text-sm font-medium cursor-pointer"
              >
                રદ કરો
              </button>
              <button
                onClick={handleClearAll}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer"
              >
                હા, બધો ડેટા સાફ કરો
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
