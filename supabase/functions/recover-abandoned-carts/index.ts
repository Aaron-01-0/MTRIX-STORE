import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { Resend } from 'npm:resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CartItem {
    user_id: string
    product: {
        name: string
        image_url: string
    }
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        console.log('Checking for abandoned carts...')

        // 1. Find cart items updated > 1 hour ago where reminder hasn't been sent
        // We group by user_id to send one email per user
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

        const { data: abandonedItems, error: fetchError } = await supabase
            .from('cart_items')
            .select(`
        id,
        user_id,
        quantity,
        product:products (
          name,
          image_url
        ),
        profiles:user_id (
          email,
          first_name
        )
      `)
            .lt('updated_at', oneHourAgo)
            .is('reminder_sent_at', null)

        if (fetchError) throw fetchError

        if (!abandonedItems || abandonedItems.length === 0) {
            console.log('No abandoned carts found.')
            return new Response(JSON.stringify({ message: 'No abandoned carts found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 2. Group items by user
        const userCarts: Record<string, any> = {}

        abandonedItems.forEach((item: any) => {
            if (!userCarts[item.user_id]) {
                userCarts[item.user_id] = {
                    email: item.profiles?.email,
                    name: item.profiles?.first_name || 'there',
                    items: [],
                    ids: [] // Track IDs to update timestamp later
                }
            }
            userCarts[item.user_id].items.push(item.product.name)
            userCarts[item.user_id].ids.push(item.id)
        })

        console.log(`Found ${Object.keys(userCarts).length} users with abandoned carts.`)

        // 3. Send Emails
        const results = []

        for (const userId in userCarts) {
            const cart = userCarts[userId]
            if (!cart.email) continue

            console.log(`Sending email to ${cart.email}...`)

        })

const text = `Don't Forget Your Style!\n\nHey ${cart.name},\n\nWe noticed you left some great items in your cart:\n\n${cart.items.map((item: string) => `- ${item}`).join('\n')}\n\nThey're selling out fast! Complete your order now to secure your look.\n\nReturn to Cart: https://mtrix-landing-zen.vercel.app/cart\n\nStay stylish,\nTeam MTRIX\n\n© 2024 MTRIX. All rights reserved.`

const { data, error } = await resend.emails.send({
    from: 'MTRIX <onboarding@resend.dev>', // Update this if you have a custom domain
    to: [cart.email],
    subject: 'You left something behind! 👀',
    html: `
          <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #cccccc; padding: 20px;">
            <div style="background-color: #111111; padding: 40px; border-radius: 8px; border: 1px solid #333;">
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="font-size: 24px; font-weight: bold; color: #D4AF37; letter-spacing: 2px;">MTRIX</span>
              </div>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0 0 20px; text-align: center;">Don't Forget Your Style!</h1>
              <p>Hey ${cart.name},</p>
              <p>We noticed you left some great items in your cart:</p>
              <ul style="background-color: #222222; padding: 20px; border-radius: 4px; list-style: none; margin: 30px 0;">
                ${cart.items.map((item: string) => `<li style="margin-bottom: 10px; color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px;">${item}</li>`).join('')}
              </ul>
              <p>They're selling out fast! Complete your order now to secure your look.</p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="https://mtrix-landing-zen.vercel.app/cart" style="background-color: #D4AF37; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Return to Cart</a>
              </div>
              <p>Stay stylish,<br>Team MTRIX</p>
              <p style="font-size: 12px; color: #666; text-align: center; margin-top: 40px;">
                © 2024 MTRIX. All rights reserved.
              </p>
              <div style="text-align: center; margin-top: 20px;">
                <img src="https://tguflnxyewjuuzckcemo.supabase.co/storage/v1/object/public/assets/ezgif-7bee47465acb1993.gif" alt="Matrix Rain" width="100%" height="50" style="object-fit: cover; border-radius: 4px; opacity: 0.5;" />
              </div>
            </div>
          </div>
        `,
    text: text
})

if (error) {
    console.error(`Failed to send email to ${cart.email}:`, error)
    results.push({ userId, status: 'failed', error })
} else {
    // 4. Update reminder_sent_at
    const { error: updateError } = await supabase
        .from('cart_items')
        .update({ reminder_sent_at: new Date().toISOString() })
        .in('id', cart.ids)

    if (updateError) console.error('Failed to update timestamp:', updateError)

    results.push({ userId, status: 'sent', id: data?.id })
}
        }

return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

    } catch (error: any) {
    console.error('Error processing abandoned carts:', error)
    return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
}
})
