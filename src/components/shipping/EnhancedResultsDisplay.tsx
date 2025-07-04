import React, { useState } from 'react';
import { ResultsDisplay } from './ResultsDisplay';
import { ResultsComparison } from './ResultsComparison';
import { DeliveryTimeline } from './DeliveryTimeline';
import { CostBreakdown } from './CostBreakdown';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  LayoutGrid, 
  Calendar, 
  Calculator,
  Download,
  Share2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ShippingRate {
  service: string;
  cost: number;
  currency: string;
  transitTime: string;
  deliveryDate?: string;
  rateType?: string;
  listPrice?: number;
  savings?: number;
  savingsPercent?: number;
}

interface EnhancedResultsDisplayProps {
  rates: ShippingRate[];
  isLoading: boolean;
  originAddress?: {
    country: string;
    postalCode: string;
  };
  destinationAddress?: {
    country: string;
    postalCode: string;
  };
  shipDate?: Date;
  packageDetails?: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
  };
}

export const EnhancedResultsDisplay: React.FC<EnhancedResultsDisplayProps> = ({
  rates,
  isLoading,
  originAddress,
  destinationAddress,
  shipDate,
  packageDetails
}) => {
  const [activeTab, setActiveTab] = useState('comparison');
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Process rates to add additional data
  const enhancedRates = rates.map(rate => {
    // Find matching LIST rate if this is an ACCOUNT rate
    const listRate = rates.find(r => 
      r.service === rate.service && 
      (r.rateType === 'LIST' || r.rateType === 'RATED_LIST_PACKAGE')
    );
    
    if (listRate && rate.rateType !== 'LIST' && rate.rateType !== 'RATED_LIST_PACKAGE') {
      return {
        ...rate,
        listPrice: listRate.cost,
        savings: listRate.cost - rate.cost,
        savingsPercent: Math.round(((listRate.cost - rate.cost) / listRate.cost) * 100)
      };
    }
    
    return rate;
  });

  // Extract transit days from time string
  const getTransitDays = (transitTime: string): number => {
    const match = transitTime.match(/\d+/);
    return match ? parseInt(match[0]) : 1;
  };

  const handleExportAll = async () => {
    // TODO: Implement full export functionality
    toast.success('Preparing export...');
    
    const exportData = {
      origin: originAddress,
      destination: destinationAddress,
      shipDate: shipDate?.toISOString(),
      rates: enhancedRates,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipping-quote-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Shipping Quote',
      text: `Shipping options from ${originAddress?.country} to ${destinationAddress?.country}`,
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch (err) {
      toast.error('Unable to share');
    }
  };

  if (isLoading) {
    return <ResultsDisplay rates={[]} isLoading={true} />;
  }

  if (rates.length === 0) {
    return null;
  }

  // Use the first rate as selected if none selected
  const currentRate = selectedRate || enhancedRates[0];

  return (
    <div className={cn(
      "space-y-4 transition-all duration-300",
      isExpanded && "fixed inset-0 z-50 bg-background p-4 overflow-auto"
    )}>
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Shipping Results</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAll}
            className="h-8"
          >
            <Download className="w-4 h-4 mr-1" />
            Export All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="h-8"
          >
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8"
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison" className="text-xs sm:text-sm">
            <LayoutGrid className="w-4 h-4 mr-1" />
            Compare
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs sm:text-sm">
            <Calendar className="w-4 h-4 mr-1" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="text-xs sm:text-sm">
            <Calculator className="w-4 h-4 mr-1" />
            Breakdown
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="mt-4">
          <ResultsComparison
            rates={enhancedRates}
            originAddress={`${originAddress?.country || 'TH'} ${originAddress?.postalCode || ''}`}
            destinationAddress={`${destinationAddress?.country || ''} ${destinationAddress?.postalCode || ''}`}
            shipDate={shipDate}
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4 space-y-4">
          {/* Rate selector for timeline */}
          <div className="flex flex-wrap gap-2">
            {enhancedRates.map((rate, index) => (
              <Button
                key={index}
                variant={currentRate === rate ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRate(rate)}
                className="text-xs"
              >
                {rate.service}
              </Button>
            ))}
          </div>
          
          <DeliveryTimeline
            shipDate={shipDate || new Date()}
            transitDays={getTransitDays(currentRate.transitTime)}
            serviceName={currentRate.service}
            isExpress={currentRate.service.toLowerCase().includes('express')}
          />
        </TabsContent>

        <TabsContent value="breakdown" className="mt-4 space-y-4">
          {/* Rate selector for breakdown */}
          <div className="flex flex-wrap gap-2">
            {enhancedRates.map((rate, index) => (
              <Button
                key={index}
                variant={currentRate === rate ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRate(rate)}
                className="text-xs"
              >
                {rate.service}
              </Button>
            ))}
          </div>
          
          <CostBreakdown
            service={currentRate.service}
            baseRate={currentRate.cost * 0.85} // Estimate base rate
            fuelSurcharge={currentRate.cost * 0.10} // Estimate fuel surcharge
            residentialFee={0} // Would come from API
            insurance={0} // Would be calculated based on value
            discount={currentRate.savings || 0}
            discountPercent={currentRate.savingsPercent || 0}
            listPrice={currentRate.listPrice}
            totalCost={currentRate.cost}
            currency={currentRate.currency}
            shipmentDetails={
              packageDetails && originAddress && destinationAddress ? {
                weight: packageDetails.weight,
                dimensions: `${packageDetails.dimensions.length}x${packageDetails.dimensions.width}x${packageDetails.dimensions.height}cm`,
                origin: `${originAddress.country} ${originAddress.postalCode}`,
                destination: `${destinationAddress.country} ${destinationAddress.postalCode}`
              } : undefined
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};