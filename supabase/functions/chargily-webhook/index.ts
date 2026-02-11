import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Helper to verify HMAC signature using Web Crypto API
async function verifySignature(secret: string, payload: string, signature: string | null) {
    if (!signature) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
    );

    const signatureBytes = new Uint8Array(
        signature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );

    return await crypto.subtle.verify(
        "HMAC",
        key,
        signatureBytes,
        encoder.encode(payload)
    );
}

serve(async (req) => {
    try {
        const signature = req.headers.get("signature");
        const payload = await req.text();
        const secret = Deno.env.get("CHARGILY_SECRET_KEY");

        if (!secret) {
            return new Response("Missing secret key", { status: 500 });
        }

        // Verify Signature
        // Only run verification if signature header is present (recommended for production)
        if (signature) {
            const isValid = await verifySignature(secret, payload, signature);
            if (!isValid) {
                return new Response("Invalid signature", { status: 401 });
            }
        }

        // Parse Payload
        const event = JSON.parse(payload);

        // Initialize Supabase Admin Client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Handle Events
        if (event.type === 'checkout.paid') {
            const checkout = event.data;
            const orderId = checkout.metadata.order_id;

            if (orderId) {
                await supabaseClient
                    .from('orders')
                    .update({
                        payment_status: 'paid',
                        transaction_id: checkout.id,
                        payment_method: 'chargily'
                    })
                    .eq('id', orderId);

                console.log(`Order ${orderId} marked as paid.`);
            }
        } else if (event.type === 'checkout.failed' || event.type === 'checkout.canceled') {
            const checkout = event.data;
            const orderId = checkout.metadata.order_id;

            if (orderId) {
                await supabaseClient
                    .from('orders')
                    .update({
                        payment_status: 'failed',
                        transaction_id: checkout.id
                    })
                    .eq('id', orderId);

                console.log(`Order ${orderId} marked as failed/canceled.`);
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error('Webhook Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400 }
        );
    }
})
