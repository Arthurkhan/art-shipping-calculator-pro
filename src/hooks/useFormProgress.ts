import { useMemo } from 'react';

interface FormProgressProps {
  originAddress: {
    originCountry: string;
    originPostalCode: string;
  };
  collectionData: {
    selectedCollection: string;
    selectedSize: string;
  };
  overrideSettings: {
    isOverrideEnabled: boolean;
    hasValidOverrideValues: boolean;
  };
  country: string;
  postalCode: string;
  shipDate: Date | undefined;
  preferredCurrency: string;
}

export const useFormProgress = ({
  originAddress,
  collectionData,
  overrideSettings,
  country,
  postalCode,
  shipDate,
  preferredCurrency,
}: FormProgressProps) => {
  const formProgressSteps = useMemo(() => {
    const hasOrigin = !!originAddress.originCountry && !!originAddress.originPostalCode;
    const hasCollection = overrideSettings.isOverrideEnabled 
      ? overrideSettings.hasValidOverrideValues 
      : (!!collectionData.selectedCollection && !!collectionData.selectedSize);
    const hasDestination = !!country && !!postalCode;
    const hasShippingDetails = !!shipDate && !!preferredCurrency;

    return [
      {
        id: 'origin',
        label: 'Origin Address',
        isComplete: hasOrigin,
        isCurrent: !hasOrigin
      },
      {
        id: 'collection',
        label: overrideSettings.isOverrideEnabled ? 'Custom Dimensions' : 'Art Collection',
        isComplete: hasCollection,
        isCurrent: hasOrigin && !hasCollection
      },
      {
        id: 'destination',
        label: 'Destination',
        isComplete: hasDestination,
        isCurrent: hasOrigin && hasCollection && !hasDestination
      },
      {
        id: 'shipping',
        label: 'Shipping Details',
        isComplete: hasShippingDetails,
        isCurrent: hasOrigin && hasCollection && hasDestination && !hasShippingDetails
      }
    ];
  }, [
    originAddress.originCountry,
    originAddress.originPostalCode,
    collectionData.selectedCollection,
    collectionData.selectedSize,
    overrideSettings.isOverrideEnabled,
    overrideSettings.hasValidOverrideValues,
    country,
    postalCode,
    shipDate,
    preferredCurrency,
  ]);

  return formProgressSteps;
};