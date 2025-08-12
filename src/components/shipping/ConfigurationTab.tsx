import { FC } from 'react';
import { FedexConfigForm } from './FedexConfigForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

interface ConfigurationTabProps {
  onConfigSave: () => void;
  isUsingDefaults?: boolean;
  hasCompleteConfig?: boolean;
}

export const ConfigurationTab: FC<ConfigurationTabProps> = ({ 
  onConfigSave, 
  isUsingDefaults, 
  hasCompleteConfig 
}) => {
  return (
    <div className="space-y-4">
      {isUsingDefaults && hasCompleteConfig && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-2">
              <p className="font-medium">Default FedEx Configuration Active</p>
              <p className="text-sm">
                The application is currently using pre-configured FedEx API credentials. 
                You can calculate shipping rates immediately, or enter your own credentials below to override the defaults.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <FedexConfigForm onConfigSave={onConfigSave} />
    </div>
  );
};