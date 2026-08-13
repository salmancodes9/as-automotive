-- Product images are public storefront assets (shown to every visitor),
-- so the bucket should be public. This removes the need for fragile
-- long-lived signed URLs (which was causing "Invalid Compact JWS" errors).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;
 
-- Allow anyone to read objects in this public bucket.
drop policy if exists "Public read access for product images" on storage.objects;
create policy "Public read access for product images"
  on storage.objects for select
  using (bucket_id = 'product-images');
 
