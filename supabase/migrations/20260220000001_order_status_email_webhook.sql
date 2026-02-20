-- Create the pg_net extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create the trigger function that calls the Edge Function using pg_net
CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    edge_function_url text;
    headers jsonb;
    payload jsonb;
BEGIN
    -- Only proceed if the status actually changed and we have an email
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.email IS NOT NULL THEN
        
        -- The URL of your Supabase Edge Function
        -- Uses the internal network endpoint for better performance and security
        edge_function_url := 'http://functions:9000/send-email';
        
        -- Get the anon key from vault or use a service role key. 
        -- In a real production setup you might use vault.decrypted_secrets, 
        -- but for simplicity we rely on the function validating the JWT or API key.
        -- If the function is public, no auth header is strictly required from pg_net,
        -- but you can pass the anon key.
        headers := jsonb_build_object(
            'Content-Type', 'application/json'
        );

        -- Build the payload matching the WebhookPayload interface
        payload := jsonb_build_object(
            'type', 'UPDATE',
            'table', 'orders',
            'record', row_to_json(NEW),
            'old_record', row_to_json(OLD),
            'schema', 'public'
        );

        -- Make the async HTTP POST request using pg_net
        PERFORM extensions.http_post(
            url := edge_function_url,
            headers := headers,
            body := payload
        );
        
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger on the orders table
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_status_change();

-- Add a comment explaining the trigger
COMMENT ON TRIGGER on_order_status_change ON public.orders IS 'Fires when an order is updated to send status emails via an Edge Function.';
