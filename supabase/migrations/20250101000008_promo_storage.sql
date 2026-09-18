insert into storage.buckets (id, name, public)
values ('promo', 'promo', true)
on conflict (id) do nothing;

create policy promo_storage_read on storage.objects for select
  using (bucket_id = 'promo');

create policy promo_storage_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'promo' and is_admin()
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );

create policy promo_storage_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'promo' and is_admin()
    and (storage.foldername(name))[1] = current_tenant_id()::text
  );
