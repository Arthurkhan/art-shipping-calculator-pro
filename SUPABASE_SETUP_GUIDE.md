# How to Update Your Supabase Configuration

## Steps to get your new Supabase credentials:

1. **Go to your Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project "PAJ'Art Painting Monitoring"

2. **Get your Project URL and Anon Key**
   - Click on "Settings" (gear icon) in the sidebar
   - Click on "API" in the settings menu
   - You'll see:
     - **Project URL**: Something like `https://xxxxxxxxxxxxx.supabase.co`
     - **Anon/Public Key**: A long string starting with `eyJ...`

3. **Update the configuration file**
   - Open `src/integrations/supabase/client.ts`
   - Replace the following values:
   ```typescript
   const SUPABASE_URL = "YOUR_PROJECT_URL_HERE";
   const SUPABASE_PUBLISHABLE_KEY = "YOUR_ANON_KEY_HERE";
   ```

## Running the Migration

After updating the configuration:

1. **Go to your Supabase SQL Editor**
   - In your Supabase dashboard, click on "SQL Editor" in the sidebar
   
2. **Run the migration script**
   - Copy the entire content of `supabase/migrations/20250128_fix_table_structure.sql`
   - Paste it into the SQL editor
   - Click "Run" or press Ctrl+Enter

3. **Verify the tables**
   - Go to "Table Editor" in the sidebar
   - You should see:
     - `collections` table (renamed from `collection`)
     - `collection_sizes` table (renamed from `sizes`) with new columns:
       - width_cm
       - length_cm  
       - height_cm
       - weight_kg

## Adding Sample Data

To test if everything works, you can uncomment the sample data section in the migration file, or add data manually:

### Collections table:
| name | batch_id_prefix | has_different_positions |
|------|----------------|------------------------|
| Pop Art Collection | POP | false |
| Modern Art Collection | MOD | false |

### Collection_sizes table:
| collection_id | size | width_cm | length_cm | height_cm | weight_kg |
|--------------|------|----------|-----------|-----------|-----------|
| (ID of Pop Art) | Small | 30 | 40 | 5 | 2.5 |
| (ID of Pop Art) | Medium | 50 | 70 | 5 | 4.5 |
| (ID of Pop Art) | Large | 70 | 100 | 5 | 7.5 |

## Troubleshooting

If you encounter any issues:
1. Check the browser console for errors
2. Verify that Row Level Security (RLS) is enabled with proper policies
3. Make sure your Supabase project is not paused
4. Ensure the table names match exactly (plural forms)
