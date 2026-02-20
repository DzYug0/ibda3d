import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface WebhookPayload {
    type: string;
    table: string;
    record: {
        id: string;
        total_amount: number;
        status: string;
        email: string | null;
        shipping_address: string;
        [key: string]: any;
    };
    schema: string;
    old_record: {
        status: string;
        [key: string]: any;
    } | null;
}

const getEmailTemplate = (status: string, orderId: string, amount: number) => {
    const baseStyle = "font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; text-align: center; color: #333; padding: 40px 20px;";
    const cardStyle = "background: #fff; border-radius: 12px; padding: 30px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: left;";

    let title = "";
    let message = "";
    let color = "#10b981"; // success green

    switch (status) {
        case 'processing':
            title = "We're printing your order! 🖨️";
            message = "Great news! Your 3D prints are currently in production. We are carefully crafting your items.";
            color = "#3b82f6"; // blue
            break;
        case 'shipped':
            title = "Your order is on its way! 🚚";
            message = "Your 3D prints have been handed over to our shipping partners and are currently en route to you.";
            break;
        case 'delivered':
            title = "Order Delivered! 🎉";
            message = "Your order has been marked as delivered. We hope you love your new 3D printed items!";
            break;
        case 'cancelled':
            title = "Order Cancelled ❌";
            message = "Your order has been cancelled. If you have any questions, please reach out to our support team.";
            color = "#ef4444"; // red
            break;
        default:
            title = "Order Status Update";
            message = `Your order status has been updated to: <strong>${status}</strong>`;
    }

    return `
    <div style="background-color: #f9fafb; ${baseStyle}">
      <div style="${cardStyle}">
        <h2 style="color: ${color}; margin-top: 0; font-size: 24px;">${title}</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #4b5563;">
          ${message}
        </p>
        <div style="margin-top: 25px; padding-top: 25px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">Order ID: <strong style="color: #374151;">${orderId.substring(0, 8)}...</strong></p>
          <p style="margin: 5px 0 0; font-size: 14px; color: #6b7280;">Order Total: <strong style="color: #374151;">${amount.toLocaleString()} DA</strong></p>
        </div>
        <div style="margin-top: 30px; text-align: center;">
          <a href="https://ibda3d.com" style="background-color: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Visit Store</a>
        </div>
      </div>
      <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
        Thank you for choosing Ibda3D!<br>
        Algeria's Premium 3D Printing Service
      </p>
    </div>
  `;
};

serve(async (req) => {
    try {
        // Basic CORS
        if (req.method === 'OPTIONS') {
            return new Response('ok', {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
                }
            });
        }

        if (!RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY is not set");
        }

        const payload: WebhookPayload = await req.json();
        console.log("Webhook received:", payload);

        // Only process UPDATE events for the orders table
        if (payload.type !== 'UPDATE' || payload.table !== 'orders') {
            return new Response(JSON.stringify({ message: 'Not an order update' }), { status: 200 });
        }

        const newRecord = payload.record;
        const oldRecord = payload.old_record;

        // Only send email if the status actually changed
        if (!oldRecord || oldRecord.status === newRecord.status) {
            return new Response(JSON.stringify({ message: 'Status did not change, skipping' }), { status: 200 });
        }

        // Only send email if we have an email address
        if (!newRecord.email) {
            return new Response(JSON.stringify({ message: 'No email address on order, skipping' }), { status: 200 });
        }

        // We don't necessarily want to email for 'pending' or 'confirmed' unless required, 
        // but for now we'll email for processing, shipped, delivered, cancelled
        const emailHtml = getEmailTemplate(newRecord.status, newRecord.id, newRecord.total_amount);

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'Ibda3D Orders <onboarding@resend.dev>', // In production, replace with your verified domain e.g. orders@ibda3d.com
                to: [newRecord.email],
                subject: `Order Update: ${newRecord.status.toUpperCase()} - Ibda3D`,
                html: emailHtml,
            })
        });

        const data = await res.json();

        if (res.ok) {
            console.log('Email sent successfully:', data);
            return new Response(JSON.stringify(data), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } else {
            console.error('Failed to send email:', data);
            return new Response(JSON.stringify({ error: data }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

    } catch (err: any) {
        console.error('Error in send-email function:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});
