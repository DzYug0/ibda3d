-- Drop existing function to ensure clean slate (optional, or just CREATE OR REPLACE)
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
BEGIN
  -- Get user ID if authenticated, else NULL
  v_user_id := auth.uid();

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

  -- Create Order
  INSERT INTO orders (
    user_id,
    status,
    total_amount,
    shipping_address,
    shipping_city,
    shipping_country,
    shipping_zip,
    notes
  ) VALUES (
    v_user_id,
    'pending',
    v_total_amount,
    p_shipping_info->>'address',
    p_shipping_info->>'city',
    p_shipping_info->>'country',
    p_shipping_info->>'zip',
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
        product_price, -- Storing pack price in product_price column for consistency/simplicity if no specific pack_price column
        product_name,  -- Storing pack name
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
