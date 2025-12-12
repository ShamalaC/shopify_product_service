export class StatsService {
  private endpointLatencies: number[] = [];
  private shopifyCallLatencies: number[] = [];
  private totalEndpointCalls = 0;
  private totalShopifyCalls = 0;

  recordEndpointCall(latency: number): void {
    this.endpointLatencies.push(latency);
    this.totalEndpointCalls++;
    
    if (this.endpointLatencies.length > 1000) {
      this.endpointLatencies.shift();
    }
  }

  recordShopifyCall(latency: number): void {
    this.shopifyCallLatencies.push(latency);
    this.totalShopifyCalls++;
    
    if (this.shopifyCallLatencies.length > 1000) {
      this.shopifyCallLatencies.shift();
    }
  }

  getStats() {
    const calculateStats = (latencies: number[]) => {
      if (latencies.length === 0) {
        return { average: 0, max: 0, min: 0 };
      }
      
      const sum = latencies.reduce((a, b) => a + b, 0);
      return {
        average: Math.round(sum / latencies.length),
        max: Math.max(...latencies),
        min: Math.min(...latencies),
      };
    };

    return {
      endpoint_response_times_ms: calculateStats(this.endpointLatencies),
      total_endpoint_calls: this.totalEndpointCalls,
      average_shopify_call_responsetime_ms: 
        this.shopifyCallLatencies.length > 0
          ? Math.round(
              this.shopifyCallLatencies.reduce((a, b) => a + b, 0) /
                this.shopifyCallLatencies.length
            )
          : 0,
      total_shopify_api_calls: this.totalShopifyCalls,
    };
  }

  reset(): void {
    this.endpointLatencies = [];
    this.shopifyCallLatencies = [];
    this.totalEndpointCalls = 0;
    this.totalShopifyCalls = 0;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var statsService: StatsService;
}

if (!global.statsService) {
  global.statsService = new StatsService();
}

