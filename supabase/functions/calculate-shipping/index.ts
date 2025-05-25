
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
  fedexConfig?: {
    accountNumber: string;
    apiKey: string;
    secretKey: string;
    meterNumber: string;
  };
}

interface ShippingRate {
  service: string;
  cost: number;
  currency: string;
  transitTime: string;
  deliveryDate?: string;
}

async function getFedexAuthToken(apiKey: string, secretKey: string) {
  const authUrl = "https://apis.fedex.com/oauth/token";
  
  const response = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: apiKey,
      client_secret: secretKey,
    }),
  });

  if (!response.ok) {
    throw new Error(`FedEx auth failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function getFedexRates(
  accessToken: string,
  accountNumber: string,
  meterNumber: string,
  fromCountry: string,
  toCountry: string,
  postalCode: string,
  weight: number
) {
  const rateUrl = "https://apis.fedex.com/rate/v1/rates/quotes";
  
  const requestPayload = {
    accountNumber: {
      value: accountNumber
    },
    requestedShipment: {
      shipper: {
        address: {
          postalCode: "10001",
          countryCode: fromCountry || "US"
        }
      },
      recipient: {
        address: {
          postalCode: postalCode,
          countryCode: toCountry
        }
      },
      pickupType: "USE_SCHEDULED_PICKUP",
      serviceType: "PRIORITY_OVERNIGHT",
      packagingType: "YOUR_PACKAGING",
      requestedPackageLineItems: [
        {
          weight: {
            units: "LB",
            value: weight
          },
          dimensions: {
            length: 20,
            width: 20,
            height: 10,
            units: "IN"
          }
        }
      ]
    }
  };

  const response = await fetch(rateUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "X-locale": "en_US"
    },
    body: JSON.stringify(requestPayload),
  });

  if (!response.ok) {
    throw new Error(`FedEx API failed: ${response.statusText}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { collection, size, country, postalCode, fedexConfig }: ShippingRequest = await req.json()

    if (!collection || !size || !country || !postalCode) {
      throw new Error('Missing required fields')
    }

    console.log('Calculating shipping rates for:', { collection, size, country, postalCode });

    let rates: ShippingRate[] = [];

    // If FedEx config is provided, use real API
    if (fedexConfig && fedexConfig.apiKey && fedexConfig.secretKey) {
      try {
        console.log('Using real FedEx API');
        
        const accessToken = await getFedexAuthToken(fedexConfig.apiKey, fedexConfig.secretKey);
        
        // Estimate weight based on size
        const sizeMultiplier = size.toLowerCase().includes('large') ? 15 : 
                              size.toLowerCase().includes('medium') ? 10 : 5;
        
        const fedexResponse = await getFedexRates(
          accessToken,
          fedexConfig.accountNumber,
          fedexConfig.meterNumber,
          "US",
          country,
          postalCode,
          sizeMultiplier
        );

        // Parse FedEx response and convert to our format
        if (fedexResponse.output?.rateReplyDetails) {
          rates = fedexResponse.output.rateReplyDetails.map((rate: any) => ({
            service: rate.serviceType || "FedEx Service",
            cost: rate.ratedShipmentDetails?.[0]?.totalNetCharge || 0,
            currency: rate.ratedShipmentDetails?.[0]?.currency || "USD",
            transitTime: rate.commit?.transitTime || "Unknown",
            deliveryDate: rate.commit?.dateDetail?.dayFormat
          }));
        }
        
        console.log('FedEx API returned rates:', rates);
        
      } catch (apiError) {
        console.error('FedEx API error:', apiError);
        // Fall back to mock data if real API fails
        rates = getMockRates(size, country);
      }
    } else {
      console.log('Using mock FedEx data - no configuration provided');
      rates = getMockRates(size, country);
    }

    return new Response(
      JSON.stringify({ rates }),
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

function getMockRates(size: string, country: string): ShippingRate[] {
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

  const sizeMultiplier = size.toLowerCase().includes('large') ? 1.5 : 
                        size.toLowerCase().includes('medium') ? 1.2 : 1.0;

  const adjustedRates = mockRates.map(rate => ({
    ...rate,
    cost: Math.round(rate.cost * sizeMultiplier * 100) / 100
  }));

  if (country !== 'US' && country.toLowerCase() !== 'united states') {
    adjustedRates.forEach(rate => {
      rate.cost = Math.round(rate.cost * 1.8 * 100) / 100;
      rate.service = rate.service.replace('FedEx', 'FedEx International');
      if (rate.transitTime.includes('business day')) {
        const days = parseInt(rate.transitTime) + 2;
        rate.transitTime = `${days}-${days + 2} business days`;
      }
    });
  }

  return adjustedRates;
}
