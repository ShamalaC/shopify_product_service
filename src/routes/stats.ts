import { Router, Request, Response } from 'express';
import '../services/statsService';

export function createStatsRouter(): Router {
  const router = Router();

  router.get('/', (req: Request, res: Response) => {
    try {
      const stats = (global as any).statsService.getStats();
      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats', message: error.message });
    }
  });

  return router;
}

