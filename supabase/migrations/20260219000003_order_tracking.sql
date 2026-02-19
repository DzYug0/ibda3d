-- Add phone column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update create_new_order to save phone number
CREATE OR REPLACE FUNCTION public.create_new_order(
  p_items jsonb,
  p_shipping_info jsonb,
  p_notes text,
  p_coupon_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id uuid;
  v_order_id uuid;
  v_total_amount numeric := 0;
  v_item jsonb;
  v_product_price numeric;
  v_product_name text;
  v_pack_price numeric;
  v_pack_name text;
  v_quantity int;
  v_phone text;
BEGIN
  -- Get user ID if authenticated, else NULL
  v_user_id := auth.uid();
  
  -- Extract phone from shipping info
  v_phone := p_shipping_info->>'phone';

  -- Calculate total amount and validate items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::int;
    
    IF v_item->>'product_id' IS NOT NULL THEN
      SELECT price, name INTO v_product_price, v_product_name
      FROM products WHERE id = (v_item->>'product_id')::uuid;
      
      IF v_product_price IS NULL THEN
        RAISE EXCEPTION 'Product not found: %', v_item->>'product_id';
      END IF;
      
      v_total_amount := v_total_amount + (v_product_price * v_quantity);
      
    ELSIF v_item->>'pack_id' IS NOT NULL THEN
      SELECT price, name INTO v_pack_price, v_pack_name
      FROM packs WHERE id = (v_item->>'pack_id')::uuid;
      
      IF v_pack_price IS NULL THEN
        RAISE EXCEPTION 'Pack not found: %', v_item->>'pack_id';
      END IF;
      
      v_total_amount := v_total_amount + (v_pack_price * v_quantity);
    END IF;
  END LOOP;
  
  -- Apply coupon discount if provided
  IF p_coupon_code IS NOT NULL THEN
    DECLARE
        v_coupon RECORD;
        v_discount_amount numeric := 0;
    BEGIN
        SELECT * INTO v_coupon FROM public.coupons 
        WHERE code = UPPER(p_coupon_code) AND is_active = true;
        
        IF v_coupon IS NOT NULL THEN
            IF v_coupon.expires_at IS NULL OR v_coupon.expires_at > NOW() THEN
                IF v_coupon.usage_limit IS NULL OR v_coupon.used_count < v_coupon.usage_limit THEN
                    IF v_coupon.min_spend <= v_total_amount THEN
                         IF v_coupon.discount_type = 'percentage' THEN
                            v_discount_amount := v_total_amount * (v_coupon.discount_value / 100);
                         ELSE
                            v_discount_amount := v_coupon.discount_value;
                         END IF;
                         
                         v_total_amount := GREATEST(0, v_total_amount - v_discount_amount);
                         
                         -- Increment usage count
                         UPDATE public.coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;
                    END IF;
                END IF;
            END IF;
        END IF;
    END;
  END IF;

  -- Create Order
  INSERT INTO orders (
    user_id,
    status,
    total_amount,
    shipping_address,
    shipping_city,
    shipping_country,
    shipping_zip,
    phone,
    notes
  ) VALUES (
    v_user_id,
    'pending',
    v_total_amount,
    p_shipping_info->>'address',
    p_shipping_info->>'city',
    p_shipping_info->>'country',
    p_shipping_info->>'zip',
    v_phone,
    p_notes
  ) RETURNING id INTO v_order_id;

  -- Insert Order Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := (v_item->>'quantity')::int;
    
    IF v_item->>'product_id' IS NOT NULL THEN
      SELECT price, name INTO v_product_price, v_product_name
      FROM products WHERE id = (v_item->>'product_id')::uuid;
      
      INSERT INTO order_items (
        order_id,
        product_id,
        quantity,
        product_price,
        product_name,
        selected_color,
        selected_version,
        selected_options
      ) VALUES (
        v_order_id,
        (v_item->>'product_id')::uuid,
        v_quantity,
        v_product_price,
        v_product_name,
        NULLIF(v_item->>'selected_color', 'null'),
        NULLIF(v_item->>'selected_version', 'null'),
        NULLIF(v_item->>'selected_options', 'null')::jsonb
      );
      
    ELSIF v_item->>'pack_id' IS NOT NULL THEN
      SELECT price, name INTO v_pack_price, v_pack_name
      FROM packs WHERE id = (v_item->>'pack_id')::uuid;
      
      INSERT INTO order_items (
        order_id,
        pack_id,
        quantity,
        product_price,
        product_name,
        selected_color,
        selected_version,
        selected_options
      ) VALUES (
        v_order_id,
        (v_item->>'pack_id')::uuid,
        v_quantity,
        v_pack_price,
        v_pack_name,
        NULL,
        NULL,
        NULL
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
END;
$function$;

-- Create get_order_status RPC for public tracking
CREATE OR REPLACE FUNCTION public.get_order_status(
  p_order_id uuid,
  p_phone text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_order record;
  v_items jsonb;
BEGIN
  -- Find order matching ID and Phone (case insensitive/trimmed for phone maybe? let's stick to exact for now to match input)
  -- Actually, let's normalize phone a bit or just rely on frontend to send clean data.
  SELECT * INTO v_order 
  FROM orders 
  WHERE id = p_order_id 
  AND (phone = p_phone OR phone = REPLACE(p_phone, ' ', '')); -- Simple flexible check

  IF v_order IS NULL THEN
    RETURN jsonb_build_object('found', false, 'error', 'Order not found or phone number does not match.');
  END IF;

  -- Fetch items
  SELECT jsonb_agg(
    jsonb_build_object(
      'product_name', result.product_name,
      'quantity', result.quantity,
      'price', result.product_price,
      'image_url', 
      CASE 
        WHEN p.image_url IS NOT NULL THEN p.image_url
        WHEN pack.image_url IS NOT NULL THEN pack.image_url
        ELSE NULL
      END
    )
  ) INTO v_items
  FROM order_items result
  LEFT JOIN products p ON result.product_id = p.id
  LEFT JOIN packs pack ON result.pack_id = pack.id
  WHERE result.order_id = v_order.id;

  RETURN jsonb_build_object(
    'found', true,
    'id', v_order.id,
    'status', v_order.status,
    'created_at', v_order.created_at,
    'total_amount', v_order.total_amount,
    'shipping_address', v_order.shipping_address,
    'shipping_city', v_order.shipping_city,
    'items', v_items
  );
END;
$function$;
