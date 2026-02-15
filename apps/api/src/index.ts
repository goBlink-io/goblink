import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST, before any other imports that might use them
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import express from 'express';
import cors from 'cors';
import swapRoutes from './routes/swap';
import balanceRoutes from './routes/balances';
import * as db from './db';
import * as cache from './services/cache';

const app = express();
const port = process.env.API_PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json());

// Enhanced health check with database and cache status
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'not_configured',
    cache: 'not_configured',
  };

  // Check database connection if configured
  if (process.env.DATABASE_URL) {
    try {
      const dbOk = await db.testConnection();
      health.database = dbOk ? 'connected' : 'error';
    } catch (error) {
      health.database = 'error';
    }
  }

  // Check Redis connection if configured
  if (process.env.REDIS_URL) {
    health.cache = cache.isRedisAvailable() ? 'connected' : 'error';
  }

  res.json(health);
});

// Routes
app.use('/api', swapRoutes);
app.use('/api/balances', balanceRoutes);

// Initialize server
const startServer = async () => {
  try {
    // Initialize database if configured
    if (process.env.DATABASE_URL) {
      console.log('Initializing database connection...');
      const dbOk = await db.testConnection();
      if (dbOk) {
        console.log('Database connected successfully');
        
        // Initialize schema if AUTO_INIT_DB is true
        if (process.env.AUTO_INIT_DB === 'true') {
          console.log('Initializing database schema...');
          await db.initSchema();
        }
      } else {
        console.warn('Database connection test failed. Continuing without database.');
      }
    } else {
      console.warn('DATABASE_URL not configured. Running without database persistence.');
    }

    // Initialize Redis if configured
    if (process.env.REDIS_URL) {
      console.log('Initializing Redis connection...');
      await cache.initRedis();
      if (cache.isRedisAvailable()) {
        console.log('Redis connected successfully');
      } else {
        console.warn('Redis connection failed. Continuing without caching.');
      }
    } else {
      console.warn('REDIS_URL not configured. Running without caching.');
    }

    // Start Express server
    const server = app.listen(port, () => {
      console.log(`\n✨ Sapphire API server listening at http://localhost:${port}`);
      console.log(`\nAPI Endpoints:`);
      console.log(`  GET  /health`);
      console.log(`  GET  /api/tokens`);
      console.log(`  POST /api/quote`);
      console.log(`  POST /api/deposit/submit`);
      console.log(`  GET  /api/status/:depositAddress`);
      console.log(`  GET  /api/balances/near/:accountId`);
      console.log(`  GET  /api/balances/near-token/:accountId`);
      console.log('');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        // Close database connections
        if (process.env.DATABASE_URL) {
          await db.close();
        }
        
        // Close Redis connection
        if (process.env.REDIS_URL && cache.isRedisAvailable()) {
          await cache.closeRedis();
        }
        
        console.log('All connections closed. Exiting.');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown after 10 seconds');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
