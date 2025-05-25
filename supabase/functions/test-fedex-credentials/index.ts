
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { accountNumber, clientId, clientSecret } = await req.json();

    console.log('Testing FedEx credentials for account:', accountNumber);

    // FedEx authentication endpoint
    const authUrl = 'https://apis.fedex.com/oauth/token';
    
    // Prepare authentication request
    const authData = new URLSearchParams({
      'grant_type': 'client_credentials',
      'client_id': clientId,
      'client_secret': clientSecret,
    });

    // Make authentication request to FedEx
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: authData,
    });

    const authResult = await authResponse.json();

    if (!authResponse.ok) {
      console.error('FedEx authentication failed:', authResult);
      throw new Error(authResult.error_description || 'Authentication failed');
    }

    console.log('FedEx authentication successful');

    // If authentication is successful, we can test a simple API call
    // Let's make a minimal test call to validate the credentials fully
    const testRateUrl = 'https://apis.fedex.com/rate/v1/rates/quotes';
    
    const testPayload = {
      accountNumber: {
        value: accountNumber
      },
      requestedShipment: {
        shipper: {
          address: {
            postalCode: "10240",
            countryCode: "TH"
          }
        },
        recipient: {
          address: {
            postalCode: "10110", 
            countryCode: "TH"
          }
        },
        shipDateStamp: new Date().toISOString().split('T')[0],
        rateRequestType: ["LIST"],
        requestedPackageLineItems: [{
          groupPackageCount: 1,
          weight: {
            units: "KG",
            value: 1
          },
          dimensions: {
            length: 10,
            width: 10,
            height: 10,
            units: "CM"
          }
        }],
        pickupType: "DROPOFF_AT_FEDEX_LOCATION",
        packagingType: "YOUR_PACKAGING",
        preferredCurrency: "USD"
      }
    };

    const testResponse = await fetch(testRateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authResult.access_token}`,
        'X-locale': 'en_US',
      },
      body: JSON.stringify(testPayload),
    });

    const testResult = await testResponse.json();

    if (!testResponse.ok) {
      console.error('FedEx test API call failed:', testResult);
      
      // Check if it's an account-related error
      if (testResult.errors && testResult.errors.some((error: any) => 
        error.code && (error.code.includes('ACCOUNT') || error.code.includes('UNAUTHORIZED'))
      )) {
        throw new Error('Account number is invalid or not authorized for API access');
      }
      
      // For other errors, it might still be a valid credential but other issues
      console.log('API test failed but credentials may be valid:', testResult);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'FedEx credentials are valid',
        accountVerified: testResponse.ok
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error testing FedEx credentials:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to test credentials',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
