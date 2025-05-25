import { useMemo } from 'react';
import { validateShippingForm, validateCollectionSize, FormValidationResult } from '@/lib/form-validation';
import { validateOriginAddress } from '@/lib/utils';

export interface ShippingFormData {
  selectedCollection: string;
  selectedSize: string;
  country: string;
  postalCode: string;
  originCountry: string;
  originPostalCode: string;
  preferredCurrency: string;
}

/**
 * Custom hook for shipping form validation
 * Extracted from Index.tsx for Phase 2 refactoring
 */
export const useShippingValidation = (formData: ShippingFormData) => {
  // Comprehensive form validation
  const formValidation = useMemo(() => {
    return validateShippingForm(formData);
  }, [formData]);

  // Collection and size validation
  const collectionValidation = useMemo(() => {
    return validateCollectionSize(formData.selectedCollection, formData.selectedSize);
  }, [formData.selectedCollection, formData.selectedSize]);

  // Origin address validation
  const originValidation = useMemo(() => {
    if (!formData.originCountry || !formData.originPostalCode) {
      return { isValid: false, error: 'Origin address is required' };
    }
    return validateOriginAddress(formData.originCountry, formData.originPostalCode);
  }, [formData.originCountry, formData.originPostalCode]);

  // Check if basic required fields are filled
  const hasRequiredFields = useMemo(() => {
    return !!(
      formData.selectedCollection?.trim() &&
      formData.selectedSize?.trim() &&
      formData.country?.trim() &&
      formData.postalCode?.trim() &&
      formData.originCountry?.trim() &&
      formData.originPostalCode?.trim() &&
      formData.preferredCurrency?.trim()
    );
  }, [formData]);

  // Check if form is fully valid
  const isFormValid = useMemo(() => {
    return formValidation.isValid && originValidation.isValid;
  }, [formValidation.isValid, originValidation.isValid]);

  // Get all validation errors
  const getAllErrors = useMemo(() => {
    const errors: string[] = [];
    
    if (!formValidation.isValid) {
      errors.push(...formValidation.errors);
    }
    
    if (!originValidation.isValid && originValidation.error) {
      errors.push(originValidation.error);
    }
    
    return errors;
  }, [formValidation, originValidation]);

  // Get all validation warnings
  const getAllWarnings = useMemo(() => {
    return formValidation.warnings || [];
  }, [formValidation.warnings]);

  // Get validation summary
  const getValidationSummary = () => {
    return {
      isValid: isFormValid,
      hasRequiredFields,
      errors: getAllErrors,
      warnings: getAllWarnings,
      fieldStatus: {
        collection: !!formData.selectedCollection,
        size: !!formData.selectedSize,
        destinationCountry: !!formData.country,
        destinationPostalCode: !!formData.postalCode,
        originCountry: !!formData.originCountry,
        originPostalCode: !!formData.originPostalCode,
        currency: !!formData.preferredCurrency,
      },
      validationDetails: {
        form: formValidation,
        collection: collectionValidation,
        origin: originValidation,
      },
    };
  };

  // Check specific field validations
  const fieldValidations = useMemo(() => ({
    isCollectionValid: !!formData.selectedCollection,
    isSizeValid: !!formData.selectedSize && !!formData.selectedCollection,
    isDestinationCountryValid: !!formData.country?.trim(),
    isDestinationPostalCodeValid: !!formData.postalCode?.trim(),
    isOriginCountryValid: !!formData.originCountry?.trim(),
    isOriginPostalCodeValid: !!formData.originPostalCode?.trim() && originValidation.isValid,
    isCurrencyValid: !!formData.preferredCurrency?.trim(),
  }), [formData, originValidation.isValid]);

  return {
    // Main validation status
    isFormValid,
    hasRequiredFields,
    
    // Validation results
    formValidation,
    collectionValidation,
    originValidation,
    
    // Error and warning collections
    errors: getAllErrors,
    warnings: getAllWarnings,
    
    // Field-specific validations
    fieldValidations,
    
    // Utilities
    getValidationSummary,
    
    // Status flags
    hasErrors: getAllErrors.length > 0,
    hasWarnings: getAllWarnings.length > 0,
    isReadyForSubmission: isFormValid && hasRequiredFields,
  };
};
