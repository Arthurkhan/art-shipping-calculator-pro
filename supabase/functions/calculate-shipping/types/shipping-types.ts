/**
 * Core shipping calculation types
 */

export interface ShippingRequest {
  collection: string; // This is actually the collection ID from frontend
  size: string;
  country: string;
  postalCode: string;
  originCountry: string;
  originPostalCode: string;
  preferredCurrency?: string; // User-selected currency (optional, defaults to auto-mapping)
  shipDate?: string; // User-selected ship date in YYYY-MM-DD format (optional, defaults to tomorrow)
  fedexConfig?: {
    accountNumber: string;
    clientId: string;
    clientSecret: string;
  };
  overrideData?: { // New field for override dimensions and weight
    weight_kg: number;
    height_cm: number;
    length_cm: number;
    width_cm: number;
    quantity: number;
  };
}

export interface ShippingRate {
  service: string;
  cost: number;
  currency: string;
  transitTime: string;
  deliveryDate?: string;
  rateType?: string; // e.g., 'LIST', 'ACCOUNT', 'INCENTIVE'
  isLastMinute?: boolean; // Flag for last-minute rates
  isAlternative?: boolean; // Flag for alternative rates (e.g., when showing both regular and last-minute)
}

export interface CollectionSize {
  weight_kg: number;
  height_cm: number;
  length_cm: number;
  width_cm: number;
}
