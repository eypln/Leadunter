# How to Run the Price Field SQL Migration

## Quick Steps

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Sign in to your account
   - Select your Lead Hunter project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query" button

3. **Copy and Paste SQL**
   - Open the file: `supabase/add-price-field.sql`
   - Copy ALL the contents
   - Paste into the SQL Editor

4. **Execute the Migration**
   - Click the "Run" button (or press Ctrl+Enter / Cmd+Enter)
   - Wait for the query to complete
   - You should see "Success. No rows returned" message

5. **Verify the Changes**
   - The last SELECT query in the file will show all leads with their prices
   - You should see 7 leads with prices ranging from €600 to €1,800
   - Verify the `price` column exists and has data

## What This Migration Does

✅ Adds `price` column to `leads` table (INTEGER type)
✅ Adds index for efficient price-based queries
✅ Updates all 7 test leads with sample prices
✅ Adds helpful comment to the column

## Expected Output

After running the migration, you should see output similar to:

```
Success. No rows returned
Success. No rows returned
Success. No rows returned
...
```

And finally, a table showing:

| id | title | lead_type | price | location |
|----|-------|-----------|-------|----------|
| ... | 3-Bedroom Apartment | OWNER | 1800 | Sliema |
| ... | Modern Studio | OWNER | 1500 | Valletta |
| ... | 2-Bedroom Flat | OWNER | 1200 | St. Julian's |
| ... | Looking for 2BR | CLIENT | 1200 | Malta |
| ... | Need apartment | CLIENT | 1000 | Malta |
| ... | Cozy 1-Bedroom | OWNER | 800 | Gzira |
| ... | Budget apartment | CLIENT | 600 | Malta |

## Troubleshooting

### Error: "column already exists"
- The migration has already been run
- No action needed, you're good to go!

### Error: "table leads does not exist"
- Make sure you're connected to the correct database
- Verify Phase 1 database setup was completed

### Error: "permission denied"
- Make sure you're logged in as the project owner
- Check your Supabase project permissions

## After Migration

Once the migration is complete:

1. **Test the Application**
   ```bash
   npm run dev
   ```

2. **Verify Price Display**
   - Login to the dashboard
   - Check that prices appear on lead cards
   - Click on a lead to open the modal
   - Verify price shows in the modal header
   - Check both OWNER and CLIENT leads

3. **Look for**:
   - Green Euro icon (€)
   - Formatted price (e.g., €1,200/mo)
   - "max budget" label on CLIENT leads

## Need Help?

If you encounter any issues:
1. Check the Supabase logs in the dashboard
2. Verify your database connection in `.env.local`
3. Make sure all previous migrations were run successfully
4. Check the browser console for any errors

---

**File Location**: `supabase/add-price-field.sql`
**Estimated Time**: < 1 minute
**Risk Level**: Low (only adds a column, doesn't modify existing data structure)
