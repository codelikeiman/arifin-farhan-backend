import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    app: process.env.APP_NAME || 'CBT_APP',
    status: 'running',
  });
});

app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

// Global error handler (menangkap error dari catchAsync)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  // Prisma: kode P2002 = duplicate/unique constraint
  if (err.code === 'P2002') {
    return res.status(400).json({ message: 'Data sudah ada (duplikat)' });
  }

  return res.status(500).json({ message: 'Terjadi kesalahan server' });
});

export default app;
