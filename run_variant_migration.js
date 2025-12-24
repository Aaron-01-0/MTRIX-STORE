const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables if needed, or rely on hardcoded for this specific run context if safe
// For this environment, we assume connection string is available or we ask user
// But based on previous context, `run_migration.js` used `client` likely imported or configured.
// Let's look at `delete_via_postgres.js` again to see how it connected.
// Actually, I'll provide a standalone script that asks for connection string or uses env var.

const connectionString = process.env.SUPABASE_DB_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres"; // Fallback to local if env not set

const client = new Client({
    connectionString: connectionString,
});

async function runMigration() {
    try {
        await client.connect();
        console.log('Connected to database.');

        const sqlPath = path.join(__dirname, '20251224_enhance_variants.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing migration 20251224_enhance_variants.sql...');
        await client.query(sql);

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
