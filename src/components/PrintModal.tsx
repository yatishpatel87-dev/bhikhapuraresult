import React, { useState } from 'react';
import {
  Printer,
  Download,
  X,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Eye,
  FileText,
} from 'lucide-react';
import { triggerBrowserPrint } from '../utils/printHelper';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  documentType: 'report_card' | 'ledger' | 'patrak_a' | 'patrak_b';
  onDownloadHtml: () => void;
  orientation?: 'portrait' | 'landscape';
  description?: string;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  title,
  documentType,
  onDownloadHtml,
  orientation = 'portrait',
  description,
}) => {
  const [hasTriggeredDirect, setHasTriggeredDirect] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDirectPrint = () => {
    setHasTriggeredDirect(true);
    const success = triggerBrowserPrint();
    if (!success) {
      // In case window.print threw an error or was suppressed
      console.log('Direct print attempted');
    }
  };

  const handleDownload = () => {
    onDownloadHtml();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full border-3 border-indigo-200 shadow-2xl overflow-hidden card-3d">
        {/* Header Strip */}
        <div className="h-2.5 w-full hologram-border" />

        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-indigo-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 badge-3d shrink-0">
              <Printer className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-indigo-200 mb-1">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span>સર્વગ્રાહી પ્રિન્ટ મેનેજર</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 font-heading leading-tight">
                {title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {description && (
            <p className="text-xs text-slate-600 font-medium bg-slate-50 p-3 rounded-2xl border border-slate-200">
              {description}
            </p>
          )}

          {/* Key Option 1: Direct Browser Print */}
          <div className="p-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-indigo-950 flex items-center gap-1.5 font-heading">
                  <Printer className="w-4 h-4 text-indigo-600" /> વિકલ્પ ૧: સીધી બ્રાઉઝર પ્રિન્ટ (Print Now)
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  કમ્પ્યુટરનો સિસ્ટમ પ્રિન્ટ ડાયલોગ તરત જ ઓપન થશે. કાગળની સાઈઝ A4 ({orientation === 'landscape' ? 'આડું/Landscape' : 'ઉભું/Portrait'}) રાખવી.
                </p>
              </div>
            </div>
            <div className="mt-3">
              <button
                onClick={handleDirectPrint}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-indigo-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 btn-3d"
              >
                <Printer className="w-4 h-4" />
                <span>પ્રિન્ટ શરૂ કરો (Ctrl + P)</span>
              </button>
            </div>
          </div>

          {/* Key Option 2: 1-Click A4 PDF / Printable HTML Download (100% Guaranteed Solution for iFrames) */}
          <div className="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-emerald-950 flex items-center gap-1.5 font-heading">
                  <Download className="w-4 h-4 text-emerald-700" /> વિકલ્પ ૨: A4 પ્રિન્ટેબલ પેજ ડાઉનલોડ (PDF / પ્રિન્ટ ગેરંટી)
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  જો બ્રાઉઝર કે આઇફ્રેમમાં પ્રિન્ટ ન ખૂલે, તો આ બટન દબાવો. આ ફાઇલ ડાઉનલોડ કરી ક્લિક કરશો એટલે તરત જ કલરફુલ A4 પ્રિન્ટ અને PDF સેવ કરવાનો વિકલ્પ મળશે!
                </p>
              </div>
            </div>
            <div className="mt-3">
              <button
                onClick={handleDownload}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 btn-3d"
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>ડાઉનલોડ થઈ ગયું! ફાઇલ ઓપન કરો</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>A4 ફાઇલ ડાઉનલોડ કરો (.html)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Notice Box */}
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>શિક્ષક મિત્રો માટે ખાસ નોંધ:</strong> પ્રિન્ટ સેટિંગ્સમાં <strong>More Settings &gt; Background graphics</strong> ચેક રાખવું જેથી કલરફુલ ગ્રેડિંગ અને બોક્સ સુંદર દેખાય.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            બંધ કરો
          </button>
        </div>
      </div>
    </div>
  );
};
