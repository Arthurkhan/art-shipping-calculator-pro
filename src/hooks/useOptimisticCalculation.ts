import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { ShippingRate } from './useShippingCalculator';

interface OptimisticRate {
  service: string;
  cost: number;
  currency: string;
  transitTime: string;
  isOptimistic: boolean;
}

export const useOptimisticCalculation = () => {
  const [optimisticRates, setOptimisticRates] = useState<OptimisticRate[]>([]);
  const [isOptimisticLoading, setIsOptimisticLoading] = useState(false);

  // Generate optimistic rates based on common patterns
  const generateOptimisticRates = useCallback((currency: string = 'USD') => {
    const baseRates = [
      {
        service: 'FedEx International Priority',
        baseCost: 150,
        transitDays: '1-3 business days',
      },
      {
        service: 'FedEx International Economy',
        baseCost: 120,
        transitDays: '4-6 business days',
      },
      {
        service: 'FedEx International Ground',
        baseCost: 80,
        transitDays: '7-10 business days',
      },
    ];

    // Add some variation to make it look realistic
    const variation = Math.random() * 0.2 - 0.1; // ±10%

    return baseRates.map(rate => ({
      service: rate.service,
      cost: Math.round(rate.baseCost * (1 + variation)),
      currency,
      transitTime: rate.transitDays,
      isOptimistic: true,
    }));
  }, []);

  // Start optimistic calculation
  const startOptimisticCalculation = useCallback((currency?: string) => {
    setIsOptimisticLoading(true);
    
    // Generate and show optimistic rates immediately
    const rates = generateOptimisticRates(currency);
    setOptimisticRates(rates);
    
    // Simulate loading time
    setTimeout(() => {
      setIsOptimisticLoading(false);
    }, 300);
  }, [generateOptimisticRates]);

  // Clear optimistic rates when real data arrives
  const clearOptimisticRates = useCallback(() => {
    setOptimisticRates([]);
    setIsOptimisticLoading(false);
  }, []);

  // Update with real rates and show differences
  const updateWithRealRates = useCallback((realRates: ShippingRate[]) => {
    if (optimisticRates.length > 0) {
      // Calculate accuracy of optimistic rates
      const accuracy = calculateAccuracy(optimisticRates, realRates);
      
      if (accuracy < 0.8) { // Less than 80% accurate
        toast.info('Rates have been updated with actual FedEx prices');
      }
    }
    
    clearOptimisticRates();
  }, [optimisticRates, clearOptimisticRates]);

  // Calculate accuracy between optimistic and real rates
  const calculateAccuracy = (optimistic: OptimisticRate[], real: ShippingRate[]) => {
    if (!real || real.length === 0) return 0;
    
    let matches = 0;
    optimistic.forEach(optRate => {
      const realRate = real.find(r => 
        r.service.toLowerCase().includes(optRate.service.toLowerCase().split(' ')[2])
      );
      
      if (realRate) {
        const difference = Math.abs(optRate.cost - realRate.cost) / realRate.cost;
        if (difference < 0.15) { // Within 15%
          matches++;
        }
      }
    });
    
    return matches / optimistic.length;
  };

  return {
    optimisticRates,
    isOptimisticLoading,
    startOptimisticCalculation,
    clearOptimisticRates,
    updateWithRealRates,
  };
};