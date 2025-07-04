import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Calculator,
  DollarSign,
  Info,
  TrendingDown,
  Package,
  Shield,
  Fuel,
  FileText,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CostItem {
  label: string;
  amount: number;
  isDiscount?: boolean;
  info?: string;
}

interface CostBreakdownProps {
  service: string;
  baseRate: number;
  fuelSurcharge?: number;
  residentialFee?: number;
  insurance?: number;
  discount?: number;
  discountPercent?: number;
  listPrice?: number;
  totalCost: number;
  currency: string;
  shipmentDetails?: {
    weight: number;
    dimensions: string;
    origin: string;
    destination: string;
  };
}

export const CostBreakdown: React.FC<CostBreakdownProps> = ({
  service,
  baseRate,
  fuelSurcharge = 0,
  residentialFee = 0,
  insurance = 0,
  discount = 0,
  discountPercent = 0,
  listPrice,
  totalCost,
  currency,
  shipmentDetails
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedQuote, setCopiedQuote] = useState(false);

  const formatPrice = (price: number): string => {
    return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const costItems: CostItem[] = [
    {
      label: 'Base Rate',
      amount: baseRate,
      info: 'Standard shipping rate for the selected service'
    }
  ];

  if (fuelSurcharge > 0) {
    costItems.push({
      label: 'Fuel Surcharge',
      amount: fuelSurcharge,
      info: 'Variable fee based on current fuel prices'
    });
  }

  if (residentialFee > 0) {
    costItems.push({
      label: 'Residential Delivery',
      amount: residentialFee,
      info: 'Additional fee for delivery to residential addresses'
    });
  }

  if (insurance > 0) {
    costItems.push({
      label: 'Shipment Insurance',
      amount: insurance,
      info: 'Coverage for loss or damage during transit'
    });
  }

  if (discount > 0) {
    costItems.push({
      label: `Account Discount (${discountPercent}%)`,
      amount: -discount,
      isDiscount: true,
      info: 'Your negotiated FedEx account discount'
    });
  }

  const subtotal = costItems.reduce((sum, item) => sum + item.amount, 0);
  const savingsAmount = listPrice ? listPrice - totalCost : discount;
  const savingsPercent = listPrice ? Math.round((savingsAmount / listPrice) * 100) : discountPercent;

  const handleCopyQuote = () => {
    const quoteText = `
Shipping Quote - ${service}
${shipmentDetails ? `From: ${shipmentDetails.origin} To: ${shipmentDetails.destination}` : ''}
${shipmentDetails ? `Package: ${shipmentDetails.weight}kg, ${shipmentDetails.dimensions}` : ''}

Cost Breakdown:
${costItems.map(item => `${item.label}: ${item.isDiscount ? '-' : ''}${currency} ${formatPrice(Math.abs(item.amount))}`).join('\n')}

Total: ${currency} ${formatPrice(totalCost)}
${savingsAmount > 0 ? `You Save: ${currency} ${formatPrice(savingsAmount)} (${savingsPercent}%)` : ''}
    `.trim();

    navigator.clipboard.writeText(quoteText);
    setCopiedQuote(true);
    toast.success('Quote copied to clipboard');
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Cost Breakdown
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Show Details
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex items-end justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Shipping Cost</p>
            <p className="text-2xl font-bold">
              {currency} {formatPrice(totalCost)}
            </p>
            {savingsAmount > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  You save {savingsPercent}%
                </Badge>
                <span className="text-sm text-green-600 dark:text-green-400">
                  {currency} {formatPrice(savingsAmount)}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyQuote}
              className="h-8"
            >
              {copiedQuote ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Quote
                </>
              )}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Info className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Understanding Your Shipping Costs</DialogTitle>
                  <DialogDescription>
                    Here's what's included in your FedEx shipping rate
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="flex gap-3">
                    <Package className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Base Rate</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        The standard rate for {service} based on package weight and dimensions.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Fuel className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Fuel Surcharge</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        A variable fee that adjusts weekly based on fuel prices. Currently at market rate.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Insurance</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Optional coverage for your shipment's declared value. Recommended for artwork.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <TrendingDown className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Account Discount</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Your negotiated discount based on shipping volume and account type.
                      </p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Detailed Breakdown */}
        {isExpanded && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
            {listPrice && listPrice !== totalCost && (
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">List Price</span>
                <span className="line-through text-gray-500 dark:text-gray-400">
                  {currency} {formatPrice(listPrice)}
                </span>
              </div>
            )}
            
            {costItems.map((item, index) => (
              <div 
                key={index}
                className={cn(
                  "flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0",
                  item.isDiscount && "text-green-600"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.info && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Info className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader>
                          <DialogTitle>{item.label}</DialogTitle>
                          <DialogDescription>{item.info}</DialogDescription>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <span className="text-sm font-medium">
                  {item.isDiscount && '-'}
                  {currency} {formatPrice(Math.abs(item.amount))}
                </span>
              </div>
            ))}
            
            <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="font-semibold">Total Cost</span>
              <span className="text-lg font-bold">
                {currency} {formatPrice(totalCost)}
              </span>
            </div>

            {/* Shipment Details */}
            {shipmentDetails && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Shipment Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-blue-800 dark:text-blue-200">
                  <div>
                    <span className="font-medium">Origin:</span> {shipmentDetails.origin}
                  </div>
                  <div>
                    <span className="font-medium">Destination:</span> {shipmentDetails.destination}
                  </div>
                  <div>
                    <span className="font-medium">Weight:</span> {shipmentDetails.weight}kg
                  </div>
                  <div>
                    <span className="font-medium">Dimensions:</span> {shipmentDetails.dimensions}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};