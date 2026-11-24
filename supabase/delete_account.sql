-- حذف الحساب نهائياً من قاعدة البيانات. الطلبات تبقى كسجل بدون ربطها بالحساب أو ببيانات الزبون.
-- شغّل هذا الملف في Supabase SQL Editor.

alter table public.orders alter column user_id drop not null;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in';
  end if;

  -- فصل الطلبات عن الحساب، ومسح بيانات الزبون منها، وإبقاء الدولة والمبالغ والمنتجات والتاريخ
  update public.orders
     set user_id = null,
         contact = null,
         shipping_address = jsonb_build_object('country', shipping_address->>'country')
   where user_id = uid;

  delete from public.addresses where user_id = uid;
  delete from public.customers where id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
