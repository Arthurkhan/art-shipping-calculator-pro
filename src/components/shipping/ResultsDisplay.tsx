import { Card } from "@/components/ui/card";
import { Clock, Truck, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

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
}

// Utility function to format numbers with comma separators
const formatPrice = (price: number): string => {
  return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

export const ResultsDisplay = ({ rates, isLoading }: ResultsDisplayProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-slate-800">Calculating shipping rates...</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-3 sm:p-4">
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
    <div className="space-y-4">
      <h3 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center">
        <Truck className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        Available Shipping Options
      </h3>
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
            <Card key={service} className="p-3 sm:p-4 hover:shadow-md transition-shadow border-slate-200">
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
                  <div className="flex items-start text-xs sm:text-sm text-slate-600">
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
                        <span className="text-xs sm:text-sm line-through text-slate-500">
                          {list.currency} {formatPrice(list.cost)}
                        </span>
                        <Badge variant="outline" className="badge-responsive border-green-600 text-green-700">
                          <Tag className="w-3 h-3 mr-1" />
                          {discountPercent}% off
                        </Badge>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-lg sm:text-xl font-bold text-slate-800">
                            {account.currency} {formatPrice(account.cost)}
                          </div>
                          <div className="text-xs sm:text-sm text-green-600">
                            Save {account.currency} {formatPrice(discountAmount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-lg sm:text-xl font-bold text-slate-800">
                          {primaryRate.currency} {formatPrice(primaryRate.cost)}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-500">
                          {primaryRate.currency === 'THB' ? 'Thai Baht' : 
                           primaryRate.currency === 'USD' ? 'US Dollar' : 
                           primaryRate.currency === 'SGD' ? 'Singapore Dollar' : 
                           primaryRate.currency}
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
