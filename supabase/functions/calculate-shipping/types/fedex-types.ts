/**
 * FedEx API specific type definitions
 */

export interface FedexAuthPayload {
  grant_type: string;
  client_id: string;
  client_secret: string;
}

export interface FedexAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface FedexAddress {
  postalCode: string;
  countryCode: string;
}

export interface FedexWeight {
  units: string;
  value: number;
}

export interface FedexDimensions {
  length: number;
  width: number;
  height: number;
  units: string;
}

export interface FedexPackageLineItem {
  groupPackageCount: number;
  weight: FedexWeight;
  dimensions: FedexDimensions;
}

export interface FedexRequestedShipment {
  shipper: {
    address: FedexAddress;
  };
  recipient: {
    address: FedexAddress;
  };
  preferredCurrency: string;
  shipDateStamp: string;
  pickupType: string;
  packagingType: string;
  rateRequestType: string[];
  requestedPackageLineItems: FedexPackageLineItem[];
}

export interface FedexRateRequest {
  accountNumber: {
    value: string;
  };
  requestedShipment: FedexRequestedShipment;
}

export interface FedexConfig {
  accountNumber: string;
  clientId: string;
  clientSecret: string;
}

export interface PayloadParams {
  accountNumber: string;
  sizeData: import('./shipping-types.ts').CollectionSize;
  originCountry: string;
  originPostalCode: string;
  destinationCountry: string;
  destinationPostalCode: string;
  preferredCurrency: string;
  shipDateStamp: string;
}
