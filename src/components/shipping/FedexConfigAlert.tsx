import { FC, memo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface FedexConfigAlertProps {
  hasCompleteConfig: boolean;
  isLoading: boolean;
  isMissingConfig: boolean;
  isUsingDefaults?: boolean;
  onConfigureClick: () => void;
}

export const FedexConfigAlert: FC<FedexConfigAlertProps> = memo(({
  hasCompleteConfig,
  isLoading,
  isMissingConfig,
  isUsingDefaults,
  onConfigureClick,
}) => {
  if (isLoading) {
    return null;
  }

  // Show success message when using defaults
  if (hasCompleteConfig && isUsingDefaults) {
    return (
      <Alert className="mb-4 sm:mb-6 border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-sm sm:text-base">
              Using default FedEx API configuration. Shipping rates ready to calculate.
            </span>
            <button
              onClick={onConfigureClick}
              className="text-sm text-green-700 underline hover:text-green-900 whitespace-nowrap"
            >
              Use Custom Config
            </button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Hide if config is complete (user's own config)
  if (hasCompleteConfig && !isUsingDefaults) {
    return null;
  }

  // Show warning if no config at all
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