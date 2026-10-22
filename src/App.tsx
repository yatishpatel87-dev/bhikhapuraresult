/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AppData, Standard } from './types';
import { loadAppData, saveAppData } from './utils/storage';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { StudentManager } from './components/StudentManager';
import { MarksEntry } from './components/MarksEntry';
import { PatrakA } from './components/PatrakA';
import { PatrakB } from './components/PatrakB';
import { ClassResult } from './components/ClassResult';
import { ReportCard } from './components/ReportCard';
import { SettingsManager } from './components/SettingsManager';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { AuthProvider, useAuth } from './firebase/AuthContext';
import {
  loadUserDataFromFirestore,
  saveUserDataToFirestore,
} from './firebase/firestoreService';
import { getGujaratiErrorMessage } from './firebase/errors';
import {
  Database,
  ShieldCheck,
  Cloud,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';

function SchoolResultApp() {
  const { user, loading: authLoading, authError, clearAuthError } = useAuth();

  const [appData, setAppData] = useState<AppData>(() => loadAppData());
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [activeStandard, setActiveStandard] = useState<Standard>(8);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string>('');
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Cloud sync states
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [showSaveSuccessToast, setShowSaveSuccessToast] = useState(false);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Load from Firestore when teacher logs in
  useEffect(() => {
    let isCancelled = false;

    async function syncFromCloud() {
      if (!user) {
        // Teacher logged out or anonymous -> load from local storage
        setAppData(loadAppData());
        setSyncStatus('idle');
        return;
      }

      setIsCloudLoading(true);
      setSyncErrorMessage(null);

      try {
        const cloudData = await loadUserDataFromFirestore(user.uid);
        if (isCancelled) return;

        if (cloudData) {
          // Cloud data found -> load it into app state and refresh local backup
          setAppData(cloudData);
          saveAppData(cloudData);
          setSyncStatus('synced');
          setLastSyncedAt(new Date().toLocaleTimeString('gu-IN'));
        } else {
          // First time teacher login: automatically seed their current local school records to Firestore
          const localData = loadAppData();
          await saveUserDataToFirestore(user.uid, localData, {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
          });
          if (isCancelled) return;
          setAppData(localData);
          setSyncStatus('synced');
          setLastSyncedAt(new Date().toLocaleTimeString('gu-IN'));
          setShowSaveSuccessToast(true);
          setTimeout(() => setShowSaveSuccessToast(false), 3000);
        }
      } catch (err: any) {
        if (isCancelled) return;
        console.error('Failed to load from cloud:', err);
        setSyncStatus('error');
        setSyncErrorMessage(getGujaratiErrorMessage(err));
      } finally {
        if (!isCancelled) {
          setIsCloudLoading(false);
        }
      }
    }

    if (!authLoading) {
      syncFromCloud();
    }

    return () => {
      isCancelled = true;
    };
  }, [user, authLoading]);

  // 2. Centralized update handler: updates state, localStorage, and debounced Firestore sync
  const handleUpdateAppData = useCallback(
    (newData: AppData) => {
      setAppData(newData);
      saveAppData(newData); // Immediate offline fallback

      if (user) {
        setSyncStatus('syncing');
        setSyncErrorMessage(null);

        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
        }

        saveTimerRef.current = setTimeout(async () => {
          try {
            await saveUserDataToFirestore(user.uid, newData, {
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
            });
            setSyncStatus('synced');
            setLastSyncedAt(new Date().toLocaleTimeString('gu-IN'));
            setShowSaveSuccessToast(true);
            setTimeout(() => setShowSaveSuccessToast(false), 2500);
          } catch (err) {
            console.error('Firestore auto-save error:', err);
            setSyncStatus('error');
            setSyncErrorMessage(getGujaratiErrorMessage(err));
          }
        }, 600); // 600ms debounce for rapid edits
      }
    },
    [user]
  );

  // Manual trigger to force cloud sync
  const handleManualSync = async () => {
    if (!user) {
      alert('ક્લાઉડ સિંક કરવા માટે કૃપા કરીને પહેલા ગૂગલ લૉગિન કરો.');
      return;
    }

    setSyncStatus('syncing');
    setSyncErrorMessage(null);
    try {
      await saveUserDataToFirestore(user.uid, appData, {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      });
      setSyncStatus('synced');
      setLastSyncedAt(new Date().toLocaleTimeString('gu-IN'));
      setShowSaveSuccessToast(true);
      setTimeout(() => setShowSaveSuccessToast(false), 2500);
    } catch (err) {
      setSyncStatus('error');
      setSyncErrorMessage(getGujaratiErrorMessage(err));
    }
  };

  // Switch tabs from child components
  const handleNavigate = (tab: NavTab, standard?: Standard) => {
    if (standard) setActiveStandard(standard);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Jump directly to a student's Report Card
  const handleNavigateToReport = (studentId: string) => {
    setSelectedStudentForReport(studentId);
    setActiveTab('reportCard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased font-sans">
      {/* App Header with Google Sign-In & Sync Status */}
      <Header
        appData={appData}
        activeTab={activeTab}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        syncStatus={syncStatus}
        lastSyncedAt={lastSyncedAt}
        onManualSync={handleManualSync}
      />

      {/* Main Navigation Bar */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Auth / Cloud Sync Notifications Banner */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-2 space-y-2 no-print">
        {/* Auth Error Banner */}
        {authError && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs sm:text-sm font-medium flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{authError}</span>
            </div>
            <button
              onClick={clearAuthError}
              className="p-1 hover:bg-rose-100 rounded-lg text-rose-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Sync Error Banner */}
        {syncErrorMessage && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs sm:text-sm font-medium flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{syncErrorMessage}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleManualSync}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                ફરી પ્રયાસ કરો
              </button>
              <button
                onClick={() => setSyncErrorMessage(null)}
                className="p-1 hover:bg-amber-100 rounded-lg text-amber-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Save Confirmation Toast */}
        {showSaveSuccessToast && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>તમામ ફેરફારો ક્લાઉડ ફાયરસ્ટોરમાં સુરક્ષિત સાચવાઈ ગયા છે.</span>
            {lastSyncedAt && <span className="text-emerald-600 font-normal">({lastSyncedAt})</span>}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {isCloudLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[350px] bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 animate-pulse">
              <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                ફાયરબેઝ ક્લાઉડમાંથી પરિણામ ડેટા લોડ થઈ રહ્યો છે...
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                કૃપા કરીને રાહ જુઓ, વિદ્યાર્થીઓની યાદી, કસોટી ગુણ અને પત્રકો ક્લાઉડ સાથે સુમેળ થઈ રહ્યા છે.
              </p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard appData={appData} onNavigate={handleNavigate} />
            )}

            {activeTab === 'students' && (
              <StudentManager
                appData={appData}
                onUpdateAppData={handleUpdateAppData}
                onNavigateToReport={handleNavigateToReport}
              />
            )}

            {activeTab === 'marks' && (
              <MarksEntry
                appData={appData}
                onUpdateAppData={handleUpdateAppData}
                initialStandard={activeStandard}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'patrakA' && (
              <PatrakA
                appData={appData}
                onUpdateAppData={handleUpdateAppData}
                initialStandard={activeStandard}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'patrakB' && (
              <PatrakB
                appData={appData}
                onUpdateAppData={handleUpdateAppData}
                initialStandard={activeStandard}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'result' && (
              <ClassResult
                appData={appData}
                onNavigateToReport={handleNavigateToReport}
                initialStandard={activeStandard}
              />
            )}

            {activeTab === 'reportCard' && (
              <ReportCard
                appData={appData}
                selectedStudentId={selectedStudentForReport}
                onSelectStudent={setSelectedStudentForReport}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsManager
                appData={appData}
                onUpdateAppData={handleUpdateAppData}
              />
            )}
          </>
        )}
      </main>

      {/* Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        appData={appData}
        onUpdateAppData={handleUpdateAppData}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-5 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700">
              {appData.settings.schoolName}
            </span>
            <span>•</span>
            <span>ધોરણ ૬ થી ૮ સર્વગ્રાહી પરિણામ મૂલ્યાંકન સોફ્ટવેર</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {user ? (
              <span className="inline-flex items-center gap-1.5 text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                <Cloud className="w-3.5 h-3.5" /> ફાયરસ્ટોર ક્લાઉડ સક્રિય ({user.email?.split('@')[0]})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" /> સ્થાનિક સંગ્રહ સક્રિય (Offline Ready)
              </span>
            )}
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
            >
              બેકઅપ ડાઉનલોડ કરો
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SchoolResultApp />
    </AuthProvider>
  );
}
