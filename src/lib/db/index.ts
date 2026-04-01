import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * Neon HTTP driver — stateless HTTPS per query.
 * No connection pool management needed. Works on Node and Edge runtimes.
 */
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
