import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

// Construct connection string
// VITE_SUPABASE_URL="https://[project_id].supabase.co"
// Host: db.[project_id].supabase.co
const projectId = process.env.VITE_SUPABASE_PROJECT_ID;
const password = process.env.SUPABASE_DB_PASSWORD;
const connectionString = `postgres://postgres.tguflnxyewjuuzckcemo:${password}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;

console.log(`Connecting to database... (Project ID: ${projectId})`);

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase
});

async function deleteDirectly() {
    try {
        await client.connect();

        // 1. Check active announcements
        const res = await client.query('SELECT * FROM public.announcements WHERE is_active = true');
        console.log(`Found ${res.rows.length} active announcements via Postgres.`);

        if (res.rows.length > 0) {
            res.rows.forEach(row => console.log(`- Deleting: ${row.message} (${row.id})`));

            // 2. Delete them
            const delRes = await client.query('DELETE FROM public.announcements WHERE is_active = true');
            console.log(`Deleted ${delRes.rowCount} rows.`);
        } else {
            console.log('No active announcements found.');
        }

    } catch (err) {
        console.error('Database error:', err);
    } finally {
        await client.end();
    }
}

deleteDirectly();
