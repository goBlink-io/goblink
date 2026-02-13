import { Pool, PoolClient } from 'pg';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * Execute a query with automatic connection management
 */
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error', { text, error });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 */
export const getClient = async (): Promise<PoolClient> => {
  const client = await pool.connect();
  return client;
};

/**
 * Test database connection
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    await query('SELECT NOW()');
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

/**
 * Initialize database schema
 */
export const initSchema = async (): Promise<void> => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await query(schema);
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    throw error;
  }
};

/**
 * Gracefully close all database connections
 */
export const close = async (): Promise<void> => {
  await pool.end();
  console.log('Database connections closed');
};

export default { query, getClient, testConnection, initSchema, close };
