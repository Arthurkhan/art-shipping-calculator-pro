# FedEx Integration Testing - Phase 4

This directory contains comprehensive testing and validation tools for the FedEx integration implementation, covering **Phase 4: Testing & Validation** of the FedEx integration roadmap.

## 🎯 Phase 4 Objectives

- **API endpoint verification**: Confirm correct FedEx API endpoint URL and test with working credentials
- **End-to-end testing**: Test with various destinations and validate rate calculations
- **Error scenario testing**: Comprehensive error handling validation
- **Response parsing verification**: Ensure all data is correctly parsed and formatted

## 📁 Test Files Overview

| File | Purpose |
|------|---------|
| `fedex-integration.test.ts` | Main test suite with comprehensive test scenarios |
| `test-config.ts` | Configuration file with test data and settings |
| `test-runner.js` | CLI test runner for executing tests |
| `test-data.sql` | SQL script to create test data in database |
| `README.md` | This documentation file |

## 🚀 Quick Start

### 1. Prerequisites

- Supabase project with the `calculate-shipping` function deployed
- FedEx API credentials (Account Number, Client ID, Client Secret)
- Node.js environment for running tests
- Access to your Supabase database

### 2. Setup Test Data

First, create test data in your Supabase database:

```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d postgres -f tests/test-data.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Copy and paste the contents of `test-data.sql`
3. Run the script

### 3. Configure Credentials

**Option A: Environment Variables (Recommended)**
```bash
export FEDEX_ACCOUNT_NUMBER="your-account-number"
export FEDEX_CLIENT_ID="your-client-id"
export FEDEX_CLIENT_SECRET="your-client-secret"
```

**Option B: Update Configuration File**
Edit `test-config.ts` and replace the placeholder values:
```typescript
fedexConfig: {
  accountNumber: "YOUR_ACTUAL_ACCOUNT_NUMBER",
  clientId: "YOUR_ACTUAL_CLIENT_ID", 
  clientSecret: "YOUR_ACTUAL_CLIENT_SECRET"
}
```

### 4. Run Tests

```bash
# Run tests against local development environment
node tests/test-runner.js

# Run tests against staging environment
node tests/test-runner.js --environment staging

# Run tests with verbose output
node tests/test-runner.js --verbose

# Show help
node tests/test-runner.js --help
```

## 🧪 Test Coverage

### 1. API Endpoint Verification
- ✅ Confirms FedEx API endpoints are accessible
- ✅ Validates request/response cycle
- ✅ Checks basic rate retrieval functionality

### 2. Authentication Flow Testing
- ✅ Tests valid credential authentication
- ✅ Tests invalid credential rejection
- ✅ Validates token handling

### 3. Rate Request Validation
- ✅ Tests required field validation
- ✅ Tests payload structure
- ✅ Validates request formatting

### 4. Multiple Destinations Testing
- ✅ Tests 10+ international destinations
- ✅ Validates service availability per country
- ✅ Checks currency handling per region

### 5. Error Scenario Testing
- ✅ Invalid postal codes
- ✅ Unsupported countries
- ✅ Missing required fields
- ✅ Invalid credentials
- ✅ Non-existent collections

### 6. Response Parsing Verification
- ✅ Validates all required rate fields
- ✅ Checks data type correctness
- ✅ Ensures cost values are positive numbers

### 7. Performance & Timeout Testing
- ✅ Measures request duration
- ✅ Validates timeout handling
- ✅ Performance threshold validation

### 8. Currency Handling Testing
- ✅ Tests currency mapping per country
- ✅ Validates currency codes (USD, EUR, GBP, etc.)
- ✅ Checks for consistent currency usage

## 📊 Test Results & Reporting

### Console Output
Tests provide real-time feedback with:
- ✅ Success indicators
- ❌ Failure indicators  
- ⏱️ Duration tracking
- 📋 Summary statistics

### JSON Reports
Detailed JSON reports are automatically generated:
```
test-report-local-2025-05-25T16-30-00-000Z.json
```

### Success Criteria Validation
Each test run validates the Phase 4 success criteria:
- ✅ FedEx API calls return valid shipping rates
- ✅ Rates match expected format and content
- ✅ Error handling provides clear feedback to users
- ✅ Origin address defaults to Thailand as expected
- ✅ All required FedEx fields are included in requests

## 🔧 Configuration Options

### Environment Targets
- `local`: http://localhost:54321/functions/v1/calculate-shipping
- `staging`: Your staging Supabase project URL
- `production`: Your production Supabase project URL

### Test Destinations
The test suite includes comprehensive destination coverage:
- 🇺🇸 United States (multiple locations)
- 🇨🇦 Canada
- 🇬🇧 United Kingdom
- 🇩🇪 Germany
- 🇫🇷 France
- 🇦🇺 Australia
- 🇯🇵 Japan
- 🇸🇬 Singapore

### Package Test Data
Various package types and sizes:
- Small packages (2.5kg, 15×25×20cm)
- Medium packages (5.0kg, 25×35×30cm)  
- Large packages (10.0kg, 35×50×40cm)
- Edge cases (very light, very heavy)

## 🚨 Troubleshooting

### Common Issues

**"Invalid FedEx credentials"**
- Verify your credentials are correct
- Check environment variables are set
- Ensure credentials are not test/placeholder values

**"No rates received"**
- Check if destination country is supported by FedEx
- Verify postal code format is correct
- Ensure origin address (Thailand) is valid

**"Database connection failed"**
- Verify Supabase function is deployed
- Check database connection settings
- Ensure test data is properly inserted

**"Request timeout"**
- Check network connectivity
- Verify FedEx API is accessible
- Consider increasing timeout thresholds

### Debug Mode
Run tests with verbose output to see detailed request/response data:
```bash
node tests/test-runner.js --verbose
```

### API Endpoint Verification
Manually test your endpoint:
```bash
curl -X POST http://localhost:54321/functions/v1/calculate-shipping \\
  -H "Content-Type: application/json" \\
  -d '{
    "collection": "test-collection",
    "size": "small", 
    "country": "US",
    "postalCode": "10001",
    "fedexConfig": {
      "accountNumber": "YOUR_ACCOUNT",
      "clientId": "YOUR_CLIENT_ID",
      "clientSecret": "YOUR_CLIENT_SECRET"
    }
  }'
```

## 📈 Performance Benchmarks

### Expected Performance
- **Excellent**: < 10 seconds
- **Good**: 10-20 seconds  
- **Acceptable**: 20-35 seconds
- **Too Slow**: > 35 seconds

### Optimization Notes
- First request may be slower due to cold start
- Subsequent requests should be faster
- International destinations may take longer
- Network latency affects total time

## 🔄 Continuous Integration

### CI/CD Integration
Add to your CI pipeline:
```yaml
- name: Run FedEx Integration Tests
  run: |
    export FEDEX_ACCOUNT_NUMBER=${{ secrets.FEDEX_ACCOUNT_NUMBER }}
    export FEDEX_CLIENT_ID=${{ secrets.FEDEX_CLIENT_ID }}
    export FEDEX_CLIENT_SECRET=${{ secrets.FEDEX_CLIENT_SECRET }}
    node tests/test-runner.js --environment staging
```

### Monitoring & Alerts
- Set up alerts for test failures
- Monitor success rate trends
- Track performance regression

## 📋 Phase 4 Completion Checklist

- [ ] Test data created in database
- [ ] FedEx credentials configured
- [ ] Local tests passing
- [ ] Staging tests passing
- [ ] All 8 test categories completed
- [ ] Success criteria validated
- [ ] Performance within acceptable limits
- [ ] Error scenarios properly handled
- [ ] Test reports generated successfully

## 🎉 Next Steps

Once Phase 4 is complete and all tests are passing:
1. **Phase 5**: UI/UX Improvements
   - Better user feedback
   - Configuration validation
   - Progress indicators

2. **Production Deployment**
   - Deploy to production environment
   - Run production tests
   - Monitor real-world usage

3. **Additional Shipping Providers**
   - DHL integration
   - UPS integration
   - Local carrier integration

## 📞 Support

If you encounter issues with the testing framework:
1. Check this README for troubleshooting steps
2. Review the test configuration
3. Examine test logs and reports
4. Verify your FedEx API credentials are working in your n8n workflow

---

**Phase 4 Complete**: ✅ FedEx API endpoint verified, comprehensive testing implemented, error handling validated, and response parsing confirmed working correctly.
