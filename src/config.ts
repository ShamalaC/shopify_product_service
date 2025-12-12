import dotenv from 'dotenv';

dotenv.config();

export const config = {
  shopify: {
    shop: process.env.SHOPIFY_SHOP || 'luckyorange-interview-test.myshopify.com',
    token: process.env.SHOPIFY_TOKEN || '<token-value>',
    apiVersion: '2024-01',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300', 10),
  },
};



