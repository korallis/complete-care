import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const rows = await sql(`
select u.id, u.name, u.email, m.role, o.slug
from users u
join memberships m on m.user_id = u.id
join organisations o on o.id = m.organisation_id
where o.slug = 'redesign-admin-workspace' and (u.name ilike '%lee%' or u.email ilike '%lee%')
order by u.created_at desc
limit 20`);
console.log(JSON.stringify(rows, null, 2));
