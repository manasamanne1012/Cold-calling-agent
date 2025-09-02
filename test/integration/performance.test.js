/**
 * Performance tests for the AI Cold Call Agent Website
 */
const autocannon = require('autocannon');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

describe('Performance Tests', function() {
  // Increase timeout for performance tests
  this.timeout(30000);
  
  // Path to store test results
  const resultsDir = path.join(__dirname, '../logs/performance');
  
  // Create directory if it doesn't exist
  before(() => {
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
  });
  
  it('should handle multiple concurrent requests to the homepage', (done) => {
    const instance = autocannon({
      url: 'http://localhost:3000',
      connections: 100, // Number of concurrent connections
      duration: 10,     // Duration of the test in seconds
      requests: [
        {
          method: 'GET',
          path: '/'
        }
      ]
    }, finishedBenchmark);
    
    // Generate test results JSON file when complete
    function finishedBenchmark(err, results) {
      if (err) {
        console.error('Error running benchmark:', err);
        return done(err);
      }
      
      // Save results to file
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const resultsFile = path.join(resultsDir, `homepage-${timestamp}.json`);
      fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
      
      // Verify performance expectations
      expect(results.errors).to.equal(0, 'Should have no errors');
      expect(results.timeouts).to.equal(0, 'Should have no timeouts');
      expect(results.non2xx).to.equal(0, 'All responses should be 2xx');
      expect(results.latency.p99).to.be.below(1000, 'p99 latency should be under 1000ms');
      
      console.log(`Performance test results saved to ${resultsFile}`);
      done();
    }
    
    // Track progress
    autocannon.track(instance, { renderProgressBar: true });
  });
  
  it('should handle concurrent API requests efficiently', (done) => {
    const instance = autocannon({
      url: 'http://localhost:3000',
      connections: 50, // Number of concurrent connections
      duration: 10,    // Duration of the test in seconds
      requests: [
        {
          method: 'GET',
          path: '/api/contacts'
        },
        {
          method: 'GET',
          path: '/api/stats'
        },
        {
          method: 'GET',
          path: '/api/health'
        }
      ]
    }, finishedBenchmark);
    
    // Generate test results JSON file when complete
    function finishedBenchmark(err, results) {
      if (err) {
        console.error('Error running benchmark:', err);
        return done(err);
      }
      
      // Save results to file
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const resultsFile = path.join(resultsDir, `api-${timestamp}.json`);
      fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
      
      // Verify performance expectations
      expect(results.errors).to.equal(0, 'Should have no errors');
      expect(results.timeouts).to.equal(0, 'Should have no timeouts');
      expect(results.latency.average).to.be.below(300, 'Average latency should be under 300ms');
      
      console.log(`API performance test results saved to ${resultsFile}`);
      done();
    }
    
    // Track progress
    autocannon.track(instance, { renderProgressBar: true });
  });
  
  it('should handle workflow trigger requests under load', (done) => {
    // Sample contact data for the request
    const sampleContact = {
      name: 'Performance Test',
      industry: 'Technology',
      status: 'Pending'
    };
    
    const instance = autocannon({
      url: 'http://localhost:3000/api/trigger-workflow',
      connections: 20, // Fewer connections as this is a more intensive operation
      duration: 10,    // Duration of the test in seconds
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(sampleContact)
    }, finishedBenchmark);
    
    // Generate test results JSON file when complete
    function finishedBenchmark(err, results) {
      if (err) {
        console.error('Error running benchmark:', err);
        return done(err);
      }
      
      // Save results to file
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const resultsFile = path.join(resultsDir, `workflow-trigger-${timestamp}.json`);
      fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
      
      // More lenient expectations for this endpoint as it involves external APIs
      expect(results.errors).to.equal(0, 'Should have no errors');
      expect(results.latency.p99).to.be.below(3000, 'p99 latency should be under 3000ms');
      
      console.log(`Workflow trigger performance test results saved to ${resultsFile}`);
      done();
    }
    
    // Track progress
    autocannon.track(instance, { renderProgressBar: true });
  });
});
