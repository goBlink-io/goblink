import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import swapRoutes from './routes/swap';

// Load environment variables from root .env if it exists, otherwise from local
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
const port = process.env.API_PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', swapRoutes);

app.listen(port, () => {
  console.log(`Sapphire API server listening at http://localhost:${port}`);
});
