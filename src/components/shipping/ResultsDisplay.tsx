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

// Group rates by service type
const groupRatesByService = (rates: ShippingRate[]): Map<string, ShippingRate[]> => {
  const grouped = new Map<string, ShippingRate[]>();
  
  rates.forEach(rate => {
    const service = rate.service;
    if (!grouped.has(service)) {
      grouped.set(service, []);
    }
    grouped.get(service)!.push(rate);
  });
  
  return grouped;
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

  // Group rates by service to show regular and last-minute rates together
  const groupedRates = groupRatesByService(rates);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 flex items-center">
        <Truck className="w-5 h-5 mr-2" />
        Available Shipping Options
      </h3>
      <div className="space-y-4">
        {Array.from(groupedRates.entries()).map(([service, serviceRates]) => {
          // Sort rates: primary rates first, then alternatives
          const sortedRates = serviceRates.sort((a, b) => {
            if (a.isAlternative && !b.isAlternative) return 1;
            if (!a.isAlternative && b.isAlternative) return -1;
            return a.cost - b.cost;
          });
          
          const primaryRate = sortedRates.find(r => !r.isAlternative) || sortedRates[0];
          const lastMinuteRate = sortedRates.find(r => r.isLastMinute && r !== primaryRate);
          
          return (
            <div key={service} className="space-y-2">
              {/* Primary Rate */}
              <Card className="p-4 hover:shadow-md transition-shadow border-slate-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-slate-800 break-words">{primaryRate.service}</h4>
                      {primaryRate.isLastMinute && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Last Minute
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="break-words">
                        {primaryRate.transitTime}
                        {primaryRate.deliveryDate && (
                          <span className="ml-2">• Delivery: {primaryRate.deliveryDate}</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <div className="text-xl font-bold text-slate-800">
                      {primaryRate.currency} {formatPrice(primaryRate.cost)}
                    </div>
                    <div className="text-sm text-slate-500">
                      {primaryRate.currency === 'THB' ? 'Thai Baht' : 
                       primaryRate.currency === 'USD' ? 'US Dollar' : 
                       primaryRate.currency === 'SGD' ? 'Singapore Dollar' : 
                       primaryRate.currency}
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Last Minute Alternative Rate (if available and different) */}
              {lastMinuteRate && (
                <Card className="p-4 hover:shadow-md transition-shadow border-orange-200 bg-orange-50/50 ml-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-slate-700">Last-Minute Rate</span>
                        <Badge variant="outline" className="flex items-center gap-1 border-orange-600 text-orange-700">
                          <Zap className="w-3 h-3" />
                          Special Offer
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-600">
                        Save {primaryRate.currency} {formatPrice(primaryRate.cost - lastMinuteRate.cost)} ({Math.round((1 - lastMinuteRate.cost / primaryRate.cost) * 100)}% off)
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <div className="text-xl font-bold text-orange-700 line-through text-sm">
                        {lastMinuteRate.currency} {formatPrice(primaryRate.cost)}
                      </div>
                      <div className="text-2xl font-bold text-orange-700">
                        {lastMinuteRate.currency} {formatPrice(lastMinuteRate.cost)}
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
