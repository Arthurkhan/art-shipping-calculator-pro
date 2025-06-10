import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Types for override settings
export interface OverrideSettings {
  enabled: boolean;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  weight: number;
  quantity: number;
}

// Default override values
const DEFAULT_OVERRIDE_SETTINGS: OverrideSettings = {
  enabled: false,
  dimensions: {
    length: 40,
    width: 31,
    height: 28,
  },
  weight: 4,
  quantity: 1,
};

// LocalStorage key
const OVERRIDE_STORAGE_KEY = 'art-shipping-override-settings';

/**
 * Custom hook for managing override settings
 * Allows users to override collection dimensions, weight, and quantity
 */
export const useOverrideSettings = () => {
  const { toast } = useToast();
  const [overrideSettings, setOverrideSettings] = useState<OverrideSettings>(DEFAULT_OVERRIDE_SETTINGS);
  const [isOverrideFormOpen, setIsOverrideFormOpen] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(OVERRIDE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setOverrideSettings({
          ...DEFAULT_OVERRIDE_SETTINGS,
          ...parsed,
          dimensions: {
            ...DEFAULT_OVERRIDE_SETTINGS.dimensions,
            ...(parsed.dimensions || {}),
          },
        });
      }
    } catch (error) {
      console.error('Error loading override settings:', error);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(OVERRIDE_STORAGE_KEY, JSON.stringify(overrideSettings));
    } catch (error) {
      console.error('Error saving override settings:', error);
    }
  }, [overrideSettings]);

  // Toggle override mode
  const toggleOverride = () => {
    const newEnabled = !overrideSettings.enabled;
    setOverrideSettings(prev => ({
      ...prev,
      enabled: newEnabled,
    }));

    toast({
      title: newEnabled ? "Override Mode Enabled" : "Override Mode Disabled",
      description: newEnabled 
        ? "Using custom dimensions and weight for calculations" 
        : "Using default collection dimensions and weight",
    });
  };

  // Update dimensions
  const updateDimensions = (dimensions: Partial<OverrideSettings['dimensions']>) => {
    setOverrideSettings(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        ...dimensions,
      },
    }));
  };

  // Update weight
  const updateWeight = (weight: number) => {
    setOverrideSettings(prev => ({
      ...prev,
      weight,
    }));
  };

  // Update quantity
  const updateQuantity = (quantity: number) => {
    setOverrideSettings(prev => ({
      ...prev,
      quantity,
    }));
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setOverrideSettings(DEFAULT_OVERRIDE_SETTINGS);
    toast({
      title: "Reset to Defaults",
      description: "Override settings have been reset to default values",
    });
  };

  // Validate override values
  const validateOverrideValues = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate dimensions
    if (overrideSettings.dimensions.length <= 0) {
      errors.push("Length must be greater than 0");
    }
    if (overrideSettings.dimensions.width <= 0) {
      errors.push("Width must be greater than 0");
    }
    if (overrideSettings.dimensions.height <= 0) {
      errors.push("Height must be greater than 0");
    }

    // Validate weight
    if (overrideSettings.weight <= 0) {
      errors.push("Weight must be greater than 0");
    }

    // Validate quantity
    if (overrideSettings.quantity < 1 || !Number.isInteger(overrideSettings.quantity)) {
      errors.push("Quantity must be a positive integer");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Get override data for shipping calculation
  const getOverrideData = () => {
    if (!overrideSettings.enabled) {
      return null;
    }

    return {
      weight_kg: overrideSettings.weight,
      height_cm: overrideSettings.dimensions.height,
      length_cm: overrideSettings.dimensions.length,
      width_cm: overrideSettings.dimensions.width,
      quantity: overrideSettings.quantity,
    };
  };

  // Calculate dimensional weight for override values
  const calculateOverrideDimensionalWeight = () => {
    const { length, width, height } = overrideSettings.dimensions;
    // FedEx DIM factor: 5000 for cm/kg
    return (length * width * height) / 5000;
  };

  // Get billed weight for override values
  const getOverrideBilledWeight = () => {
    const dimWeight = calculateOverrideDimensionalWeight();
    return Math.max(overrideSettings.weight, dimWeight);
  };

  return {
    // State
    overrideSettings,
    isOverrideFormOpen,
    
    // Actions
    toggleOverride,
    updateDimensions,
    updateWeight,
    updateQuantity,
    resetToDefaults,
    setIsOverrideFormOpen,
    
    // Utilities
    validateOverrideValues,
    getOverrideData,
    calculateOverrideDimensionalWeight,
    getOverrideBilledWeight,
    
    // Status
    isOverrideEnabled: overrideSettings.enabled,
    hasValidOverrideValues: validateOverrideValues().isValid,
  };
};
