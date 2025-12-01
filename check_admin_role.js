import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function checkAdminRole() {
    console.log('Checking admin role function...');

    // 1. Get a known admin user ID (from previous logs or hardcoded if known, otherwise list users)
    // Since I don't have the user's ID, I'll list users and check roles for the first one found in user_roles

    const { data: roles, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .limit(5);

    if (error) {
        console.error('Error fetching user_roles:', error);
        return;
    }

    console.log('Found roles:', roles);

    if (roles && roles.length > 0) {
        const testUser = roles[0];
        console.log(`Testing has_role for user ${testUser.user_id} with role ${testUser.role}...`);

        const { data: hasRole, error: fnError } = await supabase
            .rpc('has_role', { _user_id: testUser.user_id, _role: testUser.role });

        if (fnError) {
            console.error('has_role RPC failed:', fnError);
        } else {
            console.log(`has_role result: ${hasRole}`);
        }
    } else {
        console.log('No user roles found to test.');
    }
}

checkAdminRole();
