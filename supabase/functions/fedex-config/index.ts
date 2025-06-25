import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as crypto from "https://deno.land/std@0.168.0/crypto/mod.ts";

// ============================================
// TYPES
// ============================================
interface FedexConfigRequest {
  action: 'save' | 'get' | 'validate' | 'delete';
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
// ENCRYPTION HELPERS
// ============================================
class EncryptionService {
  private static encoder = new TextEncoder();
  private static decoder = new TextDecoder();

  static async generateKey(secret: string): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      this.encoder.encode(secret),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    return await crypto.subtle.deriveKey(
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
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
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

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );

    return this.decoder.decode(decrypted);
  }
}

// ============================================
// MAIN HANDLER
// ============================================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
    const sessionId = request.sessionId || crypto.randomUUID();
    const sessionKey = `fedex_config_${sessionId}`;
    
    // Initialize encryption
    const encryptionKey = await EncryptionService.generateKey(encryptionSecret);

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

        // Encrypt and store in Deno KV (temporary session storage)
        const encryptedConfig = {
          accountNumber: await EncryptionService.encrypt(accountNumber, encryptionKey),
          clientId: await EncryptionService.encrypt(clientId, encryptionKey),
          clientSecret: await EncryptionService.encrypt(clientSecret, encryptionKey),
          timestamp: new Date().toISOString()
        };

        // Store in Deno KV with 24-hour expiration
        const kv = await Deno.openKv();
        await kv.set([sessionKey], encryptedConfig, {
          expireIn: 24 * 60 * 60 * 1000 // 24 hours
        });

        response = {
          success: true,
          message: 'Configuration saved securely',
          sessionId
        };
        break;

      case 'get':
        if (!request.sessionId) {
          response = {
            success: true,
            hasConfig: false
          };
          break;
        }

        // Retrieve from Deno KV
        const kvGet = await Deno.openKv();
        const stored = await kvGet.get([sessionKey]);

        if (!stored.value) {
          response = {
            success: true,
            hasConfig: false
          };
        } else {
          response = {
            success: true,
            hasConfig: true,
            sessionId
          };
        }
        break;

      case 'validate':
        if (!request.sessionId) {
          throw new Error('Session ID required for validation');
        }

        // Retrieve and decrypt config
        const kvValidate = await Deno.openKv();
        const storedConfig = await kvValidate.get([sessionKey]);

        if (!storedConfig.value) {
          throw new Error('No configuration found');
        }

        const encryptedData = storedConfig.value as any;
        const decryptedConfig = {
          accountNumber: await EncryptionService.decrypt(encryptedData.accountNumber, encryptionKey),
          clientId: await EncryptionService.decrypt(encryptedData.clientId, encryptionKey),
          clientSecret: await EncryptionService.decrypt(encryptedData.clientSecret, encryptionKey)
        };

        // Test FedEx authentication
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

        const isValid = authResponse.ok;

        response = {
          success: true,
          isValid,
          message: isValid ? 'Configuration is valid' : 'Invalid FedEx credentials'
        };
        break;

      case 'delete':
        if (!request.sessionId) {
          throw new Error('Session ID required');
        }

        // Delete from Deno KV
        const kvDelete = await Deno.openKv();
        await kvDelete.delete([sessionKey]);

        response = {
          success: true,
          message: 'Configuration deleted'
        };
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('FedEx config error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
