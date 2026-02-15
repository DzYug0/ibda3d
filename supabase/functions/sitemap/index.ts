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
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        )

        const baseUrl = 'https://www.ibda3d.shop' // Replace with your actual domain

        // 1. Static Routes
        const staticRoutes = [
            '',
            '/auth',
            '/products',
            '/categories',
            '/packs',
            '/about', // Assuming these exist or will exist
            '/contact',
        ]

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`

        // Add static routes
        staticRoutes.forEach(route => {
            sitemap += `
  <url>
    <loc>${baseUrl}${route}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
        })

        // 2. Dynamic Products
        const { data: products, error: productsError } = await supabaseClient
            .from('products')
            .select('slug, created_at, updated_at')
            .eq('is_active', true)

        if (productsError) throw productsError

        products?.forEach(product => {
            const date = product.updated_at ? new Date(product.updated_at) : new Date(product.created_at)
            sitemap += `
  <url>
    <loc>${baseUrl}/products/${product.slug}</loc>
    <lastmod>${date.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`
        })

        // 3. Dynamic Packs
        const { data: packs, error: packsError } = await supabaseClient
            .from('packs')
            .select('slug, created_at') // Packs might not have updated_at, falling back to created_at
            .eq('is_active', true)

        if (packsError) throw packsError

        packs?.forEach(pack => {
            const date = pack.updated_at ? new Date(pack.updated_at) : new Date(pack.created_at)
            sitemap += `
  <url>
    <loc>${baseUrl}/packs/${pack.slug}</loc>
    <lastmod>${date.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`
        })

        sitemap += `
</urlset>`

        return new Response(sitemap, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/xml',
            },
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
