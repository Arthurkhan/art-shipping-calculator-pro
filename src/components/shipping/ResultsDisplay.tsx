import { Card } from "@/components/ui/card";
import { Clock, Truck, Zap, Tag } from "lucide-react";
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

// Group rates by service type and separate regular from last-minute
const organizeRates = (rates: ShippingRate[]): Map<string, { regular?: ShippingRate, lastMinute?: ShippingRate }> => {
  const organized = new Map<string, { regular?: ShippingRate, lastMinute?: ShippingRate }>();
  
  rates.forEach(rate => {
    const service = rate.service;
    if (!organized.has(service)) {
      organized.set(service, {});
    }
    
    const serviceRates = organized.get(service)!;
    
    // Separate regular and last-minute rates
    if (rate.isLastMinute || rate.rateType === 'INCENTIVE' || rate.rateType === 'RATED_INCENTIVE') {
      serviceRates.lastMinute = rate;
    } else {
      // If we don't have a regular rate yet, or this is a better regular rate
      if (!serviceRates.regular || rate.cost < serviceRates.regular.cost) {
        serviceRates.regular = rate;
      }
    }
  });
  
  return organized;
};

export const ResultsDisplay = ({ rates, isLoading }: ResultsDisplayProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800">Calculating shipping rates...</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
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
      <h3 className="text-lg font-semibold text-slate-800 flex items-center">
        <Truck className="w-5 h-5 mr-2" />
        Available Shipping Options
      </h3>
      <div className="space-y-4">
        {Array.from(organizedRates.entries()).map(([service, serviceRates]) => {
          const { regular, lastMinute } = serviceRates;
          
          // Skip if no regular rate (shouldn't happen, but just in case)
          if (!regular) return null;
          
          return (
            <div key={service} className="space-y-2">
              {/* Regular/Account Rate */}
              <Card className="p-4 hover:shadow-md transition-shadow border-slate-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-slate-800 break-words">{regular.service}</h4>
                      {regular.rateType && (
                        <Badge variant="secondary" className="text-xs">
                          {regular.rateType === 'ACCOUNT' ? 'Account Rate' : regular.rateType}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="break-words">
                        {regular.transitTime}
                        {regular.deliveryDate && (
                          <span className="ml-2">• Delivery: {regular.deliveryDate}</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <div className="text-xl font-bold text-slate-800">
                      {regular.currency} {formatPrice(regular.cost)}
                    </div>
                    <div className="text-sm text-slate-500">
                      {regular.currency === 'THB' ? 'Thai Baht' : 
                       regular.currency === 'USD' ? 'US Dollar' : 
                       regular.currency === 'SGD' ? 'Singapore Dollar' : 
                       regular.currency}
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Last Minute Rate (if available and different from regular) */}
              {lastMinute && lastMinute.cost !== regular.cost && (
                <Card className="p-4 hover:shadow-md transition-shadow border-orange-200 bg-orange-50/50 ml-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-slate-700">Last minute rate</span>
                        <Badge variant="outline" className="flex items-center gap-1 border-orange-600 text-orange-700">
                          <Tag className="w-3 h-3" />
                          Special Offer
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-600">
                        Save {regular.currency} {formatPrice(regular.cost - lastMinute.cost)} ({Math.round((1 - lastMinute.cost / regular.cost) * 100)}% off)
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <div className="text-xl font-bold text-orange-700 flex flex-col items-end">
                        <span className="text-sm line-through text-slate-500">{lastMinute.currency} {formatPrice(regular.cost)}</span>
                        <span className="text-2xl">{lastMinute.currency} {formatPrice(lastMinute.cost)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
