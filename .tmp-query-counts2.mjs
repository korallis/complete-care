import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const rows = await sql(`
select p.id, p.first_name, p.last_name,
  (select count(*) from medications med where med.person_id = p.id) as medication_count,
  (select count(*) from prn_protocols prn join medications med2 on med2.id = prn.medication_id where med2.person_id = p.id) as prn_count,
  (select count(*) from approved_contacts c where c.person_id = p.id) as contact_count,
  (select count(*) from lac_records l where l.person_id = p.id) as lac_count,
  (select count(*) from placement_plans pp where pp.person_id = p.id) as placement_plan_count,
  (select count(*) from missing_episodes me where me.person_id = p.id) as missing_episode_count,
  (select count(*) from philomena_profiles ph where ph.person_id = p.id) as philomena_count
from persons p
where p.organisation_id = '7aea21ef-559b-4f1f-8db7-04ab7ff75efd'
order by p.created_at desc limit 20`);
console.log(JSON.stringify(rows, null, 2));
