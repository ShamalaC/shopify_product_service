import axios, { AxiosInstance } from 'axios';
import { Product, ProductResponse, ProductStats } from './types';

export class ShopifyProductSDK {
  private client: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:3000') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getProducts(limit?: number, cursor?: string): Promise<ProductResponse> {
    const params: any = {};
    if (limit !== undefined) {
      params.limit = limit;
    }
    if (cursor) {
      params.cursor = cursor;
    }

    const response = await this.client.get<Product[]>('/products', { params });
    
    const nextPage = (response.headers['x-next-page'] || response.headers['X-Next-Page']) as string | undefined;
    
    return {
      products: response.data,
      next_page: nextPage,
    };
  }

  async getProductById(id: string): Promise<Product> {
    const response = await this.client.get<Product>(`/products/${encodeURIComponent(id)}`);
    return response.data;
  }

  async getStats(): Promise<ProductStats> {
    const response = await this.client.get<ProductStats>('/api-stats');
    return response.data;
  }
}

export { Product, ProductResponse, ProductStats };

export default ShopifyProductSDK;

