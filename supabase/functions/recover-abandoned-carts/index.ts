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

      < img src = "https://tguflnxyewjuuzckcemo.supabase.co/storage/v1/object/public/assets/ezgif-7bee47465acb1993.gif" alt = "Matrix Rain" width = "100%" height = "50" style = "object-fit: cover; border-radius: 4px; opacity: 0.5;" />
        </div>
        </div>
        </div>
          `,
    text: text
})

if (error) {
    console.error(`Failed to send email to ${ cart.email }: `, error)
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
