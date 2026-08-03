import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.APP_PORT || 3000;

app.listen(PORT, () => {
  console.log(`CBT app berjalan di http://localhost:${PORT}`);
});
