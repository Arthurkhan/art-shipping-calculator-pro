#!/usr/bin/env node

/**
 * FedEx Integration Test Runner - Phase 4 Implementation
 * Executes comprehensive testing and validation for FedEx API integration
 */

import { FedExIntegrationTester } from './fedex-integration.test.js';
import { getTestConfig, validateFedexCredentials } from './test-config.js';

/**
 * @typedef {Object} TestRunnerOptions
 * @property {'local' | 'staging' | 'production'} [environment]
 * @property {string} [suiteFilter]
 * @property {boolean} [verbose]
 * @property {Object} [credentials]
 * @property {string} [credentials.accountNumber]
 * @property {string} [credentials.clientId]
 * @property {string} [credentials.clientSecret]
 */

class TestRunner {
  /**
   * @param {TestRunnerOptions} options
   */
  constructor(options = {}) {
    this.options = {
      environment: 'local',
      verbose: false,
      ...options
    };
  }

  async run() {
    console.log('🚀 FedEx Integration Test Runner - Phase 4');
    console.log('================================================');

    try {
      // Load test configuration
      const config = getTestConfig(this.options.environment);
      
      // Override credentials if provided
      if (this.options.credentials) {
        config.fedexConfig = this.options.credentials;
      }

      // Validate credentials
      if (!validateFedexCredentials(config.fedexConfig)) {
        console.error('❌ Invalid FedEx credentials detected!');
        console.error('Please update test-config.ts or provide credentials via environment variables.');
        console.error('');
        console.error('Required environment variables:');
        console.error('  FEDEX_ACCOUNT_NUMBER');
        console.error('  FEDEX_CLIENT_ID');
        console.error('  FEDEX_CLIENT_SECRET');
        console.error('');
        console.error('Or update the fedexConfig in test-config.ts with your actual credentials.');
        process.exit(1);
      }

      // Set target endpoint
      const targetEndpoint = config.endpoints[this.options.environment || 'local'];
      
      console.log(`🎯 Target Environment: ${this.options.environment}`);
      console.log(`📡 Endpoint: ${targetEndpoint}`);
      console.log(`📦 Test Destinations: ${config.testDestinations.length}`);
      console.log(`🧪 Test Collections: ${config.testCollections.length}`);
      console.log('');

      // Create and run tests
      const tester = new FedExIntegrationTester(config, targetEndpoint);
      const results = await tester.runAllTests();

      // Generate test report
      await this.generateTestReport(results);

      // Exit with appropriate code
      const allPassed = results.every(r => r.passed);
      process.exit(allPassed ? 0 : 1);

    } catch (error) {
      console.error('❌ Test runner failed:', error.message);
      if (this.options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * @param {Array} results
   */
  async generateTestReport(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFilename = `test-report-${this.options.environment}-${timestamp}.json`;

    const report = {
      timestamp: new Date().toISOString(),
      environment: this.options.environment,
      phase: 'Phase 4 - Testing & Validation',
      totalTests: results.length,
      passedTests: results.filter(r => r.passed).length,
      failedTests: results.filter(r => !r.passed).length,
      successRate: (results.filter(r => r.passed).length / results.length * 100).toFixed(1),
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
      results: results,
      successCriteria: {
        apiEndpointWorking: results.some(r => r.name.includes('API Endpoint Verification') && r.passed),
        authenticationWorking: results.some(r => r.name.includes('Authentication Flow - Valid Credentials') && r.passed),
        errorHandlingWorking: results.some(r => r.name.includes('Error Scenarios') && r.passed),
        responseParsingWorking: results.some(r => r.name.includes('Response Parsing') && r.passed),
        multipleDestinationsWorking: results.some(r => r.name.includes('Multiple Destinations') && r.passed)
      }
    };

    try {
      const fs = await import('fs');
      await fs.promises.writeFile(reportFilename, JSON.stringify(report, null, 2));
      console.log(`📊 Test report saved: ${reportFilename}`);
    } catch (error) {
      console.warn('⚠️ Could not save test report:', error.message);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  /** @type {TestRunnerOptions} */
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--environment':
      case '-e':
        options.environment = args[++i];
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  // Load credentials from environment variables if available
  const envCredentials = {
    accountNumber: process.env.FEDEX_ACCOUNT_NUMBER,
    clientId: process.env.FEDEX_CLIENT_ID,
    clientSecret: process.env.FEDEX_CLIENT_SECRET
  };

  if (envCredentials.accountNumber && envCredentials.clientId && envCredentials.clientSecret) {
    options.credentials = envCredentials;
    console.log('✅ Using FedEx credentials from environment variables');
  }

  const runner = new TestRunner(options);
  await runner.run();
}

function printHelp() {
  console.log(`\nFedEx Integration Test Runner - Phase 4

Usage: node test-runner.js [options]

Options:
  -e, --environment <env>   Target environment (local, staging, production) [default: local]
  -v, --verbose            Enable verbose output
  -h, --help               Show this help message

Environment Variables:
  FEDEX_ACCOUNT_NUMBER     FedEx account number
  FEDEX_CLIENT_ID          FedEx API client ID
  FEDEX_CLIENT_SECRET      FedEx API client secret

Examples:
  node test-runner.js                           # Run tests locally
  node test-runner.js -e staging                # Run tests against staging
  node test-runner.js -e production -v          # Run tests against production with verbose output

Prerequisites:
  1. Ensure your Supabase function is deployed and running
  2. Configure FedEx credentials either in test-config.ts or via environment variables
  3. Ensure the collection_sizes table has test data

Test Coverage:
  ✅ API endpoint verification
  ✅ Authentication flow testing
  ✅ Rate request validation
  ✅ Multiple destination testing
  ✅ Error scenario validation
  ✅ Response parsing verification
  ✅ Performance and timeout testing
  ✅ Currency handling validation

Success Criteria (Phase 4):
  ✅ FedEx API calls return valid shipping rates
  ✅ Rates match those from working n8n workflow
  ✅ Error handling provides clear feedback to users
  ✅ Origin address defaults to Thailand as expected
  ✅ All required FedEx fields are included in requests
`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

export { TestRunner };
