# Supabase Migrations

## Applying Migrations

### Using Supabase CLI (Recommended)

If you have the Supabase CLI installed and linked to your project:

```bash
cd apps/web
npx supabase db push
```

### Manual Application via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `20260220_create_transactions_table.sql`
4. Copy the SQL content
5. Paste and run it in the SQL Editor

### Verify Migration

After applying, verify the table was created:

```sql
SELECT * FROM transactions LIMIT 1;
```

## Migration Files

- `20260220_create_transactions_table.sql` - Creates the `transactions` table with indexes for transaction history tracking

## Notes

- The `transactions` table uses service role key access (no RLS policies by default)
- Full-text search is enabled via GIN indexes for tx hash searching
- The `updated_at` trigger automatically updates timestamps on row changes
