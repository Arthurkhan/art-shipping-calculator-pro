/**
 * Shared preview calculation utilities
 * Extracted as part of Phase 3.3: Extract Preview Calculations
 */

interface Dimensions {
  length_cm: number;
  width_cm: number;
  height_cm: number;
  weight_kg: number;
}

/**
 * Calculate dimensional weight (DIM weight) using FedEx standard
 * @param dimensions - Package dimensions
 * @returns Dimensional weight in kg, rounded to 2 decimal places
 */
export const calculateDimensionalWeight = (dimensions: Dimensions): number => {
  // FedEx DIM factor: 5000 for cm/kg
  const volumetricWeight = (dimensions.length_cm * dimensions.width_cm * dimensions.height_cm) / 5000;
  return Math.round(volumetricWeight * 100) / 100;
};

/**
 * Get billed weight (higher of actual weight or dimensional weight)
 * @param dimensions - Package dimensions
 * @returns Billed weight in kg
 */
export const getBilledWeight = (dimensions: Dimensions): number => {
  const dimWeight = calculateDimensionalWeight(dimensions);
  return Math.max(dimensions.weight_kg, dimWeight);
};

/**
 * Format preview data for display
 * @param params - Preview parameters
 * @returns Formatted preview data object
 */
export const formatPreviewData = (params: {
  sizeData: Dimensions;
  collectionName: string;
  size: string;
  country: string;
  postalCode: string;
  originCountry: string;
  originPostalCode: string;
  preferredCurrency: string;
}) => {
  const dimensionalWeight = calculateDimensionalWeight(params.sizeData);
  const billedWeight = getBilledWeight(params.sizeData);
  const volume = params.sizeData.length_cm * params.sizeData.width_cm * params.sizeData.height_cm;
  
  return {
    collection: {
      name: params.collectionName,
      size: params.size,
      packageCount: 1
    },
    route: {
      from: `${params.originCountry} ${params.originPostalCode}`,
      to: `${params.country} ${params.postalCode}`,
      shipDate: getShipDate()
    },
    dimensions: {
      length: params.sizeData.length_cm,
      width: params.sizeData.width_cm,
      height: params.sizeData.height_cm,
      total: `${params.sizeData.length_cm} × ${params.sizeData.width_cm} × ${params.sizeData.height_cm} cm`,
      volume: volume.toLocaleString() + ' cm³'
    },
    weight: {
      actual: params.sizeData.weight_kg,
      dimensional: dimensionalWeight,
      billed: billedWeight
    },
    fedexApi: {
      currency: params.preferredCurrency.toUpperCase(),
      pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
      packagingType: 'YOUR_PACKAGING',
      rateRequestTypes: ['LIST', 'ACCOUNT', 'INCENTIVE'],
      groupPackageCount: 1,
      weightUnits: 'KG'
    },
    debug: {
      volume: volume.toLocaleString(),
      dimFactor: '5000 (FedEx standard for CM/KG)',
      shipDate: `${getShipDate()} (Tomorrow)`,
      currencySource: 'User-selected (not auto-mapped)'
    }
  };
};

/**
 * Build preview sections for organized display
 * @param formattedData - Formatted preview data
 * @returns Array of preview sections
 */
export const buildPreviewSections = (formattedData: ReturnType<typeof formatPreviewData>) => {
  return [
    {
      title: 'Collection & Size',
      icon: 'Package',
      color: 'blue',
      items: [
        { label: 'Collection', value: formattedData.collection.name },
        { label: 'Size', value: formattedData.collection.size },
        { label: 'Number of boxes', value: formattedData.collection.packageCount.toString() }
      ]
    },
    {
      title: 'Shipping Route',
      icon: 'Globe',
      color: 'green',
      items: [
        { label: 'From', value: formattedData.route.from },
        { label: 'To', value: formattedData.route.to },
        { label: 'Ship Date', value: formattedData.route.shipDate }
      ]
    },
    {
      title: 'Dimensions (CM)',
      icon: 'Calculator',
      color: 'purple',
      items: [
        { label: 'Length', value: `${formattedData.dimensions.length} cm` },
        { label: 'Width', value: `${formattedData.dimensions.width} cm` },
        { label: 'Height', value: `${formattedData.dimensions.height} cm` },
        { label: 'Total', value: formattedData.dimensions.total }
      ]
    },
    {
      title: 'Weight Calculation',
      icon: 'Package',
      color: 'orange',
      items: [
        { label: 'Actual Weight', value: `${formattedData.weight.actual} kg` },
        { label: 'Dimensional Weight', value: `${formattedData.weight.dimensional} kg` },
        { label: 'Billed Weight', value: `${formattedData.weight.billed} kg`, highlight: true },
        { label: '', value: '(Higher of actual or dimensional weight)' }
      ]
    },
    {
      title: 'FedEx API Parameters',
      icon: 'MapPin',
      color: 'indigo',
      items: [
        { label: 'Preferred Currency', value: formattedData.fedexApi.currency, highlight: true },
        { label: 'Pickup Type', value: formattedData.fedexApi.pickupType },
        { label: 'Packaging Type', value: formattedData.fedexApi.packagingType },
        { label: 'Rate Request Types', value: formattedData.fedexApi.rateRequestTypes.join(', ') },
        { label: 'Group Package Count', value: formattedData.fedexApi.groupPackageCount.toString() },
        { label: 'Weight Units', value: formattedData.fedexApi.weightUnits }
      ]
    }
  ];
};

/**
 * Get current ship date (tomorrow)
 * @returns Ship date in YYYY-MM-DD format
 */
export const getShipDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

/**
 * Validate dimensions for shipping
 * @param dimensions - Package dimensions to validate
 * @returns Validation result with errors if any
 */
export const validateShippingDimensions = (dimensions: Dimensions): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  // Check minimum dimensions
  if (dimensions.length_cm <= 0) errors.push('Length must be greater than 0');
  if (dimensions.width_cm <= 0) errors.push('Width must be greater than 0');
  if (dimensions.height_cm <= 0) errors.push('Height must be greater than 0');
  if (dimensions.weight_kg <= 0) errors.push('Weight must be greater than 0');
  
  // Check maximum dimensions (FedEx limits)
  if (dimensions.length_cm > 300) errors.push('Length cannot exceed 300 cm');
  if (dimensions.width_cm > 300) errors.push('Width cannot exceed 300 cm');
  if (dimensions.height_cm > 300) errors.push('Height cannot exceed 300 cm');
  if (dimensions.weight_kg > 70) errors.push('Weight cannot exceed 70 kg');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calculate package density
 * @param dimensions - Package dimensions
 * @returns Density in kg/cm³
 */
export const calculatePackageDensity = (dimensions: Dimensions): number => {
  const volume = dimensions.length_cm * dimensions.width_cm * dimensions.height_cm;
  return volume > 0 ? dimensions.weight_kg / volume : 0;
};

/**
 * Determine if package is oversized based on FedEx standards
 * @param dimensions - Package dimensions
 * @returns Boolean indicating if package is oversized
 */
export const isOversizedPackage = (dimensions: Dimensions): boolean => {
  const maxDimension = Math.max(dimensions.length_cm, dimensions.width_cm, dimensions.height_cm);
  const girth = 2 * (dimensions.width_cm + dimensions.height_cm);
  const lengthPlusGirth = dimensions.length_cm + girth;
  
  return maxDimension > 119 || lengthPlusGirth > 330 || dimensions.weight_kg > 68;
};