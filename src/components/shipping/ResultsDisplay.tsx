
import { Card } from "@/components/ui/card";
import { Clock, DollarSign, Truck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ShippingRate {
  service: string;
  cost: number;
  currency: string;
  transitTime: string;
  deliveryDate?: string;
}

interface ResultsDisplayProps {
  rates: ShippingRate[];
  isLoading: boolean;
}

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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 flex items-center">
        <Truck className="w-5 h-5 mr-2" />
        Available Shipping Options
      </h3>
      <div className="space-y-3">
        {rates.map((rate, index) => (
          <Card key={index} className="p-4 hover:shadow-md transition-shadow border-slate-200">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h4 className="font-medium text-slate-800">{rate.service}</h4>
                <div className="flex items-center text-sm text-slate-600">
                  <Clock className="w-4 h-4 mr-1" />
                  {rate.transitTime}
                  {rate.deliveryDate && (
                    <span className="ml-2">• Delivery: {rate.deliveryDate}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-xl font-bold text-slate-800">
                  <DollarSign className="w-5 h-5" />
                  {rate.cost.toFixed(2)}
                </div>
                <div className="text-sm text-slate-500">{rate.currency}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
