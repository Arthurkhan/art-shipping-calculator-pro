/**
 * Database operations for collection sizes
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Logger } from './logger.ts';
import { ErrorType, ShippingError } from '../types/index.ts';
import type { CollectionSize } from '../types/index.ts';

/**
 * FIXED: Updated to work with collection ID directly (frontend passes collection.id)
 * UPDATED: Changed table name from 'collection_sizes' to 'sizes' to match Supabase
 */
export async function getCollectionSize(collectionId: string, size: string): Promise<CollectionSize> {
  try {
    Logger.info('Fetching collection size data', { collectionId, size });
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new ShippingError(
        ErrorType.CONFIGURATION,
        'Missing Supabase configuration',
        'Configuration error. Please contact support.'
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // CRITICAL FIX: Frontend passes collection ID, so query directly with collection_id
    // UPDATED: Changed from 'collection_sizes' to 'sizes' table
    Logger.info('Looking up collection size data by collection ID', { collectionId, size });
    
    const { data, error } = await supabase
      .from('sizes') // Changed from 'collection_sizes' to 'sizes'
      .select('weight_kg, height_cm, length_cm, width_cm')
      .eq('collection_id', collectionId)
      .eq('size', size)
      .single();

    if (error) {
      Logger.error('Database query failed', { error: error.message, collectionId, size });
      throw new ShippingError(
        ErrorType.DATABASE,
        `Database error: ${error.message}`,
        'Unable to retrieve shipping information. Please try again.'
      );
    }

    if (!data) {
      Logger.warn('No size data found', { collectionId, size });
      throw new ShippingError(
        ErrorType.VALIDATION,
        `No size data found for collection ID: ${collectionId}, size: ${size}`,
        'The selected artwork size is not available for shipping calculation.'
      );
    }

    Logger.info('Collection size data retrieved successfully', { data });
    return data;
  } catch (error) {
    if (error instanceof ShippingError) {
      throw error;
    }
    
    Logger.error('Unexpected error fetching collection size', { error: error.message });
    throw new ShippingError(
      ErrorType.DATABASE,
      `Unexpected database error: ${error.message}`,
      'Unable to retrieve shipping information. Please contact support.'
    );
  }
}
