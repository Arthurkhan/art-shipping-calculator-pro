import { FC } from 'react';
import { FedexConfigForm } from './FedexConfigForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

interface ConfigurationTabProps {
  onConfigSave: () => void;
  isUsingDefaults?: boolean;
  hasCompleteConfig?: boolean;
  preferDefaults?: boolean;
  onToggleDefaults?: (useDefaults: boolean) => void;
  hasDefaults?: boolean;
  hasCustomConfig?: boolean;
}

export const ConfigurationTab: FC<ConfigurationTabProps> = ({ 
  onConfigSave, 
  isUsingDefaults, 
  hasCompleteConfig,
  preferDefaults,
  onToggleDefaults,
  hasDefaults,
  hasCustomConfig
}) => {
  return (
    <div className="space-y-4">
      <FedexConfigForm 
        onConfigSave={onConfigSave} 
        isUsingDefaults={isUsingDefaults}
        preferDefaults={preferDefaults}
        onToggleDefaults={onToggleDefaults}
        hasDefaults={hasDefaults}
        hasCustomConfig={hasCustomConfig}
      />
    </div>
  );
};