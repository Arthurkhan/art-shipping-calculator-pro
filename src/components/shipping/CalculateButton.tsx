
import { Button } from "@/components/ui/button";
import { Calculator, Loader2, AlertTriangle } from "lucide-react";

interface CalculateButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  fedexConfigMissing?: boolean;
}

export const CalculateButton = ({ onClick, disabled, isLoading, fedexConfigMissing }: CalculateButtonProps) => {
  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          <span className="animate-pulse">Calculating Rates...</span>
        </>
      );
    }
    
    if (fedexConfigMissing) {
      return (
        <>
          <AlertTriangle className="w-5 h-5 mr-2" />
          Configure FedEx First
        </>
      );
    }
    
    return (
      <>
        <Calculator className="w-5 h-5 mr-2" />
        Calculate Shipping Rates
      </>
    );
  };

  const getButtonVariant = () => {
    if (fedexConfigMissing) {
      return "outline";
    }
    return "default";
  };

  const getButtonClassName = () => {
    const baseClasses = "w-full h-12 font-medium text-lg transition-all duration-200 button-press button-hover";
    
    if (fedexConfigMissing) {
      return `${baseClasses} border-orange-300 text-orange-700 hover:bg-orange-50 disabled:bg-slate-100 disabled:text-slate-400`;
    }
    
    return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-300 disabled:text-slate-500`;
  };

  return (
    <div className="relative">
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        variant={getButtonVariant()}
        className={getButtonClassName()}
      >
        {getButtonContent()}
      </Button>
      {isLoading && (
        <div className="absolute bottom-0 left-0 right-0 progress-bar rounded-b-md" />
      )}
    </div>
  );
};
