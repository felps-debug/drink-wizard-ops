update profiles 
set cargo = 'admin' 
where id = (select id from auth.users where email = 'xavier.davimot1@gmail.com' limit 1);

-- Or if you want to promote the current user by ID (find ID in Authentication > Users)
-- update profiles set role = 'admin' where id = 'YOUR_UUID';
