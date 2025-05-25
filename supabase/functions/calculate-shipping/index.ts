
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShippingRequest {
  collection: string;
  size: string;
  country: string;
  postalCode: string;
}

interface ShippingRate {
  service: string;
  cost: number;
  currency: string;
  transitTime: string;
  deliveryDate?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { collection, size, country, postalCode }: ShippingRequest = await req.json()

    // Validate input
    if (!collection || !size || !country || !postalCode) {
      throw new Error('Missing required fields')
    }

    // For demo purposes, return mock data
    // In production, you would integrate with the actual FedEx API
    const mockRates: ShippingRate[] = [
      {
        service: "FedEx Standard Overnight",
        cost: 89.99,
        currency: "USD",
        transitTime: "1 business day",
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString()
      },
      {
        service: "FedEx 2Day",
        cost: 45.99,
        currency: "USD",
        transitTime: "2 business days",
        deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()
      },
      {
        service: "FedEx Express Saver",
        cost: 32.99,
        currency: "USD",
        transitTime: "3 business days",
        deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()
      },
      {
        service: "FedEx Ground",
        cost: 18.99,
        currency: "USD",
        transitTime: "5-7 business days",
        deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
      }
    ];

    // Adjust prices based on size (mock logic)
    const sizeMultiplier = size.toLowerCase().includes('large') ? 1.5 : 
                          size.toLowerCase().includes('medium') ? 1.2 : 1.0;

    const adjustedRates = mockRates.map(rate => ({
      ...rate,
      cost: Math.round(rate.cost * sizeMultiplier * 100) / 100
    }));

    // Adjust prices for international shipping
    if (country !== 'US') {
      adjustedRates.forEach(rate => {
        rate.cost = Math.round(rate.cost * 1.8 * 100) / 100;
        rate.service = rate.service.replace('FedEx', 'FedEx International');
        if (rate.transitTime.includes('business day')) {
          const days = parseInt(rate.transitTime) + 2;
          rate.transitTime = `${days}-${days + 2} business days`;
        }
      });
    }

    return new Response(
      JSON.stringify({ rates: adjustedRates }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error calculating shipping rates:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to calculate shipping rates' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
