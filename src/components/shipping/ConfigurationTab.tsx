import { FC } from 'react';
import { FedexConfigForm } from './FedexConfigForm';

interface ConfigurationTabProps {
  onConfigSave: () => void;
}

export const ConfigurationTab: FC<ConfigurationTabProps> = ({ onConfigSave }) => {
  return <FedexConfigForm onConfigSave={onConfigSave} />;
};