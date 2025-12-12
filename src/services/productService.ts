import { ShopifyClient } from './shopifyClient';
import { CacheService } from './cacheService';
import { Product, ProductResponse } from '../types';

export class ProductService {
  constructor(
    private shopifyClient: ShopifyClient,
    private cacheService: CacheService
  ) {}

  private transformProduct(shopifyProduct: any): Product {
    const variant = shopifyProduct.variants?.edges?.[0]?.node;
    const price = variant?.price ? parseFloat(variant.price) : 0;
    const inventory = variant?.inventoryQuantity || 0;

    return {
      id: shopifyProduct.id,
      title: shopifyProduct.title,
      price,
      inventory,
      created_at: shopifyProduct.createdAt,
    };
  }

  async getProducts(limit: number = 10, cursor?: string): Promise<ProductResponse> {
    const cacheKey = `products:${limit}:${cursor || 'first'}`;
    
    const cached = await this.cacheService.get<ProductResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.shopifyClient.getProducts(limit, cursor);
    
    const products = result.products.map(p => this.transformProduct(p));
    const response: ProductResponse = {
      products,
      next_page: result.hasNextPage ? result.nextCursor : undefined,
    };

    await this.cacheService.set(cacheKey, response);

    return response;
  }

  async getProductById(id: string): Promise<Product | null> {
    const cacheKey = `product:${id}`;
    
    const cached = await this.cacheService.get<Product>(cacheKey);
    if (cached) {
      return cached;
    }

    const shopifyProduct = await this.shopifyClient.getProductById(id);
    if (!shopifyProduct) {
      return null;
    }

    const product = this.transformProduct(shopifyProduct);
    await this.cacheService.set(cacheKey, product);

    return product;
  }
}




