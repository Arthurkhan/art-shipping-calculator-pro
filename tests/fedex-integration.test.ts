/**
 * FedEx Integration Test Suite - Phase 4 Implementation
 * Comprehensive testing for FedEx API endpoint verification and validation
 */

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
  details?: unknown;
}

interface TestConfig {
  fedexConfig: {
    accountNumber: string;
    clientId: string;
    clientSecret: string;
  };
  testDestinations: Array<{
    name: string;
    country: string;
    postalCode: string;
    expectedServices?: string[];
  }>;
  testCollections: Array<{
    collection: string;
    size: string;
    weight_kg: number;
    height_cm: number;
    length_cm: number;
    width_cm: number;
  }>;
}

interface ApiResponse {
  success: boolean;
  rates?: Array<{
    service: string;
    cost: number;
    currency: string;
    transitTime: string;
    deliveryDate?: string;
  }>;
  error?: string;
  errorType?: string;
}

class FedExIntegrationTester {
  private config: TestConfig;
  private results: TestResult[] = [];
  private baseUrl: string;

  constructor(config: TestConfig, baseUrl: string = 'http://localhost:54321/functions/v1/calculate-shipping') {
    this.config = config;
    this.baseUrl = baseUrl;
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Starting FedEx Integration Tests - Phase 4');
    console.log('=' * 60);

    // Test 1: API Endpoint Verification
    await this.testApiEndpointVerification();
    
    // Test 2: Authentication Flow
    await this.testAuthenticationFlow();
    
    // Test 3: Rate Request Validation
    await this.testRateRequestValidation();
    
    // Test 4: Multiple Destinations
    await this.testMultipleDestinations();
    
    // Test 5: Error Scenarios
    await this.testErrorScenarios();
    
    // Test 6: Response Parsing
    await this.testResponseParsing();
    
    // Test 7: Performance and Timeout
    await this.testPerformanceAndTimeout();
    
    // Test 8: Currency Handling
    await this.testCurrencyHandling();

    this.printTestSummary();
    return this.results;
  }

  private async testApiEndpointVerification(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('\n📍 Test 1: API Endpoint Verification');
      
      // Test with a simple US domestic shipment
      const testPayload = {
        collection: 'test-collection',
        size: 'small',
        country: 'US',
        postalCode: '10001',
        originCountry: 'TH',
        originPostalCode: '10240',
        fedexConfig: this.config.fedexConfig
      };

      const response = await this.makeRequest(testPayload);
      
      if (response.success && response.rates && response.rates.length > 0) {
        this.addResult({
          name: 'API Endpoint Verification',
          passed: true,
          message: `✅ FedEx API endpoint responding correctly. Received ${response.rates.length} rates.`,
          duration: Date.now() - startTime,
          details: {
            endpoint: this.baseUrl,
            ratesReceived: response.rates.length,
            firstRate: response.rates[0]
          }
        });
      } else {
        this.addResult({
          name: 'API Endpoint Verification',
          passed: false,
          message: '❌ FedEx API endpoint not returning valid rates',
          duration: Date.now() - startTime,
          details: response
        });
      }
    } catch (error) {
      this.addResult({
        name: 'API Endpoint Verification',
        passed: false,
        message: `❌ API endpoint verification failed: ${error instanceof Error ? error.message : String(error)}`,
        duration: Date.now() - startTime,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  private async testAuthenticationFlow(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('\n🔐 Test 2: Authentication Flow');
      
      // Test with invalid credentials
      const invalidConfig = {
        ...this.config.fedexConfig,
        clientSecret: 'invalid-secret'
      };

      const testPayload = {
        collection: 'test-collection',
        size: 'small',
        country: 'US',
        postalCode: '10001',
        fedexConfig: invalidConfig
      };

      const response = await this.makeRequest(testPayload);
      
      if (!response.success && response.errorType === 'AUTHENTICATION') {
        this.addResult({
          name: 'Authentication Flow - Invalid Credentials',
          passed: true,
          message: '✅ Authentication properly rejects invalid credentials',
          duration: Date.now() - startTime,
          details: response
        });
      } else {
        this.addResult({
          name: 'Authentication Flow - Invalid Credentials',
          passed: false,
          message: '❌ Authentication did not properly reject invalid credentials',
          duration: Date.now() - startTime,
          details: response
        });
      }

      // Test with valid credentials
      const validTestPayload = {
        collection: 'test-collection',
        size: 'small',
        country: 'US',
        postalCode: '10001',
        fedexConfig: this.config.fedexConfig
      };

      const validResponse = await this.makeRequest(validTestPayload);
      
      if (validResponse.success) {
        this.addResult({
          name: 'Authentication Flow - Valid Credentials',
          passed: true,
          message: '✅ Authentication succeeds with valid credentials',
          duration: Date.now() - startTime,
          details: { ratesReceived: validResponse.rates?.length || 0 }
        });
      } else {
        this.addResult({
          name: 'Authentication Flow - Valid Credentials',
          passed: false,
          message: '❌ Authentication failed with valid credentials',
          duration: Date.now() - startTime,
          details: validResponse
        });
      }

    } catch (error) {
      this.addResult({
        name: 'Authentication Flow',
        passed: false,
        message: `❌ Authentication flow test failed: ${error instanceof Error ? error.message : String(error)}`,
        duration: Date.now() - startTime,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  private async testRateRequestValidation(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('\n📦 Test 3: Rate Request Validation');
      
      // Test payload structure validation
      const testCases = [
        {
          name: 'Missing Collection',
          payload: {
            size: 'small',
            country: 'US',
            postalCode: '10001',
            fedexConfig: this.config.fedexConfig
          },
          shouldFail: true
        },
        {
          name: 'Missing Size',
          payload: {
            collection: 'test-collection',
            country: 'US',
            postalCode: '10001',
            fedexConfig: this.config.fedexConfig
          },
          shouldFail: true
        },
        {
          name: 'Missing Country',
          payload: {
            collection: 'test-collection',
            size: 'small',
            postalCode: '10001',
            fedexConfig: this.config.fedexConfig
          },
          shouldFail: true
        },
        {
          name: 'Complete Valid Payload',
          payload: {
            collection: 'test-collection',
            size: 'small',
            country: 'US',
            postalCode: '10001',
            fedexConfig: this.config.fedexConfig
          },
          shouldFail: false
        }
      ];

      for (const testCase of testCases) {
        const response = await this.makeRequest(testCase.payload);
        
        const passed = testCase.shouldFail ? !response.success : response.success;
        
        this.addResult({
          name: `Rate Request Validation - ${testCase.name}`,
          passed,
          message: passed 
            ? `✅ ${testCase.name} validation works correctly`
            : `❌ ${testCase.name} validation failed`,
          duration: Date.now() - startTime,
          details: { testCase: testCase.name, response }
        });
      }

    } catch (error) {
      this.addResult({
        name: 'Rate Request Validation',
        passed: false,
        message: `❌ Rate request validation test failed: ${error instanceof Error ? error.message : String(error)}`,
        duration: Date.now() - startTime,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  private async testMultipleDestinations(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('\n🌍 Test 4: Multiple Destinations');
      
      for (const destination of this.config.testDestinations) {
        const testPayload = {
          collection: 'test-collection',
          size: 'medium',
          country: destination.country,
          postalCode: destination.postalCode,
          fedexConfig: this.config.fedexConfig
        };

        const response = await this.makeRequest(testPayload);
        
        let passed = false;
        let message = '';
        
        if (response.success && response.rates && response.rates.length > 0) {
          passed = true;
          message = `✅ ${destination.name}: Received ${response.rates.length} rates`;
          
          // Check if expected services are available (if specified)
          if (destination.expectedServices) {
            const receivedServices = response.rates.map(r => r.service);
            const hasExpectedServices = destination.expectedServices.some(service => 
              receivedServices.some(received => received.includes(service))
            );
            
            if (!hasExpectedServices) {
              passed = false;
              message = `❌ ${destination.name}: Expected services not found. Got: ${receivedServices.join(', ')}`;
            }
          }
        } else {
          message = `❌ ${destination.name}: No rates received`;
        }

        this.addResult({
          name: `Multiple Destinations - ${destination.name}`,
          passed,
          message,
          duration: Date.now() - startTime,
          details: {
            destination,
            ratesReceived: response.rates?.length || 0,
            services: response.rates?.map(r => r.service) || []
          }
        });
      }

    } catch (error) {
      this.addResult({
        name: 'Multiple Destinations',
        passed: false,
        message: `❌ Multiple destinations test failed: ${error instanceof Error ? error.message : String(error)}`,
        duration: Date.now() - startTime,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  private async testErrorScenarios(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('\n⚠️ Test 5: Error Scenarios');
      
      const errorTestCases = [
        {
          name: 'Invalid Postal Code',
          payload: {
            collection: 'test-collection',
            size: 'small',
            country: 'US',
            postalCode: 'INVALID',
            fedexConfig: this.config.fedexConfig
          },
          expectedErrorType: 'VALIDATION'
        },
        {
          name: 'Invalid Country Code',
          payload: {
            collection: 'test-collection',
            size: 'small',
            country: 'XX',
            postalCode: '10001',
            fedexConfig: this.config.fedexConfig
          },
          expectedErrorType: 'VALIDATION'
        },
        {
          name: 'Non-existent Collection',
          payload: {
            collection: 'non-existent-collection',
            size: 'small',
            country: 'US',
            postalCode: '10001',
            fedexConfig: this.config.fedexConfig
          },
          expectedErrorType: 'VALIDATION'
        }
      ];

      for (const errorCase of errorTestCases) {
        const response = await this.makeRequest(errorCase.payload);
        
        const passed = !response.success && 
          (response.errorType === errorCase.expectedErrorType || response.error);
        
        this.addResult({
          name: `Error Scenarios - ${errorCase.name}`,
          passed,
          message: passed 
            ? `✅ ${errorCase.name}: Error handled correctly`
            : `❌ ${errorCase.name}: Error not handled as expected`,
          duration: Date.now() - startTime,
          details: {
            expectedErrorType: errorCase.expectedErrorType,
            actualResponse: response
          }
        });
      }

    } catch (error) {
      this.addResult({
        name: 'Error Scenarios',
        passed: false,
        message: `❌ Error scenarios test failed: ${error instanceof Error ? error.message : String(error)}`,
        duration: Date.now() - startTime,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  private async testResponseParsing(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('\n📊 Test 6: Response Parsing');
      
      const testPayload = {
        collection: 'test-collection',
        size: 'large',
        country: 'US',
        postalCode: '90210',
        fedexConfig: this.config.fedexConfig
      };

      const response = await this.makeRequest(testPayload);
      
      if (response.success && response.rates) {
        let allFieldsPresent = true;
        const missingFields: string[] = [];
        
        for (const rate of response.rates) {
          const requiredFields = ['service', 'cost', 'currency', 'transitTime'];
          
          for (const field of requiredFields) {
            if (!(field in rate) || rate[field] === null || rate[field] === undefined) {
              allFieldsPresent = false;
              missingFields.push(`${field} in ${rate.service || 'unknown service'}`);
            }
          }
          
          // Validate data types
          if (typeof rate.cost !== 'number' || rate.cost <= 0) {
            allFieldsPresent = false;
            missingFields.push(`Invalid cost value: ${rate.cost}`);
          }
        }

        this.addResult({
          name: 'Response Parsing - Field Validation',
          passed: allFieldsPresent,
          message: allFieldsPresent 
            ? `✅ All required fields present in ${response.rates.length} rates`
            : `❌ Missing fields: ${missingFields.join(', ')}`,
          duration: Date.now() - startTime,
          details: {
            ratesAnalyzed: response.rates.length,
            missingFields: missingFields,
            sampleRate: response.rates[0]
          }
        });
      } else {
        this.addResult({
          name: 'Response Parsing',
          passed: false,
          message: '❌ No rates to parse',
          duration: Date.now() - startTime,
          details: response
        });
      }

    } catch (error) {
      this.addResult({
        name: 'Response Parsing',
        passed: false,
        message: `❌ Response parsing test failed: ${error instanceof Error ? error.message : String(error)}`,
        duration: Date.now() - startTime,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  private async testPerformanceAndTimeout(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('\n⏱️ Test 7: Performance and Timeout');
      
      const testPayload = {
        collection: 'test-collection',
        size: 'medium',
        country: 'GB',
        postalCode: 'SW1A 1AA',
        fedexConfig: this.config.fedexConfig
      };

      const requestStartTime = Date.now();
      const response = await this.makeRequest(testPayload);
      const requestDuration = Date.now() - requestStartTime;
      
      // Performance thresholds
      const maxAcceptableTime = 30000; // 30 seconds
      const goodPerformanceTime = 15000; // 15 seconds
      
      let performanceGrade = '';
      let performancePassed = false;
      
      if (requestDuration <= goodPerformanceTime) {
        performanceGrade = 'Excellent';
        performancePassed = true;
      } else if (requestDuration <= maxAcceptableTime) {
        performanceGrade = 'Acceptable';
        performancePassed = true;
      } else {
        performanceGrade = 'Too Slow';
        performancePassed = false;
      }

      this.addResult({
        name: 'Performance and Timeout',
        passed: performancePassed && response.success,
        message: `${performancePassed ? '✅' : '❌'} Request completed in ${requestDuration}ms (${performanceGrade})`,
        duration: Date.now() - startTime,
        details: {
          requestDuration,
          performanceGrade,
          thresholds: {
            good: goodPerformanceTime,
            max: maxAcceptableTime
          },
          response: response.success
        }
      });

    } catch (error) {
      this.addResult({
        name: 'Performance and Timeout',
        passed: false,
        message: `❌ Performance test failed: ${error instanceof Error ? error.message : String(error)}`,
        duration: Date.now() - startTime,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  private async testCurrencyHandling(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('\n💱 Test 8: Currency Handling');
      
      const currencyTests = [
        { country: 'US', expectedCurrency: 'USD', name: 'United States' },
        { country: 'CA', expectedCurrency: 'CAD', name: 'Canada' },
        { country: 'GB', expectedCurrency: 'GBP', name: 'United Kingdom' },
        { country: 'DE', expectedCurrency: 'EUR', name: 'Germany' },
        { country: 'JP', expectedCurrency: 'JPY', name: 'Japan' },
        { country: 'AU', expectedCurrency: 'AUD', name: 'Australia' }
      ];

      for (const currencyTest of currencyTests) {
        const testPayload = {
          collection: 'test-collection',
          size: 'small',
          country: currencyTest.country,
          postalCode: '12345',
          fedexConfig: this.config.fedexConfig
        };

        const response = await this.makeRequest(testPayload);
        
        if (response.success && response.rates && response.rates.length > 0) {
          const currencies = [...new Set(response.rates.map(r => r.currency))];
          const hasExpectedCurrency = currencies.includes(currencyTest.expectedCurrency);
          
          this.addResult({
            name: `Currency Handling - ${currencyTest.name}`,
            passed: hasExpectedCurrency,
            message: hasExpectedCurrency 
              ? `✅ ${currencyTest.name}: Correct currency (${currencyTest.expectedCurrency})`
              : `❌ ${currencyTest.name}: Expected ${currencyTest.expectedCurrency}, got ${currencies.join(', ')}`,
            duration: Date.now() - startTime,
            details: {
              expectedCurrency: currencyTest.expectedCurrency,
              receivedCurrencies: currencies,
              ratesCount: response.rates.length
            }
          });
        } else {
          this.addResult({
            name: `Currency Handling - ${currencyTest.name}`,
            passed: false,
            message: `❌ ${currencyTest.name}: No rates received to test currency`,
            duration: Date.now() - startTime,
            details: response
          });
        }
      }

    } catch (error) {
      this.addResult({
        name: 'Currency Handling',
        passed: false,
        message: `❌ Currency handling test failed: ${error instanceof Error ? error.message : String(error)}`,
        duration: Date.now() - startTime,
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  private async makeRequest(payload: Record<string, unknown>): Promise<ApiResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    return await response.json() as ApiResponse;
  }

  private addResult(result: TestResult): void {
    this.results.push(result);
    console.log(`   ${result.message} (${result.duration}ms)`);
  }

  private printTestSummary(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n' + '=' * 60);
    console.log('📋 TEST SUMMARY');
    console.log('=' * 60);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    
    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => console.log(`   - ${r.name}: ${r.message}`));
    }

    console.log('\n✅ SUCCESS CRITERIA VALIDATION:');
    const successCriteria = [
      { name: 'FedEx API calls return valid shipping rates', passed: this.hasPassingTest('API Endpoint Verification') },
      { name: 'Authentication works with valid credentials', passed: this.hasPassingTest('Authentication Flow - Valid Credentials') },
      { name: 'Error handling provides clear feedback', passed: this.hasPassingTest('Error Scenarios') },
      { name: 'Response parsing works correctly', passed: this.hasPassingTest('Response Parsing') },
      { name: 'Multiple destinations work', passed: this.hasPassingTest('Multiple Destinations') }
    ];

    successCriteria.forEach(criteria => {
      console.log(`   ${criteria.passed ? '✅' : '❌'} ${criteria.name}`);
    });

    const overallSuccess = successCriteria.every(c => c.passed);
    console.log(`\n${overallSuccess ? '🎉' : '⚠️'} Overall Status: ${overallSuccess ? 'PHASE 4 COMPLETE' : 'NEEDS ATTENTION'}`);
  }

  private hasPassingTest(testNamePattern: string): boolean {
    return this.results.some(r => r.name.includes(testNamePattern) && r.passed);
  }
}

// Export for use in test runner
export { FedExIntegrationTester, TestConfig, TestResult };
