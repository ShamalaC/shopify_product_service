export interface Product {
  id: string;
  title: string;
  price: number;
  inventory: number;
  created_at: string;
}

export interface ProductResponse {
  products: Product[];
  next_page?: string;
}

export interface ProductStats {
  endpoint_response_times_ms: {
    average: number;
    max: number;
    min: number;
  };
  total_endpoint_calls: number;
  average_shopify_call_responsetime_ms: number;
  total_shopify_api_calls: number;
}




