-- 1) Supabase Dashboard > Authentication > Users 에서 관리자 계정을 먼저 생성/초대합니다.
-- 2) 아래 USER_UUID를 해당 계정의 UUID로 바꾸고 SQL Editor에서 실행합니다.
insert into public.admin_users (user_id, role)
values ('USER_UUID'::uuid, 'super_admin')
on conflict (user_id) do update set role = excluded.role;
