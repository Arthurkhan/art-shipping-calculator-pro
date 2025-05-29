/**
 * Test Configuration for FedEx Integration Testing - Phase 4
 * This file contains test data and configuration for running comprehensive FedEx API tests
 */

export const testConfig = {
  // FedEx API Configuration
  // NOTE: Replace with your actual FedEx credentials for testing
  fedexConfig: {
    accountNumber: "YOUR_FEDEX_ACCOUNT_NUMBER",
    clientId: "YOUR_FEDEX_CLIENT_ID", 
    clientSecret: "YOUR_FEDEX_CLIENT_SECRET"
  },

  // Test destinations for comprehensive coverage
  testDestinations: [
    {
      name: "United States - New York",
      country: "US",
      postalCode: "10001",
      expectedServices: ["FEDEX_GROUND", "FEDEX_EXPRESS", "PRIORITY_OVERNIGHT"]
    },
    {
      name: "United States - Los Angeles", 
      country: "US",
      postalCode: "90210",
      expectedServices: ["FEDEX_GROUND", "FEDEX_EXPRESS"]
    },
    {
      name: "United States - Miami",
      country: "US", 
      postalCode: "33101",
      expectedServices: ["FEDEX_GROUND", "FEDEX_EXPRESS"]
    },
    {
      name: "Canada - Toronto",
      country: "CA",
      postalCode: "M5H 2N2",
      expectedServices: ["INTERNATIONAL_ECONOMY", "INTERNATIONAL_PRIORITY"]
    },
    {
      name: "United Kingdom - London",
      country: "GB", 
      postalCode: "SW1A 1AA",
      expectedServices: ["INTERNATIONAL_ECONOMY", "INTERNATIONAL_PRIORITY"]
    },
    {
      name: "Germany - Berlin",
      country: "DE",
      postalCode: "10115", 
      expectedServices: ["INTERNATIONAL_ECONOMY", "INTERNATIONAL_PRIORITY"]
    },
    {
      name: "France - Paris",
      country: "FR",
      postalCode: "75001",
      expectedServices: ["INTERNATIONAL_ECONOMY", "INTERNATIONAL_PRIORITY"]
    },
    {
      name: "Australia - Sydney",
      country: "AU",
      postalCode: "2000",
      expectedServices: ["INTERNATIONAL_ECONOMY", "INTERNATIONAL_PRIORITY"]
    },
    {
      name: "Japan - Tokyo",
      country: "JP",
      postalCode: "100-0001",
      expectedServices: ["INTERNATIONAL_ECONOMY", "INTERNATIONAL_PRIORITY"]
    },
    {
      name: "Singapore",
      country: "SG",
      postalCode: "018956",
      expectedServices: ["INTERNATIONAL_ECONOMY", "INTERNATIONAL_PRIORITY"]
    }
  ],

  // Test collections and sizes for package dimension testing
  testCollections: [
    {
      collection: "test-collection",
      size: "small",
      weight_kg: 2.5,
      height_cm: 15,
      length_cm: 25,
      width_cm: 20
    },
    {
      collection: "test-collection", 
      size: "medium",
      weight_kg: 5.0,
      height_cm: 25,
      length_cm: 35,
      width_cm: 30
    },
    {
      collection: "test-collection",
      size: "large", 
      weight_kg: 10.0,
      height_cm: 35,
      length_cm: 50,
      width_cm: 40
    },
    {
      collection: "premium-collection",
      size: "small",
      weight_kg: 3.0,
      height_cm: 18,
      length_cm: 28,
      width_cm: 23
    }
  ],

  // API endpoints for testing different environments
  endpoints: {
    local: "http://localhost:54321/functions/v1/calculate-shipping",
    staging: "https://YOUR_STAGING_PROJECT.supabase.co/functions/v1/calculate-shipping", 
    production: "https://YOUR_PRODUCTION_PROJECT.supabase.co/functions/v1/calculate-shipping"
  },

  // Test environment configuration
  testEnvironment: {
    // Which endpoint to test (local, staging, or production)
    targetEndpoint: "local",
    
    // Test timeouts
    defaultTimeout: 30000, // 30 seconds
    longTimeout: 60000,    // 60 seconds for international requests
    
    // Retry configuration for flaky network tests
    maxRetries: 3,
    retryDelay: 2000,
    
    // Performance thresholds 
    performanceThresholds: {
      excellent: 10000,   // 10 seconds
      good: 20000,        // 20 seconds
      acceptable: 35000   // 35 seconds
    }
  },

  // Expected service mappings for validation
  expectedServiceMappings: {
    "US": {
      domestic: ["FEDEX_GROUND", "FEDEX_EXPRESS", "PRIORITY_OVERNIGHT", "STANDARD_OVERNIGHT"],
      availableCurrencies: ["USD"]
    },
    "CA": {
      international: ["INTERNATIONAL_ECONOMY", "INTERNATIONAL_PRIORITY", "INTERNATIONAL_EXPRESS"],
      availableCurrencies: ["CAD", "USD"]
    },
    "GB": {
      international: ["INTERNATIONAL_ECONOMY", "INTERNATIONAL_PRIORITY"], 
      availableCurrencies: ["GBP", "USD"]
    },
    "DE": {
      international: ["INTERNATIONAL_ECONOMY", "INTERNATIONAL_PRIORITY"],
      availableCurrencies: ["EUR", "USD"] 
    },
    "FR": {
      international: ["INTERNATIONAL_ECONOMY", "INTERNATIONAL_PRIORITY"],
      availableCurrencies: ["EUR", "USD"]
    },
    "JP": {
      international: ["INTERNATIONAL_ECONOMY", "INTERNATIONAL_PRIORITY"],
      availableCurrencies: ["JPY", "USD"]
    },
    "AU": {
      international: ["INTERNATIONAL_ECONOMY", "INTERNATIONAL_PRIORITY"],
      availableCurrencies: ["AUD", "USD"]
    },
    "SG": {
      international: ["INTERNATIONAL_ECONOMY", "INTERNATIONAL_PRIORITY"],
      availableCurrencies: ["SGD", "USD"]
    }
  },

  // Currency mapping for validation
  currencyMapping: {
    "US": "USD",
    "CA": "CAD", 
    "GB": "GBP",
    "DE": "EUR",
    "FR": "EUR",
    "IT": "EUR", 
    "ES": "EUR",
    "NL": "EUR",
    "AT": "EUR",
    "BE": "EUR",
    "JP": "JPY",
    "AU": "AUD",
    "TH": "THB",
    "SG": "SGD", 
    "HK": "HKD"
  },

  // Error test scenarios
  errorTestScenarios: [
    {
      name: "Invalid Postal Code Format",
      payload: {
        collection: "test-collection",
        size: "small", 
        country: "US",
        postalCode: "INVALID_FORMAT"
      },
      expectedError: "VALIDATION"
    },
    {
      name: "Unsupported Country Code",
      payload: {
        collection: "test-collection",
        size: "small",
        country: "XX", 
        postalCode: "12345"
      },
      expectedError: "VALIDATION"
    },
    {
      name: "Missing Required Fields",
      payload: {
        size: "small",
        country: "US"
        // Missing collection and postalCode
      },
      expectedError: "VALIDATION"
    },
    {
      name: "Invalid FedEx Credentials",
      payload: {
        collection: "test-collection",
        size: "small",
        country: "US", 
        postalCode: "10001",
        fedexConfig: {
          accountNumber: "INVALID",
          clientId: "INVALID",
          clientSecret: "INVALID"
        }
      },
      expectedError: "AUTHENTICATION"
    },
    {
      name: "Non-existent Collection",
      payload: {
        collection: "non-existent-collection",
        size: "small",
        country: "US",
        postalCode: "10001"
      },
      expectedError: "VALIDATION"
    }
  ],

  // Test data validation rules
  validationRules: {
    requiredRateFields: ["service", "cost", "currency", "transitTime"],
    optionalRateFields: ["deliveryDate"],
    
    rateFieldTypes: {
      service: "string",
      cost: "number",
      currency: "string", 
      transitTime: "string",
      deliveryDate: "string"
    },
    
    rateFieldValidations: {
      cost: (value: number) => value > 0,
      currency: (value: string) => /^[A-Z]{3}$/.test(value),
      service: (value: string) => value && value.length > 0
    }
  }
};

// Environment-specific configuration loader
export function getTestConfig(environment: 'local' | 'staging' | 'production' = 'local') {
  const config = { ...testConfig };
  config.testEnvironment.targetEndpoint = environment;
  return config;
}

interface FedexConfig {
  accountNumber?: string;
  clientId?: string;
  clientSecret?: string;
}

// Credential validation helper
export function validateFedexCredentials(fedexConfig: FedexConfig): boolean {
  return !!(
    fedexConfig?.accountNumber && 
    fedexConfig?.clientId && 
    fedexConfig?.clientSecret &&
    fedexConfig.accountNumber !== "YOUR_FEDEX_ACCOUNT_NUMBER" &&
    fedexConfig.clientId !== "YOUR_FEDEX_CLIENT_ID" &&
    fedexConfig.clientSecret !== "YOUR_FEDEX_CLIENT_SECRET"
  );
}

// Test data generators
export const testDataGenerators = {
  generateRandomPostalCode: (country: string): string => {
    const formats = {
      "US": () => Math.floor(10000 + Math.random() * 90000).toString(),
      "CA": () => {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const digits = "0123456789";
        return `${letters[Math.floor(Math.random() * letters.length)]}${digits[Math.floor(Math.random() * digits.length)]}${letters[Math.floor(Math.random() * letters.length)]} ${digits[Math.floor(Math.random() * digits.length)]}${letters[Math.floor(Math.random() * letters.length)]}${digits[Math.floor(Math.random() * digits.length)]}`;
      },
      "GB": () => {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const digits = "0123456789";
        return `${letters[Math.floor(Math.random() * letters.length)]}${letters[Math.floor(Math.random() * letters.length)]}${digits[Math.floor(Math.random() * digits.length)]} ${digits[Math.floor(Math.random() * digits.length)]}${letters[Math.floor(Math.random() * letters.length)]}${letters[Math.floor(Math.random() * letters.length)]}`;
      },
      "DE": () => Math.floor(10000 + Math.random() * 90000).toString()
    };
    
    return formats[country as keyof typeof formats]?.() || "12345";
  },

  generateTestPackage: (size: 'small' | 'medium' | 'large' = 'medium') => {
    const sizes = {
      small: { weight: 1 + Math.random() * 2, multiplier: 0.5 },
      medium: { weight: 2 + Math.random() * 5, multiplier: 1 },
      large: { weight: 5 + Math.random() * 10, multiplier: 1.5 }
    };
    
    const config = sizes[size];
    return {
      collection: "test-collection",
      size,
      weight_kg: Number(config.weight.toFixed(1)),
      height_cm: Math.floor(15 * config.multiplier + Math.random() * 10),
      length_cm: Math.floor(25 * config.multiplier + Math.random() * 15), 
      width_cm: Math.floor(20 * config.multiplier + Math.random() * 10)
    };
  }
};

export default testConfig;
