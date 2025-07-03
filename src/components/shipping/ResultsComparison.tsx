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
  Download,
  Mail,
  Check,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
}

type ViewMode = 'cards' | 'table';
type SortBy = 'price' | 'time' | 'savings';
type FilterBy = 'all' | 'express' | 'economy' | 'priority';

export const ResultsComparison: React.FC<ResultsComparisonProps> = ({
  rates,
  originAddress,
  destinationAddress,
  shipDate
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [sortBy, setSortBy] = useState<SortBy>('price');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [sortAsc, setSortAsc] = useState(true);

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

  const handleExport = (format: 'pdf' | 'email') => {
    // TODO: Implement export functionality
  };

  const formatPrice = (price: number): string => {
    return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          {/* View Mode Toggle */}
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
            <ToggleGroupItem value="cards" aria-label="Card view" className="h-8">
              <Grid className="w-4 h-4 mr-1" />
              Cards
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view" className="h-8">
              <List className="w-4 h-4 mr-1" />
              Table
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Sort Selector */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="time">Transit Time</SelectItem>
              <SelectItem value="savings">Savings</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Direction */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortAsc(!sortAsc)}
            className="h-8"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortAsc ? 'Asc' : 'Desc'}
          </Button>

          {/* Filter */}
          <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterBy)}>
            <SelectTrigger className="w-[140px] h-8">
              <Filter className="w-4 h-4 mr-1" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="express">Express</SelectItem>
              <SelectItem value="economy">Economy</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
            className="h-8"
          >
            <Download className="w-4 h-4 mr-1" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('email')}
            className="h-8"
          >
            <Mail className="w-4 h-4 mr-1" />
            Email
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="space-y-2">
          <h4 className="font-semibold text-blue-900">Shipping Summary</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-blue-700">From:</span> {originAddress}
            </div>
            <div>
              <span className="text-blue-700">To:</span> {destinationAddress}
            </div>
            <div>
              <span className="text-blue-700">Ship Date:</span> {shipDate ? format(shipDate, 'MMM d, yyyy') : 'Today'}
            </div>
          </div>
          <div className="text-sm text-blue-800">
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
                "p-4 hover:shadow-md transition-all duration-200",
                rate.cost === bestPrice && "ring-2 ring-green-500",
                rate === bestTime && "ring-2 ring-blue-500"
              )}
            >
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-base">{rate.service}</h4>
                    <div className="flex gap-2">
                      {rate.cost === bestPrice && (
                        <Badge variant="outline" className="bg-green-50 border-green-500 text-green-700">
                          <DollarSign className="w-3 h-3 mr-1" />
                          Best Price
                        </Badge>
                      )}
                      {rate === bestTime && (
                        <Badge variant="outline" className="bg-blue-50 border-blue-500 text-blue-700">
                          <Clock className="w-3 h-3 mr-1" />
                          Fastest
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {rate.transitTime}
                    </div>
                    {rate.deliveryDate && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {rate.deliveryDate}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right space-y-1">
                  {rate.listPrice && rate.listPrice > rate.cost && (
                    <div className="text-sm text-gray-500 line-through">
                      {rate.currency} {formatPrice(rate.listPrice)}
                    </div>
                  )}
                  <div className="text-xl font-bold">
                    {rate.currency} {formatPrice(rate.cost)}
                  </div>
                  {rate.savings && rate.savings > 0 && (
                    <div className="text-sm text-green-600 flex items-center justify-end">
                      <TrendingDown className="w-4 h-4 mr-1" />
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
                    rate.cost === bestPrice && "bg-green-50",
                    rate === bestTime && "bg-blue-50"
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
                      <span className="line-through text-gray-500">
                        {rate.currency} {formatPrice(rate.listPrice)}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {rate.currency} {formatPrice(rate.cost)}
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