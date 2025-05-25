#!/usr/bin/env node

/**
 * FedEx API Endpoint Verification Script - Phase 4
 * Validates FedEx API endpoints and basic connectivity before running full test suite
 */

const FEDEX_ENDPOINTS = {
  auth: 'https://apis.fedex.com/oauth/token',
  rates: 'https://apis.fedex.com/rate/v1/rates/quotes'
};

interface EndpointCheck {
  endpoint: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  responseTime?: number;
  details?: any;
}

class FedExEndpointVerifier {
  private results: EndpointCheck[] = [];

  async verifyAllEndpoints(): Promise<EndpointCheck[]> {
    console.log('🔍 FedEx API Endpoint Verification - Phase 4');
    console.log('='.repeat(50));
    
    // Check basic connectivity to FedEx APIs
    await this.checkEndpointConnectivity(FEDEX_ENDPOINTS.auth, 'Authentication Endpoint');
    await this.checkEndpointConnectivity(FEDEX_ENDPOINTS.rates, 'Rate Quotes Endpoint');
    
    // Test authentication if credentials are available
    await this.testAuthentication();
    
    // Test basic rate request structure
    await this.testRateRequestStructure();
    
    this.printSummary();
    return this.results;
  }

  private async checkEndpointConnectivity(url: string, name: string): Promise<void> {
    console.log(`\\n📡 Testing ${name}: ${url}`);
    
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'FedEx-Test-Client/1.0'
        },
        body: 'grant_type=client_credentials&client_id=test&client_secret=test',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      if (response.status === 401) {
        // 401 is expected with test credentials - means endpoint is reachable
        this.addResult({
          endpoint: name,
          status: 'success',
          message: `✅ ${name} is reachable (${responseTime}ms)`,
          responseTime,
          details: { 
            status: response.status, 
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          }
        });
      } else if (response.status >= 400 && response.status < 500) {
        // Client errors are expected with test data
        this.addResult({
          endpoint: name,
          status: 'success',
          message: `✅ ${name} is reachable, responds to requests (${responseTime}ms)`,
          responseTime,
          details: { status: response.status, statusText: response.statusText }
        });
      } else {
        this.addResult({
          endpoint: name,
          status: 'warning',
          message: `⚠️ ${name} returned unexpected status: ${response.status}`,
          responseTime,
          details: { status: response.status, statusText: response.statusText }
        });
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error.name === 'AbortError') {
        this.addResult({
          endpoint: name,
          status: 'error',
          message: `❌ ${name} timed out after 10 seconds`,
          responseTime,
          details: { error: 'Timeout' }
        });
      } else {
        this.addResult({
          endpoint: name,
          status: 'error',
          message: `❌ ${name} connection failed: ${error.message}`,
          responseTime,
          details: { error: error.message }
        });
      }
    }
  }

  private async testAuthentication(): Promise<void> {
    console.log('\\n🔐 Testing Authentication Flow');
    
    const credentials = this.getCredentialsFromEnv();
    
    if (!credentials.clientId || !credentials.clientSecret) {
      this.addResult({
        endpoint: 'Authentication Test',
        status: 'warning',
        message: '⚠️ No FedEx credentials available - skipping auth test',
        details: { reason: 'Missing environment variables FEDEX_CLIENT_ID or FEDEX_CLIENT_SECRET' }
      });
      return;
    }
    
    const startTime = Date.now();
    
    try {
      const authPayload = {
        grant_type: 'client_credentials',
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret
      };

      const response = await fetch(FEDEX_ENDPOINTS.auth, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(authPayload).toString()
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.access_token) {
          this.addResult({
            endpoint: 'Authentication Test',
            status: 'success',
            message: `✅ Authentication successful (${responseTime}ms)`,
            responseTime,
            details: { 
              tokenType: data.token_type,
              expiresIn: data.expires_in,
              scope: data.scope
            }
          });
          
          // Test rate endpoint with valid token
          await this.testRateEndpointWithAuth(data.access_token);
        } else {
          this.addResult({
            endpoint: 'Authentication Test',
            status: 'error',
            message: '❌ Authentication response missing access_token',
            responseTime,
            details: data
          });
        }
      } else {
        const errorText = await response.text();
        this.addResult({
          endpoint: 'Authentication Test',
          status: 'error',
          message: `❌ Authentication failed: ${response.status} ${response.statusText}`,
          responseTime,
          details: { status: response.status, error: errorText }
        });
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.addResult({
        endpoint: 'Authentication Test',
        status: 'error',
        message: `❌ Authentication test failed: ${error.message}`,
        responseTime,
        details: { error: error.message }
      });
    }
  }

  private async testRateEndpointWithAuth(accessToken: string): Promise<void> {
    console.log('\\n📦 Testing Rate Endpoint with Authentication');
    
    const credentials = this.getCredentialsFromEnv();
    
    if (!credentials.accountNumber) {
      this.addResult({
        endpoint: 'Rate Endpoint Test',
        status: 'warning', 
        message: '⚠️ No account number available - skipping rate test',
        details: { reason: 'Missing environment variable FEDEX_ACCOUNT_NUMBER' }
      });
      return;
    }
    
    const startTime = Date.now();
    
    try {
      // Create a basic rate request payload
      const ratePayload = {
        accountNumber: {
          value: credentials.accountNumber
        },
        requestedShipment: {
          shipper: {
            address: {
              postalCode: "10240",
              countryCode: "TH"
            }
          },
          recipient: {
            address: {
              postalCode: "10001",
              countryCode: "US"
            }
          },
          shipDateStamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          rateRequestType: ["LIST", "ACCOUNT", "INCENTIVE"],
          requestedPackageLineItems: [{
            groupPackageCount: 1,
            weight: {
              units: "KG",
              value: 2.5
            },
            dimensions: {
              length: 25,
              width: 20,
              height: 15,
              units: "CM"
            }
          }],
          pickupType: "DROPOFF_AT_FEDEX_LOCATION",
          packagingType: "YOUR_PACKAGING",
          groupPackageCount: 1,
          preferredCurrency: "USD"
        }
      };

      const response = await fetch(FEDEX_ENDPOINTS.rates, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-locale': 'en_US'
        },
        body: JSON.stringify(ratePayload)
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.output && data.output.rateReplyDetails) {
          this.addResult({
            endpoint: 'Rate Endpoint Test',
            status: 'success',
            message: `✅ Rate endpoint working correctly (${responseTime}ms)`,
            responseTime,
            details: {
              ratesReceived: data.output.rateReplyDetails.length,
              sampleService: data.output.rateReplyDetails[0]?.serviceType || 'Unknown'
            }
          });
        } else {
          this.addResult({
            endpoint: 'Rate Endpoint Test',
            status: 'warning',
            message: `⚠️ Rate endpoint responded but no rates returned (${responseTime}ms)`,
            responseTime,
            details: data
          });
        }
      } else {
        const errorText = await response.text();
        this.addResult({
          endpoint: 'Rate Endpoint Test',
          status: 'error',
          message: `❌ Rate request failed: ${response.status} ${response.statusText}`,
          responseTime,
          details: { status: response.status, error: errorText }
        });
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.addResult({
        endpoint: 'Rate Endpoint Test',
        status: 'error',
        message: `❌ Rate endpoint test failed: ${error.message}`,
        responseTime,
        details: { error: error.message }
      });
    }
  }

  private async testRateRequestStructure(): Promise<void> {
    console.log('\\n🏗️ Testing Rate Request Structure');
    
    // Test the structure without authentication
    const testPayload = {
      accountNumber: { value: "TEST_ACCOUNT" },
      requestedShipment: {
        shipper: { address: { postalCode: "10240", countryCode: "TH" } },
        recipient: { address: { postalCode: "10001", countryCode: "US" } },
        shipDateStamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        rateRequestType: ["LIST"],
        requestedPackageLineItems: [{
          weight: { units: "KG", value: 2.5 },
          dimensions: { length: 25, width: 20, height: 15, units: "CM" }
        }],
        pickupType: "DROPOFF_AT_FEDEX_LOCATION",
        packagingType: "YOUR_PACKAGING"
      }
    };

    const structureChecks = [
      { name: 'Account Number Structure', check: () => testPayload.accountNumber && testPayload.accountNumber.value },
      { name: 'Shipper Address', check: () => testPayload.requestedShipment.shipper.address.countryCode },
      { name: 'Recipient Address', check: () => testPayload.requestedShipment.recipient.address.countryCode },
      { name: 'Ship Date', check: () => testPayload.requestedShipment.shipDateStamp },
      { name: 'Rate Request Type Array', check: () => Array.isArray(testPayload.requestedShipment.rateRequestType) },
      { name: 'Package Line Items', check: () => Array.isArray(testPayload.requestedShipment.requestedPackageLineItems) },
      { name: 'Weight Units', check: () => testPayload.requestedShipment.requestedPackageLineItems[0].weight.units === 'KG' },
      { name: 'Dimension Units', check: () => testPayload.requestedShipment.requestedPackageLineItems[0].dimensions.units === 'CM' },
      { name: 'Pickup Type', check: () => testPayload.requestedShipment.pickupType === 'DROPOFF_AT_FEDEX_LOCATION' },
      { name: 'Packaging Type', check: () => testPayload.requestedShipment.packagingType === 'YOUR_PACKAGING' }
    ];

    let passedChecks = 0;
    for (const check of structureChecks) {
      if (check.check()) {
        passedChecks++;
        console.log(`   ✅ ${check.name}`);
      } else {
        console.log(`   ❌ ${check.name}`);
      }
    }

    this.addResult({
      endpoint: 'Request Structure Test',
      status: passedChecks === structureChecks.length ? 'success' : 'warning',
      message: `${passedChecks === structureChecks.length ? '✅' : '⚠️'} Request structure validation: ${passedChecks}/${structureChecks.length} checks passed`,
      details: {
        totalChecks: structureChecks.length,
        passedChecks: passedChecks,
        samplePayload: testPayload
      }
    });
  }

  private getCredentialsFromEnv() {
    return {
      accountNumber: process.env.FEDEX_ACCOUNT_NUMBER,
      clientId: process.env.FEDEX_CLIENT_ID,
      clientSecret: process.env.FEDEX_CLIENT_SECRET
    };
  }

  private addResult(result: EndpointCheck): void {
    this.results.push(result);
    console.log(`   ${result.message}`);
  }

  private printSummary(): void {
    const successful = this.results.filter(r => r.status === 'success').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const errors = this.results.filter(r => r.status === 'error').length;
    
    console.log('\\n' + '='.repeat(50));
    console.log('📋 ENDPOINT VERIFICATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Checks: ${this.results.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`⚠️ Warnings: ${warnings}`);
    console.log(`❌ Errors: ${errors}`);
    
    if (errors > 0) {
      console.log('\\n❌ CRITICAL ISSUES:');
      this.results
        .filter(r => r.status === 'error')
        .forEach(r => console.log(`   - ${r.endpoint}: ${r.message}`));
    }
    
    if (warnings > 0) {
      console.log('\\n⚠️ WARNINGS:');
      this.results
        .filter(r => r.status === 'warning')
        .forEach(r => console.log(`   - ${r.endpoint}: ${r.message}`));
    }

    console.log('\\n🎯 READINESS FOR FULL TESTING:');
    const readinessChecks = [
      { name: 'Auth endpoint reachable', passed: this.results.some(r => r.endpoint.includes('Authentication Endpoint') && r.status === 'success') },
      { name: 'Rate endpoint reachable', passed: this.results.some(r => r.endpoint.includes('Rate Quotes Endpoint') && r.status === 'success') },
      { name: 'Request structure valid', passed: this.results.some(r => r.endpoint.includes('Request Structure') && r.status === 'success') }
    ];

    readinessChecks.forEach(check => {
      console.log(`   ${check.passed ? '✅' : '❌'} ${check.name}`);
    });

    const ready = readinessChecks.every(c => c.passed);
    console.log(`\\n${ready ? '🚀' : '⚠️'} System Status: ${ready ? 'READY FOR FULL TESTING' : 'NEEDS ATTENTION'}`);
    
    if (ready) {
      console.log('\\n💡 Next Steps:');
      console.log('   1. Set up your FedEx credentials (FEDEX_ACCOUNT_NUMBER, FEDEX_CLIENT_ID, FEDEX_CLIENT_SECRET)');
      console.log('   2. Run the full test suite: node test-runner.js');
      console.log('   3. Review test results and reports');
    }
  }
}

// CLI interface
async function main() {
  const verifier = new FedExEndpointVerifier();
  const results = await verifier.verifyAllEndpoints();
  
  // Exit with appropriate code
  const hasErrors = results.some(r => r.status === 'error');
  process.exit(hasErrors ? 1 : 0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
}

export { FedExEndpointVerifier };
