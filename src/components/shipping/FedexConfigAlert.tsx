import { FC, memo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface FedexConfigAlertProps {
  hasCompleteConfig: boolean;
  isLoading: boolean;
  isMissingConfig: boolean;
  onConfigureClick: () => void;
}

export const FedexConfigAlert: FC<FedexConfigAlertProps> = memo(({
  hasCompleteConfig,
  isLoading,
  isMissingConfig,
  onConfigureClick,
}) => {
  if (hasCompleteConfig || isLoading) {
    return null;
  }

  return (
    <Alert className="mb-4 sm:mb-6 border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-sm sm:text-base">
            {isMissingConfig 
              ? 'FedEx API configuration is required to calculate shipping rates.'
              : 'FedEx API configuration is incomplete. Some credentials are missing.'
            }
          </span>
          <button
            onClick={onConfigureClick}
            className="text-sm text-yellow-700 underline hover:text-yellow-900 whitespace-nowrap"
          >
            Configure Now
          </button>
        </div>
      </AlertDescription>
    </Alert>
  );
});

FedexConfigAlert.displayName = 'FedexConfigAlert';