
import { Button } from "@/components/ui/button";
import { Calculator, Loader2 } from "lucide-react";

interface CalculateButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
}

export const CalculateButton = ({ onClick, disabled, isLoading }: CalculateButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg transition-all duration-200 disabled:bg-slate-300"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Calculating Rates...
        </>
      ) : (
        <>
          <Calculator className="w-5 h-5 mr-2" />
          Calculate Shipping Rates
        </>
      )}
    </Button>
  );
};
