/**
 * FedEx Service Availability Configuration
 * Maintains known service limitations and alternative routes
 * Updated: 2025-06-25
 */

// Known unavailable routes (origin_destination format)
export const KNOWN_UNAVAILABLE_ROUTES = [
  'TH_IT', // Thailand to Italy
  'TH_ES', // Thailand to Spain  
  'TH_PT', // Thailand to Portugal
  // Add more as discovered
];

// Alternative route suggestions
export const ROUTE_ALTERNATIVES: Record<string, string[]> = {
  // Thailand to Europe alternatives
  'TH_IT': ['TH_GB', 'TH_FR', 'TH_DE', 'TH_NL'], // Via major European hubs
  'TH_ES': ['TH_GB', 'TH_FR', 'TH_DE'],
  'TH_PT': ['TH_GB', 'TH_FR', 'TH_DE'],
  
  // Thailand to Asia-Pacific (usually available, but good to have)
  'TH_SG': [], // Direct service available
  'TH_HK': [], // Direct service available
  'TH_JP': [], // Direct service available
  'TH_AU': [], // Direct service available
  'TH_MY': [], // Direct service available
  'TH_ID': [], // Direct service available
};

// Hub cities that typically have good connectivity
export const FEDEX_HUB_CITIES = {
  'ASIA': ['SG', 'HK', 'JP', 'CN'],
  'EUROPE': ['GB', 'FR', 'DE', 'NL'],
  'AMERICAS': ['US', 'CA', 'MX', 'BR'],
  'MIDDLE_EAST': ['AE', 'IL'],
};

// Service availability messages
export const SERVICE_MESSAGES = {
  NO_DIRECT_SERVICE: 'FedEx does not offer direct service between these locations.',
  HUB_ROUTING: 'This route may require shipping through a FedEx hub city.',
  REGULATORY: 'Service may be limited due to regulatory or operational constraints.',
  ALTERNATIVE_AVAILABLE: 'Alternative routes are available through nearby destinations.',
  CONTACT_SUPPORT: 'Contact FedEx Customer Service for custom routing options.',
};

/**
 * Check if a route is known to be unavailable
 */
export const isKnownUnavailableRoute = (origin: string, destination: string): boolean => {
  const routeKey = `${origin}_${destination}`;
  return KNOWN_UNAVAILABLE_ROUTES.includes(routeKey);
};

/**
 * Get hub suggestions for a destination
 */
export const getHubSuggestions = (destination: string): string[] => {
  // Find which region the destination belongs to
  for (const [region, hubs] of Object.entries(FEDEX_HUB_CITIES)) {
    if (hubs.includes(destination)) {
      // Return other hubs in the same region
      return hubs.filter(hub => hub !== destination);
    }
  }
  
  // If not in hub list, suggest closest regional hubs
  // This is simplified - in production, you'd use geographic data
  if (['IT', 'ES', 'PT', 'GR'].includes(destination)) {
    return FEDEX_HUB_CITIES.EUROPE;
  }
  if (['TH', 'VN', 'KH', 'LA', 'MM'].includes(destination)) {
    return FEDEX_HUB_CITIES.ASIA;
  }
  
  return [];
};

/**
 * Get friendly route description
 */
export const getRouteDescription = (origin: string, destination: string): string => {
  const countryNames: Record<string, string> = {
    'TH': 'Thailand',
    'IT': 'Italy',
    'ES': 'Spain',
    'PT': 'Portugal',
    'GB': 'United Kingdom',
    'FR': 'France',
    'DE': 'Germany',
    'NL': 'Netherlands',
    'SG': 'Singapore',
    'HK': 'Hong Kong',
    'JP': 'Japan',
    'AU': 'Australia',
    'US': 'United States',
    'MY': 'Malaysia',
    'ID': 'Indonesia',
  };
  
  const originName = countryNames[origin] || origin;
  const destName = countryNames[destination] || destination;
  
  return `${originName} → ${destName}`;
};

/**
 * Service availability tips
 */
export const SERVICE_TIPS = [
  'FedEx International Priority often has the widest route coverage',
  'Consider shipping to a nearby hub city first',
  'Some routes may be available seasonally',
  'Business accounts may have access to additional routes',
  'Multi-piece shipments might have different routing options',
];
