import { Request, Response, NextFunction } from 'express';

export function statsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const latency = Date.now() - startTime;
    if (typeof global !== 'undefined' && global.statsService) {
      global.statsService.recordEndpointCall(latency);
    }
  });

  next();
}

