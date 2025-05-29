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

// FedEx Rate Response Types
export interface FedexCharge {
  amount: string;
  currency: string;
}

// Extended charge type for parsing flexibility
export interface FedexChargeVariant {
  amount?: string | number | { value?: string | number };
  value?: string | number;
  currency?: string;
}

export interface FedexPackageRateDetail {
  netCharge?: FedexCharge;
}

export interface FedexRatedPackage {
  packageRateDetail?: FedexPackageRateDetail;
}

export interface FedexShipmentRateDetail {
  totalNetCharge?: FedexCharge;
}

// Extended type to handle alternative field names
export interface FedexRatedShipmentDetailExtended extends FedexRatedShipmentDetail {
  totalNetFedExCharge?: FedexCharge;
}

export interface FedexRatedShipmentDetail {
  rateType?: string; // ACCOUNT, LIST, RATED_LIST_PACKAGE, etc.
  totalNetCharge?: FedexCharge;
  shipmentRateDetail?: FedexShipmentRateDetail;
  ratedPackages?: FedexRatedPackage[];
  currency?: string;
}

// Transit time and delivery information
export interface FedexDateDetail {
  dayOfWeek?: string;
  dayCxsFormat?: string;
}

export interface FedexCommit {
  label?: string;
  commitMessageDetails?: string;
  dateDetail?: FedexDateDetail;
  transitTime?: string;
}

export interface FedexOperationalDetail {
  transitTime?: string;
  deliveryDate?: string;
  deliveryDayOfWeek?: string;
  destinationServiceArea?: string;
}

export interface FedexRateReplyDetail {
  serviceType?: string;
  transitTime?: string;
  deliveryTimestamp?: string;
  ratedShipmentDetails?: FedexRatedShipmentDetail[];
  operationalDetail?: FedexOperationalDetail;
  commit?: FedexCommit;
}

export interface FedexRateOutput {
  rateReplyDetails?: FedexRateReplyDetail[];
}

export interface FedexRateResponse {
  output?: FedexRateOutput;
  errors?: Array<{
    code?: string;
    message?: string;
  }>;
  messages?: Array<{
    code?: string;
    message?: string;
  }>;
}
