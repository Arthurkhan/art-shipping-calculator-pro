import { FC } from 'react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { CalculateButton } from './CalculateButton';
import { EnhancedResultsDisplay } from './EnhancedResultsDisplay';

interface MobileUIProps {
  // Mobile UI state
  isMobile: boolean;
  showStickyButton: boolean;
  isBottomSheetOpen: boolean;
  setIsBottomSheetOpen: (open: boolean) => void;
  
  // Button props
  onCalculate: () => void;
  isCalculating: boolean;
  buttonDisabled: boolean;
  fedexConfigMissing: boolean;
  
  // Results props
  rates: any[];
  originAddress: {
    country: string;
    postalCode: string;
  };
  destinationAddress: {
    country: string;
    postalCode: string;
  };
  shipDate: Date | undefined;
  packageDetails?: {
    weight: number;
    dimensions: {
      length_cm: number;
      width_cm: number;
      height_cm: number;
    };
  };
}

export const MobileUI: FC<MobileUIProps> = ({
  isMobile,
  showStickyButton,
  isBottomSheetOpen,
  setIsBottomSheetOpen,
  onCalculate,
  isCalculating,
  buttonDisabled,
  fedexConfigMissing,
  rates,
  originAddress,
  destinationAddress,
  shipDate,
  packageDetails,
}) => {
  if (!isMobile) return null;

  return (
    <>
      {/* Mobile Sticky Calculate Button */}
      {showStickyButton && (
        <div className={`sticky-calculate-button ${showStickyButton ? 'visible' : 'hidden'}`}>
          <CalculateButton
            onClick={onCalculate}
            disabled={buttonDisabled}
            isLoading={isCalculating}
            fedexConfigMissing={fedexConfigMissing}
          />
        </div>
      )}

      {/* Mobile Bottom Sheet for Results */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        title="Shipping Rates"
        snapPoints={[0.5, 0.9]}
        defaultSnapPoint={0}
      >
        <EnhancedResultsDisplay 
          rates={rates} 
          isLoading={isCalculating}
          originAddress={originAddress}
          destinationAddress={destinationAddress}
          shipDate={shipDate}
          packageDetails={packageDetails}
        />
      </BottomSheet>
    </>
  );
};