import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================
// TYPES
// ============================================
interface FedexConfigRequest {
  action: 'save' | 'get' | 'validate' | 'delete' | 'check-defaults';
  config?: {
    accountNumber?: string;
    clientId?: string;
    clientSecret?: string;
  };
  sessionId?: string;
}

interface FedexConfigResponse {
  success: boolean;
  message?: string;
  hasConfig?: boolean;
  isValid?: boolean;
  sessionId?: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================
// ENCRYPTION HELPERS
// ============================================
class EncryptionService {
  private static encoder = new TextEncoder();
  private static decoder = new TextDecoder();

  static async generateKey(secret: string): Promise<CryptoKey> {
    // Use the global crypto object (no import needed in Deno)
    const subtle = globalThis.crypto.subtle;
    
    const keyMaterial = await subtle.importKey(
      "raw",
      this.encoder.encode(secret),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    return await subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: this.encoder.encode("art-shipping-salt"),
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  static async encrypt(text: string, key: CryptoKey): Promise<string> {
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await globalThis.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      this.encoder.encode(text)
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
  }

  static async decrypt(encryptedText: string, key: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await globalThis.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );

    return this.decoder.decode(decrypted);
  }
}

// ============================================
// SUPABASE HELPER
// ============================================
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// ============================================
// MAIN HANDLER
// ============================================
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:8083',
  'http://localhost:5173',
  'http://localhost:4173',
  'https://arthurkhan.github.io',
  'https://art-shipping-calculator-pro.netlify.app'
];

const corsHeaders = (origin: string | null) => {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400'
  };
  
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  
  return headers;
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  // FedEx config endpoint called

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    // Get encryption key from environment
    const encryptionSecret = Deno.env.get('FEDEX_ENCRYPTION_SECRET');
    if (!encryptionSecret) {
      throw new Error('Encryption configuration missing');
    }

    // Parse request
    const request: FedexConfigRequest = await req.json();
    
    // Generate session ID for temporary storage
    const sessionId = request.sessionId || generateUUID();
    
    // Initialize encryption
    const encryptionKey = await EncryptionService.generateKey(encryptionSecret);
    
    // Get Supabase client
    const supabase = getSupabaseClient();

    // Handle different actions
    let response: FedexConfigResponse;

    switch (request.action) {
      case 'save':
        if (!request.config) {
          throw new Error('Configuration data required');
        }

        // Validate required fields
        const { accountNumber, clientId, clientSecret } = request.config;
        if (!accountNumber || !clientId || !clientSecret) {
          throw new Error('All FedEx credentials are required');
        }

        // Encrypt credentials
        const encryptedConfig = {
          session_id: sessionId,
          encrypted_account_number: await EncryptionService.encrypt(accountNumber, encryptionKey),
          encrypted_client_id: await EncryptionService.encrypt(clientId, encryptionKey),
          encrypted_client_secret: await EncryptionService.encrypt(clientSecret, encryptionKey)
        };

        // Delete any existing session with same ID
        await supabase
          .from('fedex_sessions')
          .delete()
          .eq('session_id', sessionId);
        
        // Insert new session
        const { error: insertError } = await supabase
          .from('fedex_sessions')
          .insert(encryptedConfig);
          
        if (insertError) {
          // Insert error occurred
          throw new Error(`Failed to store configuration: ${insertError.message}`);
        }

        response = {
          success: true,
          message: 'Configuration saved securely',
          sessionId
        };
        break;

      case 'get':
        // Check session-based config first
        if (request.sessionId) {
          // Retrieve from Supabase
          const { data: getSession, error: getError } = await supabase
            .from('fedex_sessions')
            .select('*')
            .eq('session_id', request.sessionId)
            .single();

          if (getSession && !getError) {
            response = {
              success: true,
              hasConfig: true,
              sessionId: request.sessionId
            };
            break;
          }
        }

        // Check for default credentials as fallback
        const defaultAccountGet = Deno.env.get('FEDEX_DEFAULT_ACCOUNT');
        const defaultClientIdGet = Deno.env.get('FEDEX_DEFAULT_CLIENT_ID');
        const defaultClientSecretGet = Deno.env.get('FEDEX_DEFAULT_CLIENT_SECRET');
        
        if (defaultAccountGet && defaultClientIdGet && defaultClientSecretGet) {
          response = {
            success: true,
            hasConfig: true,
            sessionId: 'default' // Special sessionId to indicate using defaults
          };
        } else {
          response = {
            success: true,
            hasConfig: false
          };
        }
        break;

      case 'validate':
        if (!request.sessionId) {
          throw new Error('Session ID required for validation');
        }

        // Retrieve and decrypt config
        const { data: validateSession, error: validateError } = await supabase
          .from('fedex_sessions')
          .select('*')
          .eq('session_id', request.sessionId)
          .single();

        if (validateError || !validateSession) {
          throw new Error('No configuration found');
        }

        // Decrypt credentials
        const decryptedConfig = {
          accountNumber: await EncryptionService.decrypt(validateSession.encrypted_account_number, encryptionKey),
          clientId: await EncryptionService.decrypt(validateSession.encrypted_client_id, encryptionKey),
          clientSecret: await EncryptionService.decrypt(validateSession.encrypted_client_secret, encryptionKey)
        };

        // Validate with FedEx OAuth endpoint
        const authUrl = 'https://apis.fedex.com/oauth/token';
        const authBody = new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: decryptedConfig.clientId,
          client_secret: decryptedConfig.clientSecret
        });

        const authResponse = await fetch(authUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: authBody.toString()
        });

        response = {
          success: true,
          isValid: authResponse.ok,
          message: authResponse.ok ? 
            'FedEx credentials validated successfully' : 
            'Invalid FedEx credentials'
        };
        break;

      case 'delete':
        if (!request.sessionId) {
          throw new Error('Session ID required for deletion');
        }

        // Delete from Supabase
        const { error: deleteError } = await supabase
          .from('fedex_sessions')
          .delete()
          .eq('session_id', request.sessionId);

        if (deleteError) {
          throw new Error(`Failed to delete configuration: ${deleteError.message}`);
        }

        response = {
          success: true,
          message: 'Configuration deleted'
        };
        break;

      case 'check-defaults':
        // Check if default credentials are available
        const defaultAccount = Deno.env.get('FEDEX_DEFAULT_ACCOUNT');
        const defaultClientId = Deno.env.get('FEDEX_DEFAULT_CLIENT_ID');
        const defaultClientSecret = Deno.env.get('FEDEX_DEFAULT_CLIENT_SECRET');
        
        const hasDefaults = !!(defaultAccount && defaultClientId && defaultClientSecret);
        
        response = {
          success: true,
          hasConfig: hasDefaults,
          message: hasDefaults ? 'Default FedEx credentials are configured' : 'No default credentials'
        };
        break;

      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders(origin),
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    // FedEx config error occurred
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred'
    }), {
      status: 500,
      headers: {
        ...corsHeaders(origin),
        'Content-Type': 'application/json'
      }
    });
  }
});