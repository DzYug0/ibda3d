

# Rework Pack System

## Summary

Transform packs from "adding individual products to cart" into a proper bundled product that appears as a **single line item** in the cart with its own pack price. The admin will select a main photo for the pack, and the gallery will be auto-built from constituent product photos.

## Current Behavior (What Changes)

- Currently, adding a pack to cart loops through each product and adds them individually
- Cart shows multiple separate product lines instead of one pack
- Pack has its own image upload for the main photo

## New Behavior

- A pack appears as **one item** in the cart with the pack's name and price
- The cart stores a `pack_id` reference (new column on `cart_items`)
- The pack detail page gallery is composed from the constituent products' images
- Admin only picks a main image; no separate gallery upload needed
- Checkout and orders treat the pack as a single line item

## Technical Plan

### 1. Database Changes

**Add `pack_id` column to `cart_items`:**
- Add nullable `pack_id` (uuid) column referencing `packs.id`
- When a pack is added to cart, a single row is inserted with `pack_id` set and `product_id` set to NULL (or a sentinel)
- Cart query joins on `packs` when `pack_id` is present

**Add `pack_id` column to `order_items`:**
- Add nullable `pack_id` (uuid) column
- Store pack name/price as the order item when ordering a pack

### 2. Backend Hook Changes (`useCart.ts`)

- Add `addPackToCart` mutation: inserts a single `cart_items` row with `pack_id` and `quantity`, `product_id` set to null
- Update cart query to also fetch pack info when `pack_id` is present (join on `packs` table)
- Update `CartItem` interface to include optional `pack_id` and `pack` fields

### 3. Pack Detail Page (`PackDetail.tsx`)

- Gallery built from constituent products' images (already partially done)
- "Add to Cart" calls `addPackToCart` instead of looping individual products
- Pack shows as a single item with its bundle price

### 4. Packs Listing Page (`Packs.tsx`)

- "Add to Cart" button calls `addPackToCart` instead of adding individual products

### 5. Cart Page (`Cart.tsx`)

- Render pack items differently: show pack name, pack price, pack image
- Link to `/packs/slug` instead of `/products/id`

### 6. Checkout Page (`Checkout.tsx`)

- Handle pack items in checkout items list (use pack name/price)
- When creating order, store pack as a single `order_items` row with `pack_id`, pack name, and pack price

### 7. Admin Packs Page (`AdminPacks.tsx`)

- Keep existing product selection UI (choose products + quantities)
- Image upload remains for the main pack photo only (no change needed here, already works this way)
- Gallery is auto-generated from products, so no admin gallery upload needed

### 8. Orders Display

- Show pack name as order item name when `pack_id` is present

---

### Technical Details

**Migration SQL:**
```sql
ALTER TABLE cart_items ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE cart_items ADD COLUMN pack_id uuid REFERENCES packs(id) ON DELETE CASCADE;
ALTER TABLE order_items ADD COLUMN pack_id uuid REFERENCES packs(id) ON DELETE SET NULL;
```

**Files to modify:**
- `supabase/migrations/` -- new migration
- `src/hooks/useCart.ts` -- add pack support to cart operations
- `src/pages/PackDetail.tsx` -- change add-to-cart to single pack item
- `src/pages/Packs.tsx` -- change add-to-cart to single pack item
- `src/pages/Cart.tsx` -- render pack items as single line
- `src/pages/Checkout.tsx` -- handle packs in checkout flow
- `src/hooks/useOrders.ts` -- handle pack in order creation
- `supabase/functions/create-order/index.ts` -- handle pack items

**Files unchanged:**
- `src/pages/admin/AdminPacks.tsx` -- admin flow stays the same
- `src/hooks/usePacks.ts` -- pack CRUD stays the same

