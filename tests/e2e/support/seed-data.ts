import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { orgSlug } from './config';

export type SeedTargets = {
  orgId: string;
  orgSlug: string;
  personId: string | null;
  propertyId: string | null;
  referralId: string | null;
  staffId: string | null;
  carePlanId: string | null;
  incidentId: string | null;
};

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Load .env.local before running Playwright seed helpers.');
  }

  return neon(process.env.DATABASE_URL);
}

export async function getSeedTargets(): Promise<SeedTargets> {
  const sql = getSql();
  const [org] = await sql`select id, slug from organisations where slug = ${orgSlug} limit 1`;
  if (!org) {
    throw new Error(`Seed organisation not found: ${orgSlug}`);
  }

  const [person] = await sql`
    select id, full_name
    from persons
    where organisation_id = ${org.id}
    order by full_name asc
    limit 1
  `;

  const [property] = await sql`
    select id, name
    from properties
    where organisation_id = ${org.id}
    order by name asc nulls last, id asc
    limit 1
  `;

  const [referral] = await sql`
    select id
    from referrals
    where organisation_id = ${org.id}
    order by created_at desc nulls last, id asc
    limit 1
  `;

  const [staff] = await sql`
    select id
    from staff_profiles
    where organisation_id = ${org.id}
    order by full_name asc nulls last, id asc
    limit 1
  `;

  const [carePlan] = person
    ? await sql`
        select id
        from care_plans
        where organisation_id = ${org.id}
          and person_id = ${person.id}
        order by created_at desc nulls last, id asc
        limit 1
      `
    : [];

  const [incident] = person
    ? await sql`
        select id
        from incidents
        where organisation_id = ${org.id}
          and person_id = ${person.id}
        order by occurred_at desc nulls last, created_at desc nulls last, id asc
        limit 1
      `
    : [];

  return {
    orgId: org.id,
    orgSlug: org.slug,
    personId: person?.id ?? null,
    propertyId: property?.id ?? null,
    referralId: referral?.id ?? null,
    staffId: staff?.id ?? null,
    carePlanId: carePlan?.id ?? null,
    incidentId: incident?.id ?? null,
  };
}

export async function getSeededDynamicRoutes() {
  const targets = await getSeedTargets();
  const routes = [
    targets.personId && `/${targets.orgSlug}/persons/${targets.personId}`,
    targets.personId && `/${targets.orgSlug}/persons/${targets.personId}/care-plans`,
    targets.personId && targets.carePlanId && `/${targets.orgSlug}/persons/${targets.personId}/care-plans/${targets.carePlanId}`,
    targets.personId && `/${targets.orgSlug}/persons/${targets.personId}/incidents`,
    targets.personId && targets.incidentId && `/${targets.orgSlug}/persons/${targets.personId}/incidents/${targets.incidentId}`,
    targets.personId && `/${targets.orgSlug}/persons/${targets.personId}/timeline`,
    targets.propertyId && `/${targets.orgSlug}/properties/${targets.propertyId}`,
    targets.referralId && `/${targets.orgSlug}/admissions/${targets.referralId}`,
    targets.staffId && `/${targets.orgSlug}/staff/${targets.staffId}`,
  ].filter((route): route is string => Boolean(route));

  return { targets, routes };
}
