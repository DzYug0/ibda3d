import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      authHeader ? { global: { headers: { Authorization: authHeader } } } : {}
    )

    let userId: string | null = null
    if (authHeader) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!authError && user) {
        userId = user.id
      }
    }

    const { items, shippingInfo, notes } = await req.json()

    if (!items?.length) {
      return new Response(JSON.stringify({ error: 'No items provided' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Separate product items and pack items
    const productItems = items.filter((i: any) => i.product_id && !i.pack_id)
    const packItems = items.filter((i: any) => i.pack_id)

    let totalAmount = 0
    const orderItems: Array<{ product_id: string | null; pack_id: string | null; product_name: string; product_price: number; quantity: number }> = []

    // Process product items
    if (productItems.length > 0) {
      const productIds = productItems.map((i: any) => i.product_id)
      const { data: products, error: pErr } = await supabase
        .from('products')
        .select('id, name, price, stock_quantity, is_active')
        .in('id', productIds)

      if (pErr || !products) {
        return new Response(JSON.stringify({ error: 'Failed to fetch products' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      const productMap = new Map(products.map(p => [p.id, p]))

      for (const item of productItems) {
        if (!item.product_id || typeof item.product_id !== 'string' || 
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.product_id)) {
          return new Response(JSON.stringify({ error: 'Invalid product ID format' }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          })
        }

        if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 10000) {
          return new Response(JSON.stringify({ error: 'Invalid quantity' }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          })
        }

        const product = productMap.get(item.product_id)
        if (!product || !product.is_active) {
          return new Response(JSON.stringify({ error: `Product unavailable: ${item.product_id}` }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          })
        }
        if (product.stock_quantity < item.quantity) {
          return new Response(JSON.stringify({ error: `Insufficient stock for ${product.name}` }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          })
        }
        totalAmount += product.price * item.quantity
        orderItems.push({
          product_id: item.product_id,
          pack_id: null,
          product_name: product.name,
          product_price: product.price,
          quantity: item.quantity
        })
      }
    }

    // Process pack items
    if (packItems.length > 0) {
      const packIds = packItems.map((i: any) => i.pack_id)
      const { data: packs, error: packErr } = await supabase
        .from('packs')
        .select('id, name, price, is_active')
        .in('id', packIds)

      if (packErr || !packs) {
        return new Response(JSON.stringify({ error: 'Failed to fetch packs' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      const packMap = new Map(packs.map(p => [p.id, p]))

      for (const item of packItems) {
        if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 10000) {
          return new Response(JSON.stringify({ error: 'Invalid quantity' }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          })
        }

        const pack = packMap.get(item.pack_id)
        if (!pack || !pack.is_active) {
          return new Response(JSON.stringify({ error: `Pack unavailable: ${item.pack_id}` }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          })
        }

        totalAmount += pack.price * item.quantity
        orderItems.push({
          product_id: null,
          pack_id: item.pack_id,
          product_name: pack.name,
          product_price: pack.price,
          quantity: item.quantity
        })
      }
    }

    const { data: order, error: oErr } = await adminSupabase
      .from('orders')
      .insert({
        user_id: userId,
        total_amount: totalAmount,
        shipping_address: shippingInfo?.address || null,
        shipping_city: shippingInfo?.city || null,
        shipping_country: shippingInfo?.country || null,
        shipping_zip: shippingInfo?.zip || null,
        notes: notes || null
      })
      .select()
      .single()

    if (oErr) {
      console.error('Order error:', oErr)
      return new Response(JSON.stringify({ error: 'Failed to create order' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const { error: iErr } = await adminSupabase
      .from('order_items')
      .insert(orderItems.map(i => ({ ...i, order_id: order.id })))

    if (iErr) {
      console.error('Order items error:', iErr)
      await adminSupabase.from('orders').delete().eq('id', order.id)
      return new Response(JSON.stringify({ error: 'Failed to create order items' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    return new Response(JSON.stringify({ 
      success: true, 
      order: { id: order.id, total_amount: order.total_amount, status: order.status }
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
