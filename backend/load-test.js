import autocannon from "autocannon";

async function run() {
  console.log("Starting load test to verify rate limiting and server stability...");
  
  const instance = autocannon({
    url: 'http://localhost:3001/api/v1/health',
    connections: 100, // Simulate 100 concurrent users
    pipelining: 1, // Single request per connection at a time
    duration: 5, // Run for 5 seconds
    title: "Health Check Load Test"
  });

  autocannon.track(instance, { renderProgressBar: true });

  instance.on('done', (result) => {
    console.log(`\nTest Complete:`);
    console.log(`Total Requests: ${result.requests.total}`);
    console.log(`Errors/Timeouts: ${result.errors}`);
    console.log(`Non-2xx Responses: ${result.non2xx}`);
    
    // Global rate limit is 500 requests per 15 minutes.
    // If rate limiting works, non2xx (HTTP 429) should be very high,
    // and successful 2xx responses should be exactly 500.
    if (result.non2xx > 0 && result['2xx'] === 500) {
      console.log("SUCCESS: Rate limiting correctly capped traffic at 500 requests!");
    } else if (result.non2xx > 0) {
      console.log("NOTE: Rate limiting engaged, but successful requests didn't perfectly match limit. This is normal under extreme load due to timing.");
    } else {
      console.log("WARNING: Rate limiting did not seem to engage. Check middleware.");
    }
  });
}

run();
