import { Request, Response, NextFunction } from 'express';

type AsyncHandler = (req: any, res: Response, next: NextFunction) => Promise<any>;

// Membungkus controller async supaya error (termasuk error Prisma) otomatis
// diteruskan ke error-handling middleware di app.ts, tanpa perlu try/catch
// manual di setiap controller.
export function catchAsync(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
