import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// Types for box configuration
export interface BoxConfiguration {
  id: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  weight: number;
  quantity: number;
}

// Types for override settings
export interface OverrideSettings {
  enabled: boolean;
  boxes: BoxConfiguration[];
}

// Default box configuration
const DEFAULT_BOX_CONFIG: Omit<BoxConfiguration, 'id'> = {
  dimensions: {
    length: 40,
    width: 31,
    height: 28,
  },
  weight: 4,
  quantity: 1,
};

// Default override values
const DEFAULT_OVERRIDE_SETTINGS: OverrideSettings = {
  enabled: false,
  boxes: [{
    id: crypto.randomUUID(),
    ...DEFAULT_BOX_CONFIG,
  }],
};

// LocalStorage key
const OVERRIDE_STORAGE_KEY = 'art-shipping-override-settings';

/**
 * Custom hook for managing override settings with multiple box configurations
 * Allows users to specify different box sizes and quantities in a single shipment
 */
export const useOverrideSettings = () => {
  const { toast } = useToast();
  const [overrideSettings, setOverrideSettings] = useState<OverrideSettings>(DEFAULT_OVERRIDE_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(OVERRIDE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure boxes have IDs
        if (parsed.boxes && Array.isArray(parsed.boxes)) {
          parsed.boxes = parsed.boxes.map((box: any) => ({
            ...box,
            id: box.id || crypto.randomUUID(),
          }));
        }
        setOverrideSettings({
          ...DEFAULT_OVERRIDE_SETTINGS,
          ...parsed,
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
        ? "Using custom box configurations for calculations" 
        : "Using default collection dimensions and weight",
    });
  };

  // Add a new box configuration
  const addBoxConfiguration = () => {
    const newBox: BoxConfiguration = {
      id: crypto.randomUUID(),
      ...DEFAULT_BOX_CONFIG,
    };

    setOverrideSettings(prev => ({
      ...prev,
      boxes: [...prev.boxes, newBox],
    }));
  };

  // Remove a box configuration
  const removeBoxConfiguration = (boxId: string) => {
    setOverrideSettings(prev => ({
      ...prev,
      boxes: prev.boxes.filter(box => box.id !== boxId),
    }));
  };

  // Update a specific box configuration
  const updateBoxConfiguration = (boxId: string, updates: Partial<Omit<BoxConfiguration, 'id'>>) => {
    setOverrideSettings(prev => ({
      ...prev,
      boxes: prev.boxes.map(box => 
        box.id === boxId 
          ? {
              ...box,
              ...updates,
              dimensions: updates.dimensions 
                ? { ...box.dimensions, ...updates.dimensions }
                : box.dimensions,
            }
          : box
      ),
    }));
  };

  // Update dimensions for a specific box
  const updateBoxDimensions = (boxId: string, dimensions: Partial<BoxConfiguration['dimensions']>) => {
    updateBoxConfiguration(boxId, {
      dimensions: {
        ...overrideSettings.boxes.find(b => b.id === boxId)?.dimensions || DEFAULT_BOX_CONFIG.dimensions,
        ...dimensions,
      },
    });
  };

  // Update weight for a specific box
  const updateBoxWeight = (boxId: string, weight: number) => {
    updateBoxConfiguration(boxId, { weight });
  };

  // Update quantity for a specific box
  const updateBoxQuantity = (boxId: string, quantity: number) => {
    updateBoxConfiguration(boxId, { quantity });
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

    if (overrideSettings.boxes.length === 0) {
      errors.push("At least one box configuration is required");
      return { isValid: false, errors };
    }

    overrideSettings.boxes.forEach((box, index) => {
      const boxLabel = overrideSettings.boxes.length > 1 ? `Box ${index + 1}: ` : '';
      
      // Validate dimensions
      if (box.dimensions.length <= 0) {
        errors.push(`${boxLabel}Length must be greater than 0`);
      }
      if (box.dimensions.width <= 0) {
        errors.push(`${boxLabel}Width must be greater than 0`);
      }
      if (box.dimensions.height <= 0) {
        errors.push(`${boxLabel}Height must be greater than 0`);
      }

      // Validate weight
      if (box.weight <= 0) {
        errors.push(`${boxLabel}Weight must be greater than 0`);
      }

      // Validate quantity
      if (box.quantity < 1 || !Number.isInteger(box.quantity)) {
        errors.push(`${boxLabel}Quantity must be a positive integer`);
      }
    });

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

    // For now, we'll aggregate all boxes into a single shipment
    // The backend will need to be updated to handle multiple box configurations
    // This is a temporary solution that sums up all boxes
    const totalWeight = overrideSettings.boxes.reduce((sum, box) => sum + (box.weight * box.quantity), 0);
    const totalQuantity = overrideSettings.boxes.reduce((sum, box) => sum + box.quantity, 0);
    
    // Use the largest box dimensions for now (temporary solution)
    const maxDimensions = overrideSettings.boxes.reduce((max, box) => {
      const boxVolume = box.dimensions.length * box.dimensions.width * box.dimensions.height;
      const maxVolume = max.length * max.width * max.height;
      return boxVolume > maxVolume ? box.dimensions : max;
    }, overrideSettings.boxes[0]?.dimensions || DEFAULT_BOX_CONFIG.dimensions);

    return {
      weight_kg: totalWeight / totalQuantity, // Average weight per box
      height_cm: maxDimensions.height,
      length_cm: maxDimensions.length,
      width_cm: maxDimensions.width,
      quantity: totalQuantity,
      // Include detailed box configurations for future use
      box_configurations: overrideSettings.boxes.map(box => ({
        dimensions: box.dimensions,
        weight: box.weight,
        quantity: box.quantity,
      })),
    };
  };

  // Calculate dimensional weight for a specific box
  const calculateBoxDimensionalWeight = (box: BoxConfiguration) => {
    const { length, width, height } = box.dimensions;
    // FedEx DIM factor: 5000 for cm/kg
    return (length * width * height) / 5000;
  };

  // Get billed weight for a specific box
  const getBoxBilledWeight = (box: BoxConfiguration) => {
    const dimWeight = calculateBoxDimensionalWeight(box);
    return Math.max(box.weight, dimWeight);
  };

  // Get total shipment stats
  const getShipmentStats = () => {
    const totalBoxes = overrideSettings.boxes.reduce((sum, box) => sum + box.quantity, 0);
    const totalWeight = overrideSettings.boxes.reduce((sum, box) => sum + (box.weight * box.quantity), 0);
    const totalBilledWeight = overrideSettings.boxes.reduce((sum, box) => 
      sum + (getBoxBilledWeight(box) * box.quantity), 0
    );

    return {
      totalBoxes,
      totalWeight,
      totalBilledWeight,
      boxConfigurations: overrideSettings.boxes.length,
    };
  };

  return {
    // State
    overrideSettings,
    
    // Actions
    toggleOverride,
    addBoxConfiguration,
    removeBoxConfiguration,
    updateBoxConfiguration,
    updateBoxDimensions,
    updateBoxWeight,
    updateBoxQuantity,
    resetToDefaults,
    
    // Utilities
    validateOverrideValues,
    getOverrideData,
    calculateBoxDimensionalWeight,
    getBoxBilledWeight,
    getShipmentStats,
    
    // Status
    isOverrideEnabled: overrideSettings.enabled,
    hasValidOverrideValues: validateOverrideValues().isValid,
  };
};
