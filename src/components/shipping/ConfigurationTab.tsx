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
      <FedexConfigForm onConfigSave={onConfigSave} isUsingDefaults={isUsingDefaults} />
    </div>
  );
};