import React from 'react';
import { X, Database } from 'lucide-react';
import { AppData } from '../types';
import { BackupRestoreManager } from './BackupRestoreManager';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  appData: AppData;
  onUpdateAppData: (data: AppData) => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  appData,
  onUpdateAppData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2.5 text-blue-700 mb-1">
            <Database className="w-6 h-6" />
            <h3 className="text-xl font-bold text-slate-900">ડેટા બેકઅપ & પુનઃસ્થાપન કેન્દ્ર</h3>
          </div>
          <p className="text-xs text-slate-500">
            શ્રી ભીખાપુરા પ્રાથમિક શાળા – ધોરણ ૬ થી ૮ પરિણામ ડેટાબેઝ સંગ્રહ
          </p>
        </div>

        <BackupRestoreManager appData={appData} onUpdateAppData={onUpdateAppData} />
      </div>
    </div>
  );
};
