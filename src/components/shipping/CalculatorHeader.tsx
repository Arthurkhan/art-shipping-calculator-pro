import { FC, memo } from 'react';
import { Truck, Package } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export const CalculatorHeader: FC = memo(() => {
  return (
    <>
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="flex items-center justify-center mb-3 sm:mb-4">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 sm:p-3 rounded-xl mr-2 sm:mr-3 shadow-lg float-animation" style={{animationDelay: '0s'}}>
            <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="bg-gradient-to-r from-slate-600 to-slate-700 p-2 sm:p-3 rounded-xl shadow-lg float-animation" style={{animationDelay: '0.5s'}}>
            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 dark:from-slate-100 dark:to-blue-200 bg-clip-text text-transparent mb-2 gradient-text">
          Art Collection Shipping Calculator
        </h1>
      </div>
    </>
  );
});

CalculatorHeader.displayName = 'CalculatorHeader';