import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { voting_period_id } = await req.json()

        if (!voting_period_id) {
            throw new Error('voting_period_id is required')
        }

        // 1. Fetch Voting Period
        const { data: period, error: periodError } = await supabase
            .from('voting_periods')
            .select('*')
            .eq('id', voting_period_id)
            .single()

        if (periodError || !period) throw new Error('Voting period not found')

        // 2. Fetch Top Designs (Winners)
        // For MVP, let's say Top 3 get rewards
        const { data: winners, error: winnersError } = await supabase
            .from('arena_designs')
            .select('*, profiles:user_id(email)')
            .eq('voting_period_id', voting_period_id)
            .eq('status', 'voting')
            .order('votes_count', { ascending: false })
            .limit(3)

        if (winnersError) throw winnersError
        if (!winners || winners.length === 0) {
            return new Response(
                JSON.stringify({ message: 'No designs found for this period' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const couponsCreated = []

        // 3. Generate Coupons for Winners
        for (const [index, winner] of winners.entries()) {
            const rank = index + 1
            let rewardAmount = 0

            // Reward Logic
            if (rank === 1) rewardAmount = 1000 // ₹1000 for 1st
            else if (rank === 2) rewardAmount = 500  // ₹500 for 2nd
            else if (rank === 3) rewardAmount = 250  // ₹250 for 3rd

            const code = `WINNER-${period.title.substring(0, 3).toUpperCase()}-${rank}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

            // Create Coupon Record
            const { data: coupon, error: couponError } = await supabase
                .from('coupons')
                .insert({
                    code: code,
                    type: 'designer',
                    amount_type: 'flat', // Store Credit
                    discount_value: rewardAmount, // ₹ Value
                    usage_limit: 1,
                    user_limit: 1,
                    issued_to_user_id: winner.user_id,
                    description: `Arena Winner Reward - Rank #${rank} (${period.title})`,
                    valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
                    is_active: true
                })
                .select()
                .single()

            if (couponError) {
                console.error('Error creating coupon:', couponError)
                continue
            }

            // Assign to User Wallet
            await supabase
                .from('user_coupons')
                .insert({
                    user_id: winner.user_id,
                    coupon_id: coupon.id,
                    status: 'active'
                })

            couponsCreated.push({
                rank,
                designer: winner.profiles?.email,
                code: code,
                amount: rewardAmount
            })
        }

        // 4. Close the Voting Period
        await supabase
            .from('voting_periods')
            .update({ status: 'ended' })
            .eq('id', voting_period_id)

        return new Response(
            JSON.stringify({
                success: true,
                message: `Generated ${couponsCreated.length} coupons`,
                coupons: couponsCreated
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
