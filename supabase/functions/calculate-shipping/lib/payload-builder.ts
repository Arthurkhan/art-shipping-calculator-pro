/**
 * Request payload construction for FedEx API
 * CRITICAL: Implements n8n-compliant payload structure exactly
 */

import { Logger } from './logger.ts';
import type { PayloadParams, FedexRateRequest } from '../types/index.ts';

/**
 * Payload Builder for FedEx API requests
 */
export class PayloadBuilder {
  /**
   * Build FedEx rate request payload matching n8n workflow structure EXACTLY
   * CRITICAL FIX: This implements the exact structure from the working n8n workflow
   */
  static buildRateRequest(params: PayloadParams): FedexRateRequest {
    const {
      accountNumber,
      sizeData,
      originCountry,
      originPostalCode,
      destinationCountry,
      destinationPostalCode,
      preferredCurrency,
      shipDateStamp
    } = params;

    // Enhanced debugging: Log dimensional weight calculation
    const dimensionalWeight = (sizeData.length_cm * sizeData.width_cm * sizeData.height_cm) / 5000;
    const billedWeight = Math.max(sizeData.weight_kg, dimensionalWeight);
    
    Logger.info('Weight calculations for debugging', {
      actualWeight: sizeData.weight_kg,
      dimensionalWeight: Math.round(dimensionalWeight * 100) / 100,
      billedWeight: Math.round(billedWeight * 100) / 100,
      dimensions: `${sizeData.length_cm}x${sizeData.width_cm}x${sizeData.height_cm} cm`,
      volume: sizeData.length_cm * sizeData.width_cm * sizeData.height_cm
    });

    // CRITICAL FIX: Construct payload EXACTLY matching n8n workflow structure
    // Key changes from roadmap:
    // 1. Removed extra groupPackageCount from top level of requestedShipment
    // 2. Reordered fields to match n8n structure exactly
    // 3. Only groupPackageCount should be inside requestedPackageLineItems
    // 4. Use CM/KG directly (no unit conversions)
    // 5. Add missing required fields: preferredCurrency, shipDateStamp, packagingType
    // 6. ADD variableOptions to request transit time and delivery date
    const payload: FedexRateRequest = {
      accountNumber: {
        value: accountNumber
      },
      requestedShipment: {
        shipper: {
          address: {
            postalCode: originPostalCode,
            countryCode: originCountry
          }
        },
        recipient: {
          address: {
            postalCode: destinationPostalCode,
            countryCode: destinationCountry
          }
        },
        preferredCurrency: preferredCurrency, // Required field from roadmap
        shipDateStamp: shipDateStamp, // Required field from roadmap
        pickupType: "DROPOFF_AT_FEDEX_LOCATION", // Fixed from roadmap
        packagingType: "YOUR_PACKAGING", // Required field from roadmap
        rateRequestType: ["LIST", "ACCOUNT", "INCENTIVE"], // Fixed array format from roadmap
        requestedPackageLineItems: [
          {
            groupPackageCount: 1, // ONLY here - not at top level
            weight: {
              units: "KG", // Use KG directly (no conversion)
              value: sizeData.weight_kg
            },
            dimensions: {
              length: sizeData.length_cm, // Use CM directly (no conversion)
              width: sizeData.width_cm,
              height: sizeData.height_cm,
              units: "CM"
            }
          }
        ],
        // ADD: Request transit time and commit information
        variableOptions: ["TRANSIT_TIME"]
        // REMOVED: groupPackageCount from this level (was causing validation error)
      }
    };

    // Enhanced debugging: Log full payload details (sanitized)
    Logger.info('Built FedEx rate request - FIXED payload structure to match n8n exactly', { 
      payload: {
        ...payload,
        accountNumber: { value: '[REDACTED]' }
      },
      debugInfo: {
        route: `${originCountry} ${originPostalCode} → ${destinationCountry} ${destinationPostalCode}`,
        currency: preferredCurrency,
        shipDate: shipDateStamp,
        weightInfo: {
          actual: sizeData.weight_kg,
          dimensional: Math.round(dimensionalWeight * 100) / 100,
          billed: Math.round(billedWeight * 100) / 100
        },
        fixApplied: 'Implemented n8n-compliant payload structure with all required fields + TRANSIT_TIME'
      }
    });

    return payload;
  }

  /**
   * Validate payload structure matches requirements
   */
  static validatePayloadStructure(payload: unknown): boolean {
    try {
      if (!payload || typeof payload !== 'object') return false;
      
      const typedPayload = payload as Record<string, unknown>;
      
      // Check required top-level fields
      if (!typedPayload.accountNumber || typeof typedPayload.accountNumber !== 'object') return false;
      const accountNumber = typedPayload.accountNumber as Record<string, unknown>;
      if (!accountNumber.value) return false;
      
      if (!typedPayload.requestedShipment || typeof typedPayload.requestedShipment !== 'object') return false;
      const shipment = typedPayload.requestedShipment as Record<string, unknown>;
      
      // Check required shipment fields
      const shipper = shipment.shipper as Record<string, unknown> | undefined;
      const recipient = shipment.recipient as Record<string, unknown> | undefined;
      
      if (!shipper?.address || typeof shipper.address !== 'object') return false;
      const shipperAddress = shipper.address as Record<string, unknown>;
      if (!shipperAddress.postalCode || !shipperAddress.countryCode) return false;
      
      if (!recipient?.address || typeof recipient.address !== 'object') return false;
      const recipientAddress = recipient.address as Record<string, unknown>;
      if (!recipientAddress.postalCode || !recipientAddress.countryCode) return false;
      
      if (!shipment.preferredCurrency) return false;
      if (!shipment.shipDateStamp) return false;
      if (!shipment.pickupType) return false;
      if (!shipment.packagingType) return false;
      if (!Array.isArray(shipment.rateRequestType)) return false;
      if (!Array.isArray(shipment.requestedPackageLineItems)) return false;
      
      // Check package line items
      const packageItems = shipment.requestedPackageLineItems as unknown[];
      if (packageItems.length === 0) return false;
      
      for (const item of packageItems) {
        if (!item || typeof item !== 'object') return false;
        const typedItem = item as Record<string, unknown>;
        
        if (typeof typedItem.groupPackageCount !== 'number') return false;
        
        const weight = typedItem.weight as Record<string, unknown> | undefined;
        if (!weight?.units || !weight?.value) return false;
        
        const dimensions = typedItem.dimensions as Record<string, unknown> | undefined;
        if (!dimensions?.length || !dimensions?.width || 
            !dimensions?.height || !dimensions?.units) return false;
      }
      
      return true;
    } catch (error) {
      Logger.error('Payload validation failed', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Generate current ship date stamp (tomorrow)
   */
  static generateShipDateStamp(): string {
    const now = new Date();
    const shipDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    return shipDate.toISOString().split('T')[0];
  }
}
