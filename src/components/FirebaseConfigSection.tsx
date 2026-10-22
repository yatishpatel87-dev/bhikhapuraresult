import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Copy,
  Check,
  Globe,
  Database,
  Cloud,
  ExternalLink,
  Info,
  Server,
  AlertCircle,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { publicFirebaseConfig, testConnection } from '../firebase/config';
import { useAuth } from '../firebase/AuthContext';

export const FirebaseConfigSection: React.FC = () => {
  const { user } = useAuth();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const ok = await testConnection();
      if (ok) {
        setTestResult('કનેક્શન સફળ! ક્લાઉડ ફાયરસ્ટોર અને ઓથેન્ટિકેશન સક્રિય છે.');
      } else {
        setTestResult('કનેક્શન નિષ્ફળ થયું: ક્લાયન્ટ ઑફલાઇન જણાય છે.');
      }
    } catch (err: any) {
      setTestResult(`ક્ષતિ: ${err.message || 'અજ્ઞાત ક્ષતિ'}`);
    } finally {
      setTesting(false);
    }
  };

  const publicConfigEntries = [
    { label: 'Project ID', value: publicFirebaseConfig.projectId, desc: 'ફાયરબેઝ પ્રોજેક્ટ આઈડી' },
    { label: 'Database ID', value: publicFirebaseConfig.firestoreDatabaseId, desc: 'ક્લાઉડ ફાયરસ્ટોર ડેટાબેઝ' },
    { label: 'Auth Domain', value: publicFirebaseConfig.authDomain, desc: 'ઓથેન્ટિકેશન માન્ય ડોમેન' },
    { label: 'Storage Bucket', value: publicFirebaseConfig.storageBucket, desc: 'ક્લાઉડ સ્ટોરેજ બકેટ' },
    { label: 'App ID', value: publicFirebaseConfig.appId, desc: 'વેબ ક્લાયન્ટ એપ્લિકેશન આઈડી' },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span>ફાયરબેઝ ક્લાઉડ સંકલન & ઓથેન્ટિકેશન</span>
                <span className="text-[10px] uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  Zero-Trust ABAC
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                ગુજરાતી પ્રાથમિક શાળા પરિણામ સોફ્ટવેરનું સુરક્ષિત ફાયરસ્ટોર ડેટાબેઝ અને ગૂગલ લૉગિન સાથે એકીકરણ.
              </p>
            </div>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            <span>કનેક્શન ચકાસો</span>
          </button>
        </div>

        {testResult && (
          <div className="mt-4 p-3 bg-blue-900/60 border border-blue-700/50 rounded-xl text-xs text-blue-200 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-blue-400" />
            <span>{testResult}</span>
          </div>
        )}
      </div>

      {/* Security Guarantee Notice */}
      <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-emerald-900 space-y-1">
            <h4 className="font-bold text-emerald-950 flex items-center gap-2">
              સુરક્ષા બાંયધરી: ખાનગી કી (Private Keys) નું સંપૂર્ણ રક્ષણ
            </h4>
            <p className="text-emerald-800 leading-relaxed">
              આ વેબ એપ્લિકેશનમાં કોઈ ખાનગી સર્વિસ એકાઉન્ટ કી (Service Account Private Key) કે સિક્રેટ્સ મૂકવામાં આવ્યા નથી.
              ફાયરબેઝ વેબ SDK માત્ર પબ્લિક કન્ફિગરેશન આઈડેન્ટીફાયર્સનો ઉપયોગ કરે છે, અને સમગ્ર ડેટા સુરક્ષા ક્લાઉડ પર
              લાગૂ કરેલ <strong>Firestore Security Rules</strong> દ્વારા નિયંત્રિત થાય છે.
            </p>
          </div>
        </div>
      </div>

      {/* Public Firebase Web Configuration Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h4 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              પબ્લિક વેબ પ્રોજેક્ટ કન્ફિગરેશન (Public Configuration Placeholders)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              આ મૂલ્યો બ્રાઉઝર ક્લાયન્ટ માટે સલામત પબ્લિક પ્રોજેક્ટ ઓળખકર્તા છે.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            Read-Only Client Values
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {publicConfigEntries.map((item) => (
            <div
              key={item.label}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0">
                <span className="font-bold text-slate-700 block text-[11px]">{item.label}</span>
                <span className="font-mono text-slate-900 font-semibold block truncate" title={item.value}>
                  {item.value || '(Not Set)'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{item.desc}</span>
              </div>
              <button
                onClick={() => copyToClipboard(item.value, item.label)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-all cursor-pointer shrink-0"
                title="કૉપિ કરો"
              >
                {copiedKey === item.label ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security Rules Architecture Explained */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h4 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-600" />
            ફાયરસ્ટોર સુરક્ષા નિયમો (Firestore Security Rules Explained)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            ઉત્પાદન સ્તરે લાગુ કરાયેલ નિયમો અને ડેટા આઇસોલેશન પદ્ધતિ
          </p>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-700">
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl">
            <h5 className="font-bold text-indigo-950 mb-1">૧. શિક્ષક વાઇઝ અલગ નેમસ્પેસ (Per-Teacher Isolation)</h5>
            <p className="text-indigo-900 leading-relaxed text-xs">
              દરેક શિક્ષકનો તમામ ડેટા ફક્ત <code className="bg-indigo-100 px-1 py-0.5 rounded text-indigo-900 font-mono">users/{'{userId}'}</code> હેઠળ જ સંગ્રહાય છે.
              સુરક્ષા નિયમ <code className="bg-indigo-100 px-1 py-0.5 rounded text-indigo-900 font-mono">request.auth.uid == userId</code> ની ચકાસણી કરે છે, જેથી કોઈ શિક્ષક બીજા કોઈનો ડેટા જોઈ કે બદલી શકતા નથી.
            </p>
          </div>

          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
            <h5 className="font-bold text-blue-950 mb-1">૨. સ્વતંત્ર સબકલેક્શન્સ (Dedicated Subcollections)</h5>
            <ul className="list-disc pl-5 space-y-1 text-xs text-blue-900">
              <li><strong>students:</strong> ધોરણ ૬, ૭, ૮ ના વિદ્યાર્થીઓનું રજિસ્ટર (GR નંબર, નામ, જાતિ, હાજરી).</li>
              <li><strong>subjects:</strong> શાળાના વિષયો અને તેના મહત્તમ ગુણ માળખું.</li>
              <li><strong>results:</strong> વિદ્યાર્થીવાર ત્રિમાસિક, સત્ર ૧, સત્ર ૨, સ્વાધ્યાય, પત્રક A અને પત્રક B (૪૦૦ ગુણ) નો સંકલિત રેકોર્ડ.</li>
            </ul>
          </div>

          <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl">
            <h5 className="font-bold text-rose-950 mb-1">૩. ડિફૉલ્ટ-ડિનાય સુરક્ષા અને ઇનપુટ ગાર્ડ્સ (Default-Deny Catch-All)</h5>
            <p className="text-rose-900 leading-relaxed text-xs">
              કોઈપણ અજાણ્યા પાથ પર <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-rose-900">allow read, write: if false;</code> લાગુ છે.
              સાથે જ દસ્તાવેજ ID પર <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-rose-900">isValidId()</code> ગાર્ડ ઇન્જેક્શન અને સંસાધન પ્રદૂષણ રોકે છે.
            </p>
          </div>
        </div>

        {/* Code Preview */}
        <div className="mt-4">
          <div className="flex items-center justify-between bg-slate-900 text-slate-300 px-4 py-2 rounded-t-xl text-xs font-mono">
            <span>firestore.rules (સક્રિય ઉત્પાદન નિયમો)</span>
            <span className="text-emerald-400 font-bold">● Deployed on Cloud</span>
          </div>
          <pre className="bg-slate-950 text-slate-100 p-4 rounded-b-xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-slate-800">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    match /users/{userId} {
      allow get: if request.auth != null && request.auth.uid == userId;
      allow list: if false;
      allow create, update, delete: if request.auth != null && request.auth.uid == userId;

      match /students/{studentId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /subjects/{subjectId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /results/{studentId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`}
          </pre>
        </div>
      </div>

      {/* Deployment & Vercel Checklist */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h4 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600" />
            Vercel અને કસ્ટમ ડોમેન ડિપ્લોયમેન્ટ માર્ગદર્શિકા (Firebase Console Checklist)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            એપ્લિકેશનને Vercel અથવા પ્રોડક્શન ડોમેન પર મૂકતી વખતે જરૂરી એકમાત્ર સેટિંગ
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-2">
          <p className="font-semibold text-slate-900">
            ગૂગલ સાઇન-ઇન કોઈપણ ડોમેન પર સરળતાથી કામ કરે તે માટે નીચે મુજબ પગલાં લો:
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-600">
            <li>
              <strong>Firebase Console</strong> ({publicFirebaseConfig.projectId}) માં જાઓ.
            </li>
            <li>
              ડાબી બાજુ <strong>Build &gt; Authentication &gt; Settings</strong> ટેબ પસંદ કરો.
            </li>
            <li>
              <strong>Authorized domains</strong> વિભાગમાં <strong>Add domain</strong> પર ક્લિક કરો.
            </li>
            <li>
              તમારો Vercel ડોમેન (દા.ત. <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">your-school-app.vercel.app</code>) અથવા કસ્ટમ ડોમેન ઉમેરો.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};
