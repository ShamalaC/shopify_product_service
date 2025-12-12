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

export interface ShopifyProductNode {
  id: string;
  title: string;
  createdAt: string;
  variants: {
    edges: Array<{
      node: {
        price: string;
        inventoryQuantity: number;
      };
    }>;
  };
}

export interface ShopifyGraphQLResponse<T> {
  data: T;
  extensions?: {
    cost?: {
      requestedQueryCost: number;
      actualQueryCost: number;
      throttleStatus: {
        maximumAvailable: number;
        currentlyAvailable: number;
        restoreRate: number;
      };
    };
  };
}



