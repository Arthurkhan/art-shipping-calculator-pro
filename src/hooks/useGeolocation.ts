import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface GeolocationResult {
  country?: string;
  postalCode?: string;
  city?: string;
  isLoading: boolean;
  error: string | null;
}

// Map of country codes to their names
const countryCodeMap: Record<string, string> = {
  'US': 'United States',
  'CA': 'Canada',
  'GB': 'United Kingdom',
  'FR': 'France',
  'DE': 'Germany',
  'IT': 'Italy',
  'ES': 'Spain',
  'AU': 'Australia',
  'JP': 'Japan',
  'CN': 'China',
  'IN': 'India',
  'BR': 'Brazil',
  'MX': 'Mexico',
  'TH': 'Thailand',
  'ID': 'Indonesia',
  'MY': 'Malaysia',
  'SG': 'Singapore',
  'PH': 'Philippines',
  'VN': 'Vietnam',
  'KR': 'South Korea',
  'TW': 'Taiwan'
};

export const useGeolocation = (autoDetect: boolean = false) => {
  const [location, setLocation] = useState<GeolocationResult>({
    isLoading: false,
    error: null
  });

  const detectLocation = async () => {
    setLocation(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // First try browser geolocation API
      if ('geolocation' in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: false
          });
        });

        const { latitude, longitude } = position.coords;

        // Use reverse geocoding API (you can use various services)
        // For demo, we'll use a free service like BigDataCloud
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );

        if (!response.ok) throw new Error('Failed to fetch location data');

        const data = await response.json();
        
        const countryCode = data.countryCode || '';
        const countryName = countryCodeMap[countryCode] || data.countryName || '';
        const postalCode = data.postcode || '';
        const city = data.city || data.locality || '';

        setLocation({
          country: countryCode,
          postalCode,
          city,
          isLoading: false,
          error: null
        });

        toast.success(`Location detected: ${city}, ${countryName}`);
        
        return { country: countryCode, postalCode, city };
      } else {
        throw new Error('Geolocation not supported');
      }
    } catch (error) {
      // Fallback to IP-based geolocation
      try {
        const ipResponse = await fetch('https://ipapi.co/json/');
        if (!ipResponse.ok) throw new Error('IP geolocation failed');
        
        const ipData = await ipResponse.json();
        
        setLocation({
          country: ipData.country_code || '',
          postalCode: ipData.postal || '',
          city: ipData.city || '',
          isLoading: false,
          error: null
        });

        toast.info(`Approximate location: ${ipData.city}, ${ipData.country_name}`);
        
        return {
          country: ipData.country_code || '',
          postalCode: ipData.postal || '',
          city: ipData.city || ''
        };
      } catch (ipError) {
        const errorMsg = 'Unable to detect location';
        setLocation({
          isLoading: false,
          error: errorMsg
        });
        toast.error(errorMsg);
        return null;
      }
    }
  };

  useEffect(() => {
    if (autoDetect) {
      detectLocation();
    }
  }, [autoDetect]);

  return {
    ...location,
    detectLocation
  };
};