import { FC, memo } from 'react';
import { Calculator, Settings, CheckCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TabNavigationProps {
  activeTab: 'calculator' | 'config';
  setActiveTab: (tab: 'calculator' | 'config') => void;
  tabsRef: React.RefObject<HTMLDivElement>;
  fedexConfigStatus: 'complete' | 'partial' | 'missing' | 'invalid';
}

export const TabNavigation: FC<TabNavigationProps> = memo(({
  activeTab,
  setActiveTab,
  tabsRef,
  fedexConfigStatus,
}) => {
  const getConfigStatusBadge = () => {
    switch (fedexConfigStatus) {
      case 'complete':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-xs sm:text-sm">
            <CheckCircle className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Configured</span>
            <span className="sm:hidden">OK</span>
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="destructive" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs sm:text-sm">
            <AlertTriangle className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Incomplete</span>
            <span className="sm:hidden">!</span>
          </Badge>
        );
      case 'missing':
        return (
          <Badge variant="destructive" className="text-xs sm:text-sm">
            <AlertTriangle className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Missing</span>
            <span className="sm:hidden">X</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive" className="text-xs sm:text-sm">
            <AlertTriangle className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Invalid</span>
            <span className="sm:hidden">!</span>
          </Badge>
        );
    }
  };

  return (
    <div ref={tabsRef} className="flex border-b border-slate-200/70 touch-target gesture-hint">
      <button
        onClick={() => setActiveTab('calculator')}
        className={`flex-1 px-3 sm:px-6 py-3 text-xs sm:text-sm font-semibold transition-all duration-200 ${
          activeTab === 'calculator'
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-b-2 border-blue-600'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50/80 dark:hover:bg-slate-800/80'
        }`}
      >
        <Calculator className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
        <span className="hidden sm:inline">Rate Calculator</span>
        <span className="sm:hidden">Calculator</span>
      </button>
      <button
        onClick={() => setActiveTab('config')}
        className={`flex-1 px-3 sm:px-6 py-3 text-xs sm:text-sm font-semibold transition-all duration-200 relative ${
          activeTab === 'config'
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-b-2 border-blue-600'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50/80 dark:hover:bg-slate-800/80'
        }`}
      >
        <Settings className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
        <span className="hidden sm:inline">FedEx Configuration</span>
        <span className="sm:hidden">Config</span>
        <div className="ml-1 sm:ml-2 inline-block">
          {getConfigStatusBadge()}
        </div>
      </button>
    </div>
  );
});

TabNavigation.displayName = 'TabNavigation';