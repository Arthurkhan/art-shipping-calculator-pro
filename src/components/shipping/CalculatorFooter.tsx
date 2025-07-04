import { FC, memo } from 'react';
import { CheckCircle } from 'lucide-react';

interface CalculatorFooterProps {
  hasCompleteConfig: boolean;
}

export const CalculatorFooter: FC<CalculatorFooterProps> = memo(({ hasCompleteConfig }) => {
  return (
    <div className="text-center mt-4 sm:mt-6 space-y-2">
      <div className="flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 pulse-dot"></span>
        Powered by FedEx Shipping API • Rates updated in real-time
      </div>
      {hasCompleteConfig && (
        <div className="flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          FedEx configuration validated and ready
        </div>
      )}
    </div>
  );
});

CalculatorFooter.displayName = 'CalculatorFooter';