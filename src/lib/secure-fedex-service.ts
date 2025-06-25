import { supabase } from '@/integrations/supabase/client';
import { secureFedexStorage } from '@/lib/storage-utils';

/**
 * Secure FedEx configuration API service
 * Handles communication with the secure edge function for FedEx credentials
 */

interface FedexConfig {
  accountNumber: string;
  clientId: string;
  clientSecret: string;
}

interface FedexConfigResponse {
  success: boolean;
  message?: string;
  hasConfig?: boolean;
  isValid?: boolean;
  sessionId?: string;
}

class SecureFedexService {
  private static readonly FEDEX_CONFIG_FUNCTION = 'fedex-config';
  
  /**
   * Save FedEx configuration securely
   * Credentials are encrypted and stored server-side
   */
  static async saveConfig(config: FedexConfig): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      // Get or create session ID
      let sessionId = secureFedexStorage.getSessionId();
      
      const { data, error } = await supabase.functions.invoke(this.FEDEX_CONFIG_FUNCTION, {
        body: {
          action: 'save',
          config,
          sessionId
        }
      });

      if (error) {
        console.error('Failed to save FedEx configuration:', error);
        return { success: false, error: error.message };
      }

      const response = data as FedexConfigResponse;
      
      if (response.success && response.sessionId) {
        // Store session ID locally
        secureFedexStorage.setSessionId(response.sessionId);
        return { success: true, sessionId: response.sessionId };
      }

      return { success: false, error: response.message || 'Failed to save configuration' };
    } catch (error) {
      console.error('Error saving FedEx config:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Check if FedEx configuration exists
   */
  static async checkConfig(): Promise<{ hasConfig: boolean; sessionId?: string }> {
    try {
      const sessionId = secureFedexStorage.getSessionId();
      
      if (!sessionId) {
        return { hasConfig: false };
      }

      const { data, error } = await supabase.functions.invoke(this.FEDEX_CONFIG_FUNCTION, {
        body: {
          action: 'get',
          sessionId
        }
      });

      if (error) {
        console.error('Failed to check FedEx configuration:', error);
        return { hasConfig: false };
      }

      const response = data as FedexConfigResponse;
      return { 
        hasConfig: response.hasConfig || false, 
        sessionId: response.hasConfig ? sessionId : undefined 
      };
    } catch (error) {
      console.error('Error checking FedEx config:', error);
      return { hasConfig: false };
    }
  }

  /**
   * Validate FedEx configuration
   * Tests the credentials against FedEx API
   */
  static async validateConfig(): Promise<{ isValid: boolean; message?: string }> {
    try {
      const sessionId = secureFedexStorage.getSessionId();
      
      if (!sessionId) {
        return { isValid: false, message: 'No configuration found' };
      }

      const { data, error } = await supabase.functions.invoke(this.FEDEX_CONFIG_FUNCTION, {
        body: {
          action: 'validate',
          sessionId
        }
      });

      if (error) {
        console.error('Failed to validate FedEx configuration:', error);
        return { isValid: false, message: error.message };
      }

      const response = data as FedexConfigResponse;
      return { 
        isValid: response.isValid || false, 
        message: response.message 
      };
    } catch (error) {
      console.error('Error validating FedEx config:', error);
      return { isValid: false, message: 'Validation failed' };
    }
  }

  /**
   * Delete FedEx configuration
   */
  static async deleteConfig(): Promise<{ success: boolean; error?: string }> {
    try {
      const sessionId = secureFedexStorage.getSessionId();
      
      if (!sessionId) {
        // No config to delete
        return { success: true };
      }

      const { data, error } = await supabase.functions.invoke(this.FEDEX_CONFIG_FUNCTION, {
        body: {
          action: 'delete',
          sessionId
        }
      });

      if (error) {
        console.error('Failed to delete FedEx configuration:', error);
        return { success: false, error: error.message };
      }

      const response = data as FedexConfigResponse;
      
      if (response.success) {
        // Clear local session ID
        secureFedexStorage.clearSessionId();
        return { success: true };
      }

      return { success: false, error: response.message || 'Failed to delete configuration' };
    } catch (error) {
      console.error('Error deleting FedEx config:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get session ID for API calls
   */
  static getSessionId(): string | null {
    const sessionId = secureFedexStorage.getSessionId();
    return sessionId || null;
  }
}

export default SecureFedexService;
