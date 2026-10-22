import React, { useState } from 'react';
import {
  Download,
  School,
  Calendar,
  Users,
  Award,
  Database,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  LogIn,
  CheckCircle,
} from 'lucide-react';
import { AppData } from '../types';
import { exportBackup } from '../utils/storage';
import { useAuth } from '../firebase/AuthContext';

interface HeaderProps {
  appData: AppData;
  activeTab: string;
  onOpenBackupModal: () => void;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt?: string | null;
  onManualSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appData,
  onOpenBackupModal,
  syncStatus = 'idle',
  lastSyncedAt,
  onManualSync,
}) => {
  const { settings, students } = appData;
  const { user, signInWithGoogle, signOutUser, loading: authLoading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const countStd6 = students.filter((s) => s.standard === 6).length;
  const countStd7 = students.filter((s) => s.standard === 7).length;
  const countStd8 = students.filter((s) => s.standard === 8).length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo & School Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0 ring-2 ring-blue-100">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {settings.schoolName || 'શ્રી ભીખાપુરા પ્રાથમિક શાળા'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Award className="w-3 h-3" /> ધોરણ ૬ થી ૮
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>{settings.schoolTagline || 'વિદ્યાર્થી પરિણામ વ્યવસ્થાપન પ્રણાલી'}</span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                  <Calendar className="w-3 h-3 text-blue-600" /> શૈક્ષણિક વર્ષ: {settings.academicYear}
                </span>
              </p>
            </div>
          </div>

          {/* Action Center: Stats, Cloud Sync Status, Auth & Backup */}
          <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
            {/* Student Count Summary */}
            <div className="hidden xl:flex items-center gap-1.5 text-xs bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-xl text-slate-700">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>વિદ્યાર્થીઓ: <strong>{students.length}</strong></span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">ધો. ૬ ({countStd6}) • ૭ ({countStd7}) • ૮ ({countStd8})</span>
            </div>

            {/* Cloud Sync Status Indicator */}
            {user ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={onManualSync}
                  title={
                    syncStatus === 'syncing'
                      ? 'ડેટા ફાયરબેઝમાં સેવ થઈ રહ્યો છે...'
                      : syncStatus === 'synced'
                      ? 'ડેટા ફાયરબેઝ ક્લાઉડ સાથે સંપૂર્ણ સિંક થયેલ છે'
                      : 'ફાયરબેઝ સાથે સિંક કરો'
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    syncStatus === 'syncing'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : syncStatus === 'synced'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {syncStatus === 'syncing' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                      <span className="hidden sm:inline">સાચવી રહ્યો છે...</span>
                    </>
                  ) : syncStatus === 'synced' ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">મેઘ સંગ્રહ સક્રિય</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3.5 h-3.5 text-blue-600" />
                      <span className="hidden sm:inline">સિંક કરો</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">સ્થાનિક મોડ (Offline)</span>
              </span>
            )}

            {/* Google Authentication Section */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-800 transition-all cursor-pointer"
                  title="વપરાશકર્તા પ્રોફાઇલ"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'શિક્ષક'}
                      className="w-6 h-6 rounded-full object-cover border border-slate-300"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[100px] sm:max-w-[130px] truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setShowUserMenu(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {user.displayName || 'શિક્ષક / એડમિન'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle className="w-2.5 h-2.5" /> ગૂગલ પ્રમાણિત
                      </span>
                    </div>

                    <div className="px-2 py-1.5">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          if (onManualSync) onManualSync();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-all cursor-pointer text-left font-medium"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                        <span>ક્લાઉડમાં તાત્કાલિક સિંક કરો</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          signOutUser();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer text-left font-semibold mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        <span>લૉગઆઉટ (Sign Out)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                disabled={authLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer btn-3d"
                title="ગૂગલ એકાઉન્ટ વડે લૉગિન કરો"
              >
                {authLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogIn className="w-3.5 h-3.5" />
                )}
                <span>ગૂગલ લૉગિન</span>
              </button>
            )}

            {/* Quick Export Backup Button */}
            <button
              onClick={() => exportBackup(appData)}
              title="સમગ્ર ડેટાનો JSON બેકઅપ ડાઉનલોડ કરો"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Backup & Restore Full Panel Button */}
            <button
              onClick={onOpenBackupModal}
              title="બેકઅપ અને રિસ્ટોર સેન્ટર ખોલો"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">બેકઅપ</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
