# Database Setup Guide

This guide covers setting up PostgreSQL and Redis for the Sapphire backend.

## Overview

- **PostgreSQL**: Stores transaction records and status history
- **Redis**: Caches token lists and swap status for performance

Both are **optional for local development**. The API will run without them, but transactions won't be persisted and caching will be disabled.

---

## Local Development (Optional)

### Option 1: Using Docker

The easiest way to run PostgreSQL and Redis locally:

```bash
# Start PostgreSQL
docker run --name sapphire-postgres \
  -e POSTGRES_PASSWORD=sapphire \
  -e POSTGRES_DB=sapphire \
  -p 5432:5432 \
  -d postgres:15

# Start Redis
docker run --name sapphire-redis \
  -p 6379:6379 \
  -d redis:7
```

Update your `.env`:
```env
DATABASE_URL=postgresql://postgres:sapphire@localhost:5432/sapphire
REDIS_URL=redis://localhost:6379
AUTO_INIT_DB=true
```

Restart the API server (`npm run dev:api`) and the schema will be initialized automatically.

### Option 2: Native Installation

#### PostgreSQL

**Windows:**
1. Download from https://www.postgresql.org/download/windows/
2. Install and note the password
3. Create database: `createdb sapphire`

**Mac (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb sapphire
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo -u postgres createdb sapphire
```

#### Redis

**Windows:**
- Download from https://github.com/microsoftarchive/redis/releases
- Or use WSL2 and follow Linux instructions

**Mac (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

---

## Production Deployment

### Railway (Recommended)

Railway provides managed PostgreSQL and Redis with zero configuration:

1. **Create Railway Project**: https://railway.app
2. **Add PostgreSQL**: Click "+ New" → "Database" → "PostgreSQL"
3. **Add Redis**: Click "+ New" → "Database" → "Redis"
4. **Connect to API**: Railway automatically provides `DATABASE_URL` and `REDIS_URL` environment variables
5. **Enable Auto-Init**: Set `AUTO_INIT_DB=true` in Railway environment variables

The schema will be created automatically on first deployment.

### Heroku

```bash
heroku addons:create heroku-postgresql:mini
heroku addons:create heroku-redis:mini
heroku config:set AUTO_INIT_DB=true
```

### Other Platforms

Any PostgreSQL 12+ and Redis 6+ instance will work. Set these environment variables:

```env
DATABASE_URL=postgresql://user:password@host:port/database
DATABASE_SSL=true  # For hosted databases
REDIS_URL=redis://host:port
AUTO_INIT_DB=true  # For first deployment
```

---

## Database Schema

The schema is automatically created when `AUTO_INIT_DB=true`. See [`apps/api/src/db/schema.sql`](../apps/api/src/db/schema.sql) for details.

### Tables

#### `transactions`
Stores all swap transaction records:
- `id`: Primary key
- `session_id`: Unique session identifier
- `origin_asset`, `destination_asset`: Asset IDs
- `amount`: Swap amount
- `deposit_address`: 1Click deposit address
- `recipient`, `refund_to`: User addresses
- `status`: Current swap status
- `quote_details`: Full quote JSON
- `app_fee_bps`: Fee in basis points
- `user_ip`, `user_agent`: Optional tracking
- `created_at`, `updated_at`: Timestamps

#### `status_history`
Tracks status changes:
- `id`: Primary key
- `transaction_id`: Foreign key to transactions
- `status`: New status
- `metadata`: JSON metadata
- `timestamp`: When status changed

### Manual Schema Initialization

If you prefer to initialize the schema manually:

```bash
# Connect to PostgreSQL
psql -U postgres -d sapphire

# Run the schema
\i apps/api/src/db/schema.sql
```

---

## Verifying Setup

### Check Health Endpoint

```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-13T08:00:00.000Z",
  "database": "connected",  // or "not_configured"
  "cache": "connected"      // or "not_configured"
}
```

### Check Database Connection

```bash
# If using Docker
docker exec -it sapphire-postgres psql -U postgres -d sapphire

# Run a test query
SELECT COUNT(*) FROM transactions;
```

### Check Redis Connection

```bash
# If using Docker
docker exec -it sapphire-redis redis-cli

# Test
> PING
PONG
```

---

## Backup and Maintenance

### PostgreSQL Backup

```bash
# Backup
pg_dump -U postgres sapphire > backup.sql

# Restore
psql -U postgres sapphire < backup.sql
```

### Redis Persistence

Redis is configured for persistence by default. Data is automatically saved to disk.

---

## Troubleshooting

### "ECONNREFUSED" Errors

The API shows these when DATABASE_URL or REDIS_URL are configured but services aren't running:
- Remove the URLs from `.env` if not using databases locally
- Or start the services using instructions above

### Schema Not Initializing

- Ensure `AUTO_INIT_DB=true` in environment variables
- Check database user has CREATE TABLE permissions
- Manually run schema: `psql -U postgres -d sapphire -f apps/api/src/db/schema.sql`

### Connection Pool Errors

- PostgreSQL max connections exceeded: Reduce `max: 20` in [`apps/api/src/db/index.ts`](../apps/api/src/db/index.ts:14)
- Or increase PostgreSQL max_connections setting

---

## Environment Variables Reference

```env
# PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/database
DATABASE_SSL=true|false  # Use SSL for connection (default: false)
AUTO_INIT_DB=true|false  # Auto-initialize schema on startup (default: false)

# Redis
REDIS_URL=redis://host:port
# Or for authenticated Redis:
REDIS_URL=redis://:password@host:port
```
