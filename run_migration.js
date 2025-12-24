import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
    console.error('Error: SUPABASE_DB_PASSWORD not found in .env');
    process.exit(1);
}

const connectionString = `postgres://postgres.tguflnxyewjuuzckcemo:${password}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function testConnection() {
    try {
        console.log('Connecting...');
        await client.connect();
        console.log('Connected. Running test query...');

        const res = await client.query('SELECT 1 as val');
        console.log('Test query result:', res.rows[0]);

        console.log('Now attempting migration...');
        const sqlPath = path.join(__dirname, '20251223_smart_coupons.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split and run commands individually to isolate the error if possible settings
        // But for now, let's just try running the whole block again if connection worked
        await client.query(sql);

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Database Operation failed:', err);
    } finally {
        await client.end();
    }
}

testConnection();
