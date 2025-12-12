import express, { Express } from 'express';
import cors from 'cors';
import { config } from './config';
import { ShopifyClient } from './services/shopifyClient';
import { CacheService } from './services/cacheService';
import { ProductService } from './services/productService';
import { createProductsRouter } from './routes/products';
import { createStatsRouter } from './routes/stats';
import { statsMiddleware } from './middleware/statsMiddleware';
import './services/statsService';

async function startServer(): Promise<void> {
  const app: Express = express();

  app.use(cors());
  app.use(express.json());
  app.use(statsMiddleware);

  const shopifyClient = new ShopifyClient();
  const cacheService = new CacheService();
  await cacheService.connect();

  const productService = new ProductService(shopifyClient, cacheService);

  app.use('/products', createProductsRouter(productService));
  app.use('/api-stats', createStatsRouter());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/', (req, res) => {
    res.json({
      message: 'Shopify Product Summary Service',
      endpoints: {
        'GET /products': 'List products (query params: limit, cursor)',
        'GET /products/:id': 'Get single product by ID',
        'GET /api-stats': 'Get API statistics',
        'GET /health': 'Health check'
      }
    });
  });

  app.use((req, res) => {
    res.status(404).json({ 
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`,
      availableEndpoints: [
        'GET /products',
        'GET /products/:id',
        'GET /api-stats',
        'GET /health'
      ]
    });
  });

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  const port = config.server.port;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  process.on('SIGTERM', async () => {
    await cacheService.disconnect();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await cacheService.disconnect();
    process.exit(0);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

