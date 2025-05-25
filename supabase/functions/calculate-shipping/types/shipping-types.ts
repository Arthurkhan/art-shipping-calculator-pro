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
  fedexConfig?: {
    accountNumber: string;
    clientId: string;
    clientSecret: string;
  };
}

export interface ShippingRate {
  service: string;
  cost: number;
  currency: string;
  transitTime: string;
  deliveryDate?: string;
}

export interface CollectionSize {
  weight_kg: number;
  height_cm: number;
  length_cm: number;
  width_cm: number;
}
