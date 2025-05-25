interface Dimensions {
  length_cm: number;
  width_cm: number;
  height_cm: number;
  weight_kg: number;
}

/**
 * Calculates dimensional weight using FedEx DIM factor
 * @param dimensions - The package dimensions
 * @returns number - Dimensional weight in kg (rounded to 2 decimal places)
 */
export const calculateDimensionalWeight = (dimensions: Dimensions): number => {
  // FedEx DIM factor: 5000 for cm/kg
  const volumetricWeight = (dimensions.length_cm * dimensions.width_cm * dimensions.height_cm) / 5000;
  return Math.round(volumetricWeight * 100) / 100; // Round to 2 decimal places
};

/**
 * Gets billed weight (higher of actual weight or dimensional weight)
 * @param dimensions - The package dimensions
 * @returns number - Billed weight in kg
 */
export const getBilledWeight = (dimensions: Dimensions): number => {
  const dimWeight = calculateDimensionalWeight(dimensions);
  return Math.max(dimensions.weight_kg, dimWeight);
};

/**
 * Calculates package volume in cubic centimeters
 * @param dimensions - The package dimensions
 * @returns number - Volume in cm³
 */
export const calculateVolume = (dimensions: Dimensions): number => {
  return dimensions.length_cm * dimensions.width_cm * dimensions.height_cm;
};

/**
 * Calculates package density (weight per volume)
 * @param dimensions - The package dimensions
 * @returns number - Density in kg/cm³
 */
export const calculateDensity = (dimensions: Dimensions): number => {
  const volume = calculateVolume(dimensions);
  return volume > 0 ? dimensions.weight_kg / volume : 0;
};

/**
 * Formats dimensions for display
 * @param dimensions - The package dimensions
 * @returns string - Formatted dimensions string
 */
export const formatDimensions = (dimensions: Dimensions): string => {
  return `${dimensions.length_cm} × ${dimensions.width_cm} × ${dimensions.height_cm} cm`;
};

/**
 * Validates if dimensions are within reasonable limits
 * @param dimensions - The package dimensions
 * @returns boolean - True if dimensions are valid
 */
export const validateDimensions = (dimensions: Dimensions): boolean => {
  return (
    dimensions.length_cm > 0 &&
    dimensions.width_cm > 0 &&
    dimensions.height_cm > 0 &&
    dimensions.weight_kg > 0 &&
    dimensions.length_cm <= 300 && // Max 3 meters
    dimensions.width_cm <= 300 &&
    dimensions.height_cm <= 300 &&
    dimensions.weight_kg <= 70 // FedEx weight limit
  );
};

/**
 * Gets dimension validation errors
 * @param dimensions - The package dimensions
 * @returns string[] - Array of validation error messages
 */
export const getDimensionValidationErrors = (dimensions: Dimensions): string[] => {
  const errors: string[] = [];
  
  if (dimensions.length_cm <= 0) errors.push('Length must be greater than 0');
  if (dimensions.width_cm <= 0) errors.push('Width must be greater than 0');
  if (dimensions.height_cm <= 0) errors.push('Height must be greater than 0');
  if (dimensions.weight_kg <= 0) errors.push('Weight must be greater than 0');
  
  if (dimensions.length_cm > 300) errors.push('Length cannot exceed 300 cm');
  if (dimensions.width_cm > 300) errors.push('Width cannot exceed 300 cm');
  if (dimensions.height_cm > 300) errors.push('Height cannot exceed 300 cm');
  if (dimensions.weight_kg > 70) errors.push('Weight cannot exceed 70 kg');
  
  return errors;
};