
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
    clientId: string;
    clientSecret: string;
  };
}

interface ShippingRate {
  service: string;
  cost: number;
  currency: string;
  transitTime: string;
  deliveryDate?: string;
}

async function getFedexAuthToken(clientId: string, clientSecret: string) {
  const authUrl = "https://apis.fedex.com/oauth/token";
  
  const response = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
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
      rateRequestType: "ACCOUNT",
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
    const errorText = await response.text();
    throw new Error(`FedEx API failed: ${response.statusText} - ${errorText}`);
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

    if (!fedexConfig || !fedexConfig.clientId || !fedexConfig.clientSecret || !fedexConfig.accountNumber) {
      throw new Error('FedEx API configuration is required to get real shipping rates')
    }

    console.log('Calculating shipping rates for:', { collection, size, country, postalCode });

    const accessToken = await getFedexAuthToken(fedexConfig.clientId, fedexConfig.clientSecret);
    
    // Estimate weight based on size
    const sizeMultiplier = size.toLowerCase().includes('large') ? 15 : 
                          size.toLowerCase().includes('medium') ? 10 : 5;
    
    const fedexResponse = await getFedexRates(
      accessToken,
      fedexConfig.accountNumber,
      "US",
      country,
      postalCode,
      sizeMultiplier
    );

    console.log('FedEx API response:', JSON.stringify(fedexResponse, null, 2));

    let rates: ShippingRate[] = [];

    // Parse FedEx response and convert to our format
    if (fedexResponse.output?.rateReplyDetails) {
      rates = fedexResponse.output.rateReplyDetails.map((rate: any) => {
        const ratedShipment = rate.ratedShipmentDetails?.[0];
        const totalNetCharge = ratedShipment?.totalNetChargeWithDutiesAndTaxes || ratedShipment?.totalNetCharge || 0;
        const currency = ratedShipment?.currency || "USD";
        
        return {
          service: getServiceDisplayName(rate.serviceType || rate.serviceName || "FedEx Service"),
          cost: parseFloat(totalNetCharge) || 0,
          currency: currency,
          transitTime: rate.commit?.transitTime || rate.operationalDetail?.transitTime || "Unknown",
          deliveryDate: rate.commit?.dateDetail?.dayFormat || rate.operationalDetail?.deliveryDate
        };
      }).filter((rate: ShippingRate) => rate.cost > 0);
    }

    console.log('Processed rates:', rates);

    if (rates.length === 0) {
      throw new Error('No shipping rates available for the specified destination');
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

function getServiceDisplayName(serviceType: string): string {
  const serviceMap: { [key: string]: string } = {
    'INTERNATIONAL_PRIORITY': 'FedEx International Priority',
    'INTERNATIONAL_ECONOMY': 'FedEx International Economy',
    'INTERNATIONAL_CONNECT_PLUS': 'FedEx International Connect Plus',
    'INTERNATIONAL_FIRST': 'FedEx International First',
    'EUROPE_FIRST_INTERNATIONAL_PRIORITY': 'FedEx Europe First International Priority',
    'FEDEX_1_DAY_FREIGHT': 'FedEx 1Day Freight',
    'FEDEX_2_DAY_FREIGHT': 'FedEx 2Day Freight',
    'FEDEX_3_DAY_FREIGHT': 'FedEx 3Day Freight',
    'PRIORITY_OVERNIGHT': 'FedEx Priority Overnight',
    'STANDARD_OVERNIGHT': 'FedEx Standard Overnight',
    'FIRST_OVERNIGHT': 'FedEx First Overnight',
    'FEDEX_2_DAY': 'FedEx 2Day',
    'FEDEX_2_DAY_AM': 'FedEx 2Day A.M.',
    'FEDEX_EXPRESS_SAVER': 'FedEx Express Saver',
    'FEDEX_GROUND': 'FedEx Ground',
    'GROUND_HOME_DELIVERY': 'FedEx Home Delivery',
    'SMART_POST': 'FedEx SmartPost'
  };

  return serviceMap[serviceType] || serviceType;
}
