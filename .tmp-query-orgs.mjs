import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const rows = await sql("select id, slug, name from organisations where slug ilike '%redesign%' or name ilike '%redesign%' order by created_at desc limit 20");
console.log(JSON.stringify(rows, null, 2));
