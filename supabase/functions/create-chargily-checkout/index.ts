import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { orderId, successUrl, failureUrl } = await req.json()

        if (!orderId) {
            throw new Error('Missing orderId')
        }

        // 1. Fetch Order Details
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .select('*, order_items(*, product:products(name))')
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            throw new Error('Order not found')
        }

        // 2. Prepare Chargily Payload
        // Using test API URL for now. In production, use Deno.env to switch.
        const CHARGILY_API_URL = 'https://pay.chargily.net/test/api/v2/checkouts'
        const CHARGILY_SECRET_KEY = Deno.env.get('CHARGILY_SECRET_KEY')

        if (!CHARGILY_SECRET_KEY) {
            throw new Error('Missing Chargily Secret Key')
        }

        const payload = {
            amount: order.total_amount,
            currency: 'dzd',
            success_url: successUrl || `${req.headers.get('origin')}/checkout/success`,
            failure_url: failureUrl || `${req.headers.get('origin')}/checkout/failed`,
            webhook_endpoint: `${Deno.env.get('SUPABASE_URL')}/functions/v1/chargily-webhook`,
            metadata: {
                order_id: order.id,
            },
            locale: 'en',
            pass_fees_to: 'customer',
        }

        // 3. Call Chargily API
        const response = await fetch(CHARGILY_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CHARGILY_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Chargily Error:', data)
            throw new Error(`Chargily API Error: ${JSON.stringify(data)}`)
        }

        // 4. Update Order with transaction ID (optional, or wait for webhook)
        // We can store the checkout_id if we want.

        return new Response(
            JSON.stringify({ checkout_url: data.checkout_url }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
