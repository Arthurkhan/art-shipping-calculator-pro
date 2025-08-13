/**
 * Country utilities for converting country names to ISO 3166-1 alpha-2 codes
 * Includes countries served by FedEx (excludes sanctioned/unserved countries)
 */

export interface Country {
  code: string;
  name: string;
  aliases?: string[];
}

// Comprehensive list of countries served by FedEx with their ISO codes
export const COUNTRIES: Country[] = [
  // A
  { code: 'AF', name: 'Afghanistan' },
  { code: 'AL', name: 'Albania' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'AS', name: 'American Samoa' },
  { code: 'AD', name: 'Andorra' },
  { code: 'AO', name: 'Angola' },
  { code: 'AI', name: 'Anguilla' },
  { code: 'AQ', name: 'Antarctica' },
  { code: 'AG', name: 'Antigua and Barbuda', aliases: ['Antigua'] },
  { code: 'AR', name: 'Argentina' },
  { code: 'AM', name: 'Armenia' },
  { code: 'AW', name: 'Aruba' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria', aliases: ['Österreich'] },
  { code: 'AZ', name: 'Azerbaijan' },
  
  // B
  { code: 'BS', name: 'Bahamas' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BB', name: 'Barbados' },
  { code: 'BY', name: 'Belarus' },
  { code: 'BE', name: 'Belgium', aliases: ['Belgique', 'België'] },
  { code: 'BZ', name: 'Belize' },
  { code: 'BJ', name: 'Benin' },
  { code: 'BM', name: 'Bermuda' },
  { code: 'BT', name: 'Bhutan' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'BA', name: 'Bosnia and Herzegovina', aliases: ['Bosnia'] },
  { code: 'BW', name: 'Botswana' },
  { code: 'BR', name: 'Brazil', aliases: ['Brasil'] },
  { code: 'BN', name: 'Brunei Darussalam', aliases: ['Brunei'] },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi' },
  
  // C
  { code: 'KH', name: 'Cambodia' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'CA', name: 'Canada' },
  { code: 'CV', name: 'Cape Verde' },
  { code: 'KY', name: 'Cayman Islands' },
  { code: 'TD', name: 'Chad' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China', aliases: ['PRC', 'People\'s Republic of China'] },
  { code: 'CX', name: 'Christmas Island' },
  { code: 'CC', name: 'Cocos (Keeling) Islands' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CG', name: 'Congo', aliases: ['Republic of the Congo'] },
  { code: 'CD', name: 'Congo, Democratic Republic', aliases: ['DRC', 'DR Congo'] },
  { code: 'CK', name: 'Cook Islands' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'CI', name: 'Cote d\'Ivoire', aliases: ['Ivory Coast'] },
  { code: 'HR', name: 'Croatia', aliases: ['Hrvatska'] },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic', aliases: ['Czechia'] },
  
  // D
  { code: 'DK', name: 'Denmark', aliases: ['Danmark'] },
  { code: 'DJ', name: 'Djibouti' },
  { code: 'DM', name: 'Dominica' },
  { code: 'DO', name: 'Dominican Republic' },
  
  // E
  { code: 'EC', name: 'Ecuador' },
  { code: 'EG', name: 'Egypt' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'ER', name: 'Eritrea' },
  { code: 'EE', name: 'Estonia' },
  { code: 'ET', name: 'Ethiopia' },
  
  // F
  { code: 'FO', name: 'Faroe Islands' },
  { code: 'FJ', name: 'Fiji' },
  { code: 'FI', name: 'Finland', aliases: ['Suomi'] },
  { code: 'FR', name: 'France' },
  { code: 'GF', name: 'French Guiana' },
  { code: 'PF', name: 'French Polynesia' },
  
  // G
  { code: 'GA', name: 'Gabon' },
  { code: 'GM', name: 'Gambia' },
  { code: 'GE', name: 'Georgia' },
  { code: 'DE', name: 'Germany', aliases: ['Deutschland'] },
  { code: 'GH', name: 'Ghana' },
  { code: 'GI', name: 'Gibraltar' },
  { code: 'GR', name: 'Greece', aliases: ['Hellas'] },
  { code: 'GL', name: 'Greenland' },
  { code: 'GD', name: 'Grenada' },
  { code: 'GP', name: 'Guadeloupe' },
  { code: 'GU', name: 'Guam' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'GN', name: 'Guinea' },
  { code: 'GY', name: 'Guyana' },
  
  // H
  { code: 'HT', name: 'Haiti' },
  { code: 'HN', name: 'Honduras' },
  { code: 'HK', name: 'Hong Kong', aliases: ['Hong Kong SAR'] },
  { code: 'HU', name: 'Hungary', aliases: ['Magyarország'] },
  
  // I
  { code: 'IS', name: 'Iceland', aliases: ['Ísland'] },
  { code: 'IN', name: 'India', aliases: ['Bharat'] },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'IE', name: 'Ireland', aliases: ['Éire'] },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy', aliases: ['Italia'] },
  
  // J
  { code: 'JM', name: 'Jamaica' },
  { code: 'JP', name: 'Japan', aliases: ['Nippon', '日本'] },
  { code: 'JO', name: 'Jordan' },
  
  // K
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KR', name: 'Korea, Republic of', aliases: ['South Korea', 'Korea'] },
  { code: 'KW', name: 'Kuwait' },
  { code: 'KG', name: 'Kyrgyzstan' },
  
  // L
  { code: 'LA', name: 'Lao People\'s Democratic Republic', aliases: ['Laos'] },
  { code: 'LV', name: 'Latvia' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Liberia' },
  { code: 'LY', name: 'Libya' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  
  // M
  { code: 'MO', name: 'Macao', aliases: ['Macau'] },
  { code: 'MK', name: 'Macedonia', aliases: ['North Macedonia'] },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MW', name: 'Malawi' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MV', name: 'Maldives' },
  { code: 'ML', name: 'Mali' },
  { code: 'MT', name: 'Malta' },
  { code: 'MH', name: 'Marshall Islands' },
  { code: 'MQ', name: 'Martinique' },
  { code: 'MR', name: 'Mauritania' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'YT', name: 'Mayotte' },
  { code: 'MX', name: 'Mexico', aliases: ['México'] },
  { code: 'FM', name: 'Micronesia', aliases: ['Federated States of Micronesia'] },
  { code: 'MD', name: 'Moldova' },
  { code: 'MC', name: 'Monaco' },
  { code: 'MN', name: 'Mongolia' },
  { code: 'ME', name: 'Montenegro' },
  { code: 'MS', name: 'Montserrat' },
  { code: 'MA', name: 'Morocco' },
  { code: 'MZ', name: 'Mozambique' },
  
  // N
  { code: 'NA', name: 'Namibia' },
  { code: 'NP', name: 'Nepal' },
  { code: 'NL', name: 'Netherlands', aliases: ['Holland', 'Nederland'] },
  { code: 'NC', name: 'New Caledonia' },
  { code: 'NZ', name: 'New Zealand', aliases: ['Aotearoa'] },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'NE', name: 'Niger' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NF', name: 'Norfolk Island' },
  { code: 'MP', name: 'Northern Mariana Islands' },
  { code: 'NO', name: 'Norway', aliases: ['Norge'] },
  
  // O
  { code: 'OM', name: 'Oman' },
  
  // P
  { code: 'PK', name: 'Pakistan' },
  { code: 'PW', name: 'Palau' },
  { code: 'PS', name: 'Palestine', aliases: ['Palestinian Territory'] },
  { code: 'PA', name: 'Panama' },
  { code: 'PG', name: 'Papua New Guinea' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PN', name: 'Pitcairn' },
  { code: 'PL', name: 'Poland', aliases: ['Polska'] },
  { code: 'PT', name: 'Portugal' },
  { code: 'PR', name: 'Puerto Rico' },
  
  // Q
  { code: 'QA', name: 'Qatar' },
  
  // R
  { code: 'RE', name: 'Reunion' },
  { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russian Federation', aliases: ['Russia'] },
  { code: 'RW', name: 'Rwanda' },
  
  // S
  { code: 'BL', name: 'Saint Barthelemy' },
  { code: 'KN', name: 'Saint Kitts and Nevis' },
  { code: 'LC', name: 'Saint Lucia' },
  { code: 'MF', name: 'Saint Martin' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines' },
  { code: 'WS', name: 'Samoa' },
  { code: 'SM', name: 'San Marino' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SN', name: 'Senegal' },
  { code: 'RS', name: 'Serbia' },
  { code: 'SC', name: 'Seychelles' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SX', name: 'Sint Maarten' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'GS', name: 'South Georgia and the South Sandwich Islands' },
  { code: 'SS', name: 'South Sudan' },
  { code: 'ES', name: 'Spain', aliases: ['España'] },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'SR', name: 'Suriname' },
  { code: 'SZ', name: 'Swaziland', aliases: ['Eswatini'] },
  { code: 'SE', name: 'Sweden', aliases: ['Sverige'] },
  { code: 'CH', name: 'Switzerland', aliases: ['Schweiz', 'Suisse', 'Svizzera'] },
  
  // T
  { code: 'TW', name: 'Taiwan', aliases: ['Taiwan, Province of China', 'Chinese Taipei'] },
  { code: 'TZ', name: 'Tanzania', aliases: ['United Republic of Tanzania'] },
  { code: 'TH', name: 'Thailand' },
  { code: 'TL', name: 'Timor-Leste', aliases: ['East Timor'] },
  { code: 'TG', name: 'Togo' },
  { code: 'TO', name: 'Tonga' },
  { code: 'TT', name: 'Trinidad and Tobago' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'TR', name: 'Turkey', aliases: ['Türkiye'] },
  { code: 'TC', name: 'Turks and Caicos Islands' },
  
  // U
  { code: 'UG', name: 'Uganda' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates', aliases: ['UAE'] },
  { code: 'GB', name: 'United Kingdom', aliases: ['UK', 'Great Britain', 'Britain'] },
  { code: 'US', name: 'United States', aliases: ['USA', 'United States of America', 'America'] },
  { code: 'UM', name: 'United States Minor Outlying Islands' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'UZ', name: 'Uzbekistan' },
  
  // V
  { code: 'VU', name: 'Vanuatu' },
  { code: 'VA', name: 'Vatican City', aliases: ['Holy See'] },
  { code: 'VE', name: 'Venezuela' },
  { code: 'VN', name: 'Vietnam', aliases: ['Viet Nam'] },
  { code: 'VG', name: 'Virgin Islands, British', aliases: ['British Virgin Islands'] },
  { code: 'VI', name: 'Virgin Islands, U.S.', aliases: ['US Virgin Islands'] },
  
  // W
  { code: 'WF', name: 'Wallis and Futuna' },
  { code: 'EH', name: 'Western Sahara' },
  
  // Z
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' }
];

// Countries NOT served by FedEx (for reference, not included in main list)
const UNSERVED_COUNTRIES = [
  'MM', // Myanmar (Burma)
  'CF', // Central African Republic
  'KM', // Union of the Comoros
  'CU', // Cuba
  'GQ', // Equatorial Guinea
  'FK', // Falkland Islands
  'GW', // Guinea-Bissau
  'IR', // Iran
  'KP', // North Korea
  'NR', // Nauru
  'NU', // Niue
  'PM', // Saint Pierre and Miquelon
  'ST', // Sao Tome and Principe
  'SL', // Sierra Leone
  'SB', // Solomon Islands
  'SO', // Somalia
  'SH', // Saint Helena
  'SD', // Sudan
  'SY', // Syrian Arab Republic
  'TJ', // Tajikistan
  'TK', // Tokelau
  'TM', // Turkmenistan
  'TV', // Tuvalu
  'YE'  // Yemen
];

/**
 * Convert country name to ISO 3166-1 alpha-2 code
 * @param input - Country name or code (case-insensitive)
 * @returns ISO code in uppercase or null if not found
 */
export function countryToCode(input: string): string | null {
  if (!input) return null;
  
  const normalized = input.trim().toUpperCase();
  
  // If it's already a 2-letter code, check if it's valid
  if (normalized.length === 2) {
    const isValid = COUNTRIES.some(c => c.code === normalized);
    return isValid ? normalized : null;
  }
  
  // Search by country name or alias (case-insensitive)
  const normalizedLower = input.trim().toLowerCase();
  const country = COUNTRIES.find(c => {
    if (c.name.toLowerCase() === normalizedLower) return true;
    if (c.aliases) {
      return c.aliases.some(alias => alias.toLowerCase() === normalizedLower);
    }
    return false;
  });
  
  return country ? country.code : null;
}

/**
 * Get country name from ISO code
 * @param code - ISO 3166-1 alpha-2 code
 * @returns Country name or null if not found
 */
export function codeToCountry(code: string): string | null {
  if (!code) return null;
  
  const normalized = code.trim().toUpperCase();
  const country = COUNTRIES.find(c => c.code === normalized);
  
  return country ? country.name : null;
}

/**
 * Search countries by partial name match
 * @param query - Partial country name or code
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of matching countries
 */
export function searchCountries(query: string, limit: number = 10): Country[] {
  if (!query || query.length < 1) return [];
  
  const normalized = query.trim().toLowerCase();
  
  // First, check for exact code match
  if (query.length === 2) {
    const exactCode = COUNTRIES.find(c => c.code === query.toUpperCase());
    if (exactCode) return [exactCode];
  }
  
  // Search by name and aliases
  const matches = COUNTRIES.filter(country => {
    // Check main name
    if (country.name.toLowerCase().startsWith(normalized)) return true;
    
    // Check aliases
    if (country.aliases) {
      return country.aliases.some(alias => 
        alias.toLowerCase().startsWith(normalized)
      );
    }
    
    return false;
  });
  
  // Sort by relevance (exact matches first, then alphabetical)
  matches.sort((a, b) => {
    const aExact = a.name.toLowerCase() === normalized;
    const bExact = b.name.toLowerCase() === normalized;
    
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    return a.name.localeCompare(b.name);
  });
  
  return matches.slice(0, limit);
}

/**
 * Get popular destination countries for quick selection
 * @returns Array of popular countries
 */
export function getPopularCountries(): Country[] {
  const popularCodes = [
    'US', // United States
    'GB', // United Kingdom
    'CN', // China
    'JP', // Japan
    'DE', // Germany
    'FR', // France
    'SG', // Singapore
    'AU', // Australia
    'CA', // Canada
    'ID', // Indonesia
    'MY', // Malaysia
    'TH', // Thailand
    'HK', // Hong Kong
    'IN', // India
    'KR'  // South Korea
  ];
  
  return popularCodes
    .map(code => COUNTRIES.find(c => c.code === code))
    .filter((c): c is Country => c !== undefined);
}

/**
 * Validate if a country code is served by FedEx
 * @param code - ISO 3166-1 alpha-2 code
 * @returns true if served, false otherwise
 */
export function isCountryServedByFedEx(code: string): boolean {
  if (!code) return false;
  
  const normalized = code.trim().toUpperCase();
  
  // Check if it's in the unserved list
  if (UNSERVED_COUNTRIES.includes(normalized)) return false;
  
  // Check if it's in the served list
  return COUNTRIES.some(c => c.code === normalized);
}

/**
 * Format country for display (e.g., "United States (US)")
 * @param code - ISO 3166-1 alpha-2 code
 * @returns Formatted string or just the code if country not found
 */
export function formatCountryDisplay(code: string): string {
  const country = codeToCountry(code);
  return country ? `${country} (${code.toUpperCase()})` : code.toUpperCase();
}