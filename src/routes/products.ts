import { Router, Request, Response } from 'express';
import { ProductService } from '../services/productService';

export function createProductsRouter(productService: ProductService): Router {
  const router = Router();

  router.get('/', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string || '10', 10);
      const cursor = req.query.cursor as string | undefined;

      const result = await productService.getProducts(limit, cursor);
      
      if (result.next_page) {
        res.setHeader('X-Next-Page', result.next_page);
      }
      res.json(result.products);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products', message: error.message });
    }
  });

  router.get('/*', async (req: Request, res: Response) => {
    try {
      const id = req.path.substring(1);
      const decodedId = decodeURIComponent(id);
      const product = await productService.getProductById(decodedId);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product);
    } catch (error: any) {
      console.error('Error fetching product:', error);
      res.status(500).json({ error: 'Failed to fetch product', message: error.message });
    }
  });

  return router;
}

