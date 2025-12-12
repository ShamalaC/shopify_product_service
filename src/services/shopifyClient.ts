import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { ShopifyGraphQLResponse, ShopifyProductNode } from '../types';

interface RateLimitState {
  available: number;
  restoreRate: number;
  maxAvailable: number;
  lastUpdate: number;
}

export class ShopifyClient {
  private client: AxiosInstance;
  private rateLimitState: RateLimitState = {
    available: 1000,
    restoreRate: 50,
    maxAvailable: 1000,
    lastUpdate: Date.now(),
  };

  constructor() {
    const shop = config.shopify.shop;
    const token = config.shopify.token;
    
    this.client = axios.create({
      baseURL: `https://${shop}/admin/api/${config.shopify.apiVersion}/graphql.json`,
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
    });
  }

  private updateRateLimit(extensions?: any): void {
    if (extensions?.cost?.throttleStatus) {
      const throttle = extensions.cost.throttleStatus;
      const now = Date.now();
      const timeSinceLastUpdate = now - this.rateLimitState.lastUpdate;
      
      const restored = Math.floor(
        (timeSinceLastUpdate / 1000) * this.rateLimitState.restoreRate
      );
      
      this.rateLimitState.available = Math.min(
        throttle.currentlyAvailable + restored,
        throttle.maximumAvailable
      );
      this.rateLimitState.restoreRate = throttle.restoreRate;
      this.rateLimitState.maxAvailable = throttle.maximumAvailable;
      this.rateLimitState.lastUpdate = now;
    }
  }

  private async waitForRateLimit(): Promise<void> {
    if (this.rateLimitState.available < 1) {
      const waitTime = Math.ceil(
        (1 - this.rateLimitState.available) / this.rateLimitState.restoreRate * 1000
      );
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  async query<T>(query: string, variables?: any): Promise<ShopifyGraphQLResponse<T>> {
    await this.waitForRateLimit();

    const startTime = Date.now();
    try {
      const response = await this.client.post<ShopifyGraphQLResponse<T>>('', {
        query,
        variables,
      });

      const endTime = Date.now();
      const latency = endTime - startTime;

      this.updateRateLimit(response.data.extensions);

      if (typeof global !== 'undefined' && global.statsService) {
        global.statsService.recordShopifyCall(latency);
      }

      if (response.data.extensions?.cost) {
        const cost = response.data.extensions.cost.actualQueryCost;
        this.rateLimitState.available -= cost;
      }

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = parseInt(
          error.response.headers['retry-after'] || '1',
          10
        );
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return this.query<T>(query, variables);
      }
      throw error;
    }
  }

  async getProducts(limit: number = 10, cursor?: string): Promise<{
    products: ShopifyProductNode[];
    hasNextPage: boolean;
    nextCursor?: string;
  }> {
    const query = `
      query getProducts($first: Int!, $after: String) {
        products(first: $first, after: $after, sortKey: TITLE) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              createdAt
              variants(first: 1) {
                edges {
                  node {
                    price
                    inventoryQuantity
                  }
                }
              }
            }
          }
        }
      }
    `;

    const variables: any = { first: limit };
    if (cursor) {
      variables.after = cursor;
    }

    const response = await this.query<{
      products: {
        pageInfo: {
          hasNextPage: boolean;
          endCursor?: string;
        };
        edges: Array<{
          node: ShopifyProductNode;
        }>;
      };
    }>(query, variables);

    return {
      products: response.data.products.edges.map(edge => edge.node),
      hasNextPage: response.data.products.pageInfo.hasNextPage,
      nextCursor: response.data.products.pageInfo.endCursor || undefined,
    };
  }

  async getProductById(id: string): Promise<ShopifyProductNode | null> {
    const query = `
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          createdAt
          variants(first: 1) {
            edges {
              node {
                price
                inventoryQuantity
              }
            }
          }
        }
      }
    `;

    const response = await this.query<{
      product: ShopifyProductNode | null;
    }>(query, { id });

    return response.data.product;
  }
}

