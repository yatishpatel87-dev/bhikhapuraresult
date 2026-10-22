import React from 'react';
import {
  LayoutDashboard,
  Users,
  Edit3,
  FileSpreadsheet,
  Award,
  Trophy,
  Printer,
  Settings,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'students'
  | 'marks'
  | 'patrakA'
  | 'patrakB'
  | 'result'
  | 'reportCard'
  | 'settings';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'ડેશબોર્ડ', icon: LayoutDashboard },
    { id: 'students' as NavTab, label: 'વિદ્યાર્થીઓ', icon: Users },
    { id: 'marks' as NavTab, label: 'ગુણ નોંધણી', icon: Edit3 },
    { id: 'patrakA' as NavTab, label: 'પત્રક A', icon: FileSpreadsheet },
    { id: 'patrakB' as NavTab, label: 'પત્રક B', icon: Award },
    { id: 'result' as NavTab, label: 'વર્ગ પરિણામ & મેરિટ', icon: Trophy },
    { id: 'reportCard' as NavTab, label: 'રિપોર્ટ કાર્ડ', icon: Printer },
    { id: 'settings' as NavTab, label: 'સેટિંગ્સ & બેકઅપ', icon: Settings },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 no-print overflow-x-auto shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 py-2 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
