import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react';
import { format, addDays, isWeekend } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  date: Date;
  label: string;
  type: 'ship' | 'transit' | 'deliver';
  isEstimate?: boolean;
}

interface DeliveryTimelineProps {
  shipDate: Date;
  transitDays: number;
  serviceName: string;
  isExpress?: boolean;
}

export const DeliveryTimeline: React.FC<DeliveryTimelineProps> = ({
  shipDate,
  transitDays,
  serviceName,
  isExpress = false
}) => {
  // Calculate business days for delivery
  const calculateDeliveryDate = (start: Date, days: number): Date => {
    let currentDate = new Date(start);
    let daysAdded = 0;
    
    while (daysAdded < days) {
      currentDate = addDays(currentDate, 1);
      if (!isWeekend(currentDate)) {
        daysAdded++;
      }
    }
    
    return currentDate;
  };

  const deliveryDate = calculateDeliveryDate(shipDate, transitDays);
  
  // Generate timeline events
  const events: TimelineEvent[] = [
    {
      date: shipDate,
      label: 'Package Pickup',
      type: 'ship'
    }
  ];

  // Add mid-transit events for longer shipments
  if (transitDays > 2) {
    const midPoint = Math.floor(transitDays / 2);
    const midDate = calculateDeliveryDate(shipDate, midPoint);
    events.push({
      date: midDate,
      label: 'In Transit',
      type: 'transit',
      isEstimate: true
    });
  }

  events.push({
    date: deliveryDate,
    label: 'Estimated Delivery',
    type: 'deliver',
    isEstimate: true
  });

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'ship':
        return <Package className="w-4 h-4" />;
      case 'transit':
        return <Truck className="w-4 h-4" />;
      case 'deliver':
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'ship':
        return 'bg-blue-500';
      case 'transit':
        return 'bg-yellow-500';
      case 'deliver':
        return 'bg-green-500';
    }
  };

  return (
    <Card className="p-4 sm:p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Delivery Timeline
          </h3>
          {isExpress && (
            <Badge variant="outline" className="bg-orange-50 border-orange-300 text-orange-700">
              Express Service
            </Badge>
          )}
        </div>

        <div className="text-sm text-gray-600">
          {serviceName} • {transitDays} business day{transitDays !== 1 ? 's' : ''}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gray-300" />
          
          <div className="space-y-6">
            {events.map((event, index) => (
              <div key={index} className="relative flex items-start gap-4">
                {/* Timeline dot */}
                <div className={cn(
                  "relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white",
                  getEventColor(event.type),
                  index === 0 && "ring-4 ring-blue-100",
                  index === events.length - 1 && "ring-4 ring-green-100"
                )}>
                  {getEventIcon(event.type)}
                </div>
                
                {/* Event details */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{event.label}</span>
                    {event.isEstimate && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Estimate
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {format(event.date, 'EEEE, MMMM d, yyyy')}
                  </div>
                  {index === 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Ready for pickup at end of business day
                    </div>
                  )}
                  {index === events.length - 1 && (
                    <div className="text-xs text-gray-500 mt-1">
                      By end of business day
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Delivery Guarantee</p>
              <p className="text-xs mt-1">
                {isExpress 
                  ? "Express shipments include money-back guarantee for on-time delivery"
                  : "Delivery dates are estimates based on normal transit times"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};