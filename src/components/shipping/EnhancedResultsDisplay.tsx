import React, { useState } from 'react';
import { ResultsDisplay } from './ResultsDisplay';
import { ResultsComparison } from './ResultsComparison';
import { Button } from '@/components/ui/button';
import { 
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
  preferredCurrency?: string;
}

export const EnhancedResultsDisplay: React.FC<EnhancedResultsDisplayProps> = ({
  rates,
  isLoading,
  originAddress,
  destinationAddress,
  shipDate,
  packageDetails,
  preferredCurrency
}) => {
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
    return <ResultsDisplay rates={[]} isLoading={true} preferredCurrency={preferredCurrency} />;
  }

  if (rates.length === 0) {
    return null;
  }


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
            aria-label="Export All"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="h-8"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
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

      {/* Results Comparison */}
      <ResultsComparison
        rates={enhancedRates}
        originAddress={`${originAddress?.country || 'TH'} ${originAddress?.postalCode || ''}`}
        destinationAddress={`${destinationAddress?.country || ''} ${destinationAddress?.postalCode || ''}`}
        shipDate={shipDate}
        preferredCurrency={preferredCurrency}
      />
    </div>
  );
};