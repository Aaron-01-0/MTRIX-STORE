import { createClient } from '@supabase/supabase-js'

const url = 'https://tguflnxyewjuuzckcemo.supabase.co'
const key = 'sb_publishable_LbK05koWQ4xGGcddQcriUg_9yEcQg8t'
const supabase = createClient(url, key)

async function create() {
    console.log('Creating demo user...')
    const { data, error } = await supabase.auth.signUp({
        email: 'demo_razorpay@mtrix.com',
        password: 'password123',
        options: {
            data: {
                full_name: 'Demo User',
            }
        }
    })

    if (error) {
        console.error('Error creating user:', error.message)
    } else {
        console.log('User created successfully!')
        console.log('User ID:', data.user?.id)
        console.log('Email:', data.user?.email)
        if (data.session) {
            console.log('Session active: Yes (Auto-confirm likely enabled)')
        } else {
            console.log('Session active: No (Email confirmation might be required)')
        }
    }
}

create()
