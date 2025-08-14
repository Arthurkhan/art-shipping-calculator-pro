import { Card } from "@/components/ui/card";
import { Clock, Truck, Tag, RefreshCw, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";

interface ShippingRate {
  service: string;
  cost: number;
  currency: string;
  transitTime: string;
  deliveryDate?: string;
  rateType?: string;
  isLastMinute?: boolean;
  isAlternative?: boolean;
}

interface ResultsDisplayProps {
  rates: ShippingRate[];
  isLoading: boolean;
  preferredCurrency?: string;
}

// Utility function to format numbers with comma separators
const formatPrice = (price: number): string => {
  return Math.round(price).toLocaleString();
};

// Group rates by service type and organize LIST/ACCOUNT pairs
const organizeRates = (rates: ShippingRate[]): Map<string, { list?: ShippingRate, account?: ShippingRate }> => {
  const organized = new Map<string, { list?: ShippingRate, account?: ShippingRate }>();
  
  rates.forEach(rate => {
    const service = rate.service;
    if (!organized.has(service)) {
      organized.set(service, {});
    }
    
    const serviceRates = organized.get(service)!;
    
    // Organize by rate type
    if (rate.rateType === 'LIST' || rate.rateType === 'RATED_LIST_PACKAGE') {
      serviceRates.list = rate;
    } else if (rate.rateType === 'ACCOUNT' || rate.rateType === 'RATED_ACCOUNT' || 
               rate.rateType === 'INCENTIVE' || rate.rateType === 'RATED_INCENTIVE') {
      serviceRates.account = rate;
    }
  });
  
  return organized;
};

export const ResultsDisplay = ({ rates, isLoading, preferredCurrency }: ResultsDisplayProps) => {
  // Currency conversion hook
  const {
    formatDualCurrency,
    convertAmount,
    fromCurrency,
    toCurrency,
    getExchangeRateDisplay,
    refreshRate,
    isLoading: isLoadingRate,
    error: rateError
  } = useCurrencyConversion(preferredCurrency || 'THB', 'THB');
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-slate-800">Calculating shipping rates...</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-3 sm:p-4 skeleton-shimmer">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (rates.length === 0) {
    return null;
  }

  // Organize rates by service type
  const organizedRates = organizeRates(rates);

  return (
    <div className="space-y-4 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center">
          <Truck className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Available Shipping Options
        </h3>
        {preferredCurrency && preferredCurrency !== 'THB' && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{getExchangeRateDisplay()}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshRate}
              disabled={isLoadingRate}
              className="h-6 px-2"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingRate ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        )}
      </div>
      <div className="space-y-3 sm:space-y-4">
        {Array.from(organizedRates.entries()).map(([service, serviceRates]) => {
          const { list, account } = serviceRates;
          
          // Use account rate as primary if available, otherwise use list
          const primaryRate = account || list;
          if (!primaryRate) return null;
          
          // Calculate discount if both rates exist
          const hasDiscount = list && account && list.cost > account.cost;
          const discountAmount = hasDiscount ? list.cost - account.cost : 0;
          const discountPercent = hasDiscount ? Math.round((discountAmount / list.cost) * 100) : 0;
          
          return (
            <Card key={service} className="p-3 sm:p-4 hover:shadow-md transition-shadow border-slate-200 card-hover success-animation mobile-card-compact touch-feedback" style={{animationDelay: `${Array.from(organizedRates.keys()).indexOf(service) * 0.1}s`}}>
              <div className="space-y-3">
                {/* Service Name and Badge */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h4 className="font-medium text-slate-800 text-sm sm:text-base break-words">
                      {primaryRate.service}
                    </h4>
                    <Badge variant="secondary" className="badge-responsive w-fit">
                      {primaryRate.rateType === 'ACCOUNT' ? 'Account' : 
                       primaryRate.rateType === 'INCENTIVE' ? 'Incentive' :
                       primaryRate.rateType || 'Standard'}
                    </Badge>
                  </div>
                  
                  {/* Transit Time */}
                  <div className="flex items-start text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0 mt-0.5" />
                    <span className="break-words">
                      {primaryRate.transitTime}
                      {primaryRate.deliveryDate && (
                        <span className="block sm:inline sm:ml-2">
                          • Delivery: {primaryRate.deliveryDate}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                
                {/* Pricing Section */}
                <div className="pt-2 border-t border-slate-100">
                  {hasDiscount ? (
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs sm:text-sm line-through text-slate-500 dark:text-slate-400">
                          THB {formatPrice(list.cost)}
                        </span>
                        <Badge variant="outline" className="badge-responsive border-green-600 text-green-700">
                          <Tag className="w-3 h-3 mr-1" />
                          {discountPercent}% off
                        </Badge>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <div>
                            <div className="text-lg sm:text-xl font-bold text-slate-800">
                              <span className="text-sm font-normal text-gray-500">THB</span> {Math.round(account.cost).toLocaleString()}
                            </div>
                            {convertAmount && toCurrency && toCurrency !== 'THB' && (() => {
                              const converted = convertAmount(account.cost);
                              return converted !== null ? (
                                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                  {toCurrency} {Math.round(converted).toLocaleString()}
                                </div>
                              ) : null;
                            })()}
                          </div>
                          <div className="text-xs sm:text-sm text-green-600">
                            Save THB {formatPrice(discountAmount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-end justify-between">
                      <div>
                        <div>
                          <div className="text-lg sm:text-xl font-bold text-slate-800">
                            <span className="text-sm font-normal text-gray-500">THB</span> {Math.round(primaryRate.cost).toLocaleString()}
                          </div>
                          {convertAmount && toCurrency && toCurrency !== 'THB' && (() => {
                            const converted = convertAmount(primaryRate.cost);
                            return converted !== null ? (
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                {toCurrency} {Math.round(converted).toLocaleString()}
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
