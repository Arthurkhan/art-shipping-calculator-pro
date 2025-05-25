/**
 * Formats a number with commas for better readability
 * @param value - The number to format
 * @returns string - Formatted number with commas
 */
export const formatNumberWithCommas = (value: number): string => {
  return value.toLocaleString();
};

/**
 * Formats weight with appropriate units
 * @param weight - Weight in kg
 * @returns string - Formatted weight with units
 */
export const formatWeight = (weight: number): string => {
  return `${weight} kg`;
};

/**
 * Formats dimensions with units
 * @param dimension - Dimension in cm
 * @returns string - Formatted dimension with units
 */
export const formatDimension = (dimension: number): string => {
  return `${dimension} cm`;
};

/**
 * Formats volume with units and commas
 * @param volume - Volume in cm³
 * @returns string - Formatted volume with units
 */
export const formatVolume = (volume: number): string => {
  return `${formatNumberWithCommas(volume)} cm³`;
};

/**
 * Formats ship date (tomorrow's date)
 * @returns string - Formatted date in YYYY-MM-DD format
 */
export const getFormattedShipDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

/**
 * Formats a date for display
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns string - Human-readable date
 */
export const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Formats postal code for display
 * @param postalCode - The postal code
 * @param countryCode - The country code
 * @returns string - Formatted postal code
 */
export const formatPostalCode = (postalCode: string, countryCode: string): string => {
  if (!postalCode) return '';
  
  // Format based on country if needed
  switch (countryCode.toUpperCase()) {
    case 'US':
      // Format US ZIP codes (12345 or 12345-6789)
      if (postalCode.length === 5) {
        return postalCode;
      } else if (postalCode.length === 9) {
        return `${postalCode.slice(0, 5)}-${postalCode.slice(5)}`;
      }
      break;
    case 'CA':
      // Format Canadian postal codes (A1A 1A1)
      if (postalCode.length === 6) {
        return `${postalCode.slice(0, 3)} ${postalCode.slice(3)}`;
      }
      break;
    default:
      return postalCode;
  }
  
  return postalCode;
};

/**
 * Formats country and postal code combination
 * @param countryCode - The country code
 * @param postalCode - The postal code
 * @returns string - Formatted location string
 */
export const formatLocation = (countryCode: string, postalCode: string): string => {
  const formattedPostal = formatPostalCode(postalCode, countryCode);
  return `${countryCode} ${formattedPostal}`.trim();
};

/**
 * Formats currency code for display
 * @param currencyCode - The currency code (e.g., 'USD')
 * @returns string - Formatted currency
 */
export const formatCurrency = (currencyCode: string): string => {
  return currencyCode.toUpperCase();
};

/**
 * Capitalizes first letter of each word
 * @param text - The text to format
 * @returns string - Title case text
 */
export const toTitleCase = (text: string): string => {
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Truncates text to specified length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns string - Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};