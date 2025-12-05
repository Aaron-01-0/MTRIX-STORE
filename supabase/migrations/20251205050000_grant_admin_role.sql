-- Grant admin role to raj00.mkv@gmail.com

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'raj00.mkv@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
