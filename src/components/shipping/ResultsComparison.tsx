import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ArrowUpDown,
  Filter,
  Grid,
  List,
  Check,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';

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

interface ResultsComparisonProps {
  rates: ShippingRate[];
  originAddress: string;
  destinationAddress: string;
  shipDate?: Date;
  preferredCurrency?: string;
}

type ViewMode = 'cards' | 'table';
type SortBy = 'price' | 'time' | 'savings';
type FilterBy = 'all' | 'express' | 'economy' | 'priority';

export const ResultsComparison: React.FC<ResultsComparisonProps> = ({
  rates,
  originAddress,
  destinationAddress,
  shipDate,
  preferredCurrency
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [sortBy, setSortBy] = useState<SortBy>('price');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [sortAsc, setSortAsc] = useState(true);
  
  // Currency conversion hook
  const { formatDualCurrency, convertAmount, fromCurrency, toCurrency } = useCurrencyConversion(preferredCurrency || 'THB', 'THB');

  // Filter rates based on service type
  const filteredRates = useMemo(() => {
    if (filterBy === 'all') return rates;
    
    return rates.filter(rate => {
      const serviceLower = rate.service.toLowerCase();
      switch (filterBy) {
        case 'express':
          return serviceLower.includes('express') || serviceLower.includes('overnight');
        case 'economy':
          return serviceLower.includes('economy') || serviceLower.includes('ground');
        case 'priority':
          return serviceLower.includes('priority') || serviceLower.includes('first');
        default:
          return true;
      }
    });
  }, [rates, filterBy]);

  // Sort rates
  const sortedRates = useMemo(() => {
    const sorted = [...filteredRates].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return sortAsc ? a.cost - b.cost : b.cost - a.cost;
        case 'time':
          // Extract days from transit time (e.g., "2 business days" -> 2)
          const getDays = (time: string) => {
            const match = time.match(/\d+/);
            return match ? parseInt(match[0]) : 999;
          };
          return sortAsc 
            ? getDays(a.transitTime) - getDays(b.transitTime)
            : getDays(b.transitTime) - getDays(a.transitTime);
        case 'savings':
          const aSavings = a.savings || 0;
          const bSavings = b.savings || 0;
          return sortAsc ? aSavings - bSavings : bSavings - aSavings;
        default:
          return 0;
      }
    });
    return sorted;
  }, [filteredRates, sortBy, sortAsc]);

  // Get best value indicators
  const bestPrice = Math.min(...rates.map(r => r.cost));
  const bestTime = rates.reduce((best, rate) => {
    const match = rate.transitTime.match(/\d+/);
    const days = match ? parseInt(match[0]) : 999;
    const bestMatch = best.transitTime.match(/\d+/);
    const bestDays = bestMatch ? parseInt(bestMatch[0]) : 999;
    return days < bestDays ? rate : best;
  }, rates[0]);


  const formatPrice = (price: number): string => {
    return Math.round(price).toLocaleString();
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col gap-3">
        {/* Primary Controls Row */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          {/* Left Group: View and Sort */}
          <div className="flex flex-1 gap-2 items-center">
            {/* View Mode Toggle */}
            <ToggleGroup 
              type="single" 
              value={viewMode} 
              onValueChange={(v) => v && setViewMode(v as ViewMode)}
              className="border rounded-md p-1"
            >
              <ToggleGroupItem value="cards" aria-label="Card view" className="h-8 px-3">
                <Grid className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Table view" className="h-8 px-3">
                <List className="w-4 h-4" />
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-border" />

            {/* Sort Controls Group */}
            <div className="flex gap-1 items-center">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="time">Transit Time</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortAsc(!sortAsc)}
                className="h-9 px-3"
                aria-label={sortAsc ? "Sort ascending" : "Sort descending"}
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Right Group: Filter and Export */}
          <div className="flex gap-2 items-center">
            {/* Filter Dropdown */}
            <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterBy)}>
              <SelectTrigger className="w-[150px] h-9" aria-label="Filter services">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="express">Express</SelectItem>
                <SelectItem value="economy">Economy</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>

          </div>
        </div>
      </div>

      {/* Results Summary */}
      <Card className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <div className="space-y-3">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100">Shipping Summary</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-medium">From:</span> 
              <span className="text-gray-700 dark:text-gray-300">{originAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-medium">To:</span> 
              <span className="text-gray-700 dark:text-gray-300">{destinationAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-medium">Ship Date:</span> 
              <span className="text-gray-700 dark:text-gray-300">{shipDate ? format(shipDate, 'MMM d, yyyy') : 'Today'}</span>
            </div>
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            Found {sortedRates.length} shipping option{sortedRates.length !== 1 ? 's' : ''}
          </div>
        </div>
      </Card>

      {/* Results Display */}
      {viewMode === 'cards' ? (
        // Card View
        <div className="space-y-3">
          {sortedRates.map((rate, index) => (
            <Card 
              key={`${rate.service}-${index}`}
              className={cn(
                "p-3 sm:p-4 hover:shadow-md transition-all duration-200",
                rate.cost === bestPrice && "ring-2 ring-green-500",
                rate === bestTime && "ring-2 ring-blue-500"
              )}
            >
              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
                <div className="space-y-1 sm:space-y-2 flex-1">
                  {/* Service Name - Desktop: with badges, Mobile: without */}
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-sm sm:text-base">{rate.service}</h4>
                    {/* Show badges here only on desktop */}
                    <div className="hidden sm:flex gap-2">
                      {rate.cost === bestPrice && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 border-green-500 dark:border-green-700 text-green-700 dark:text-green-300">
                          <DollarSign className="w-3 h-3 mr-1" />
                          Best Price
                        </Badge>
                      )}
                      {rate === bestTime && (
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 border-blue-500 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                          <Clock className="w-3 h-3 mr-1" />
                          Fastest
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Transit Time and Delivery Date */}
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      {rate.transitTime}
                    </div>
                    {rate.deliveryDate && (
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        {rate.deliveryDate}
                      </div>
                    )}
                  </div>

                  {/* Badges on mobile - shown below time estimation */}
                  <div className="flex gap-2 sm:hidden">
                    {rate.cost === bestPrice && (
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 border-green-500 dark:border-green-700 text-green-700 dark:text-green-300 text-xs">
                        <DollarSign className="w-3 h-3 mr-1" />
                        Best Price
                      </Badge>
                    )}
                    {rate === bestTime && (
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 border-blue-500 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Fastest
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-right space-y-1 sm:space-y-2">
                  {rate.listPrice && rate.listPrice > rate.cost && (
                    <div className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 line-through">
                      THB {formatPrice(rate.listPrice)}
                    </div>
                  )}
                  <div className="text-right">
                    <div className="text-xl sm:text-2xl font-bold">
                      <span className="text-sm sm:text-base font-normal text-gray-500 dark:text-gray-400">THB</span> {Math.round(rate.cost).toLocaleString()}
                    </div>
                    {convertAmount && toCurrency && toCurrency !== 'THB' && (() => {
                      const converted = convertAmount(rate.cost);
                      return converted !== null ? (
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {toCurrency} {Math.round(converted).toLocaleString()}
                        </div>
                      ) : null;
                    })()}
                  </div>
                  {rate.savings && rate.savings > 0 && (
                    <div className="text-sm sm:text-base font-medium text-green-600 flex items-center justify-end">
                      <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Save {rate.savingsPercent}%
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        // Table View
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Transit Time</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead className="text-right">List Price</TableHead>
                <TableHead className="text-right">Your Price</TableHead>
                <TableHead className="text-right">Savings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRates.map((rate, index) => (
                <TableRow 
                  key={`${rate.service}-${index}`}
                  className={cn(
                    rate.cost === bestPrice && "bg-green-50 dark:bg-green-950/20",
                    rate === bestTime && "bg-blue-50 dark:bg-blue-950/20"
                  )}
                >
                  <TableCell className="font-medium">
                    {rate.service}
                    <div className="flex gap-2 mt-1">
                      {rate.cost === bestPrice && (
                        <Badge variant="outline" className="text-xs">Best Price</Badge>
                      )}
                      {rate === bestTime && (
                        <Badge variant="outline" className="text-xs">Fastest</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{rate.transitTime}</TableCell>
                  <TableCell>{rate.deliveryDate || '-'}</TableCell>
                  <TableCell className="text-right">
                    {rate.listPrice ? (
                      <span className="line-through text-gray-500 dark:text-gray-300">
                        THB {formatPrice(rate.listPrice)}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <div className="font-semibold">
                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400">THB</span> {Math.round(rate.cost).toLocaleString()}
                      </div>
                      {convertAmount && toCurrency && toCurrency !== 'THB' && (() => {
                        const converted = convertAmount(rate.cost);
                        return converted !== null ? (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {toCurrency} {Math.round(converted).toLocaleString()}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {rate.savings && rate.savings > 0 ? (
                      <span className="text-green-600">
                        -{rate.savingsPercent}%
                      </span>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};