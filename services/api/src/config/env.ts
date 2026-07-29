import { config } from 'dotenv';
import { z } from 'zod';

config();

const WEAK_ACCESS_DEFAULT = 'change_me_access';
const WEAK_REFRESH_DEFAULT = 'change_me_refresh';
const MIN_SECRET_LENGTH = 32;

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_PORT: z.coerce.number().int().positive().default(4000),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    DATABASE_URL: z.string().optional(),
    JWT_ACCESS_SECRET: z.string().min(1).optional(),
    JWT_REFRESH_SECRET: z.string().min(1).optional(),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  })
  .superRefine((val, ctx) => {
    // In production, JWT secrets must be strong, distinct, and explicitly set.
    if (val.NODE_ENV !== 'production') return;

    const isWeak = (secret: string | undefined, weakDefault: string): boolean =>
      !secret || secret.length < MIN_SECRET_LENGTH || secret === weakDefault;

    if (isWeak(val.JWT_ACCESS_SECRET, WEAK_ACCESS_DEFAULT)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_ACCESS_SECRET'],
        message: `must be set and at least ${MIN_SECRET_LENGTH} characters in production (no default)`,
      });
    }
    if (isWeak(val.JWT_REFRESH_SECRET, WEAK_REFRESH_DEFAULT)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message: `must be set and at least ${MIN_SECRET_LENGTH} characters in production (no default)`,
      });
    }
    if (
      val.JWT_ACCESS_SECRET &&
      val.JWT_REFRESH_SECRET &&
      val.JWT_ACCESS_SECRET === val.JWT_REFRESH_SECRET
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        message: 'must differ from JWT_ACCESS_SECRET',
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast on invalid configuration — a 12-factor requirement.
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

// Development/test convenience fallbacks. Production is validated above and
// therefore never reaches these defaults.
export const env = {
  ...parsed.data,
  JWT_ACCESS_SECRET: parsed.data.JWT_ACCESS_SECRET ?? WEAK_ACCESS_DEFAULT,
  JWT_REFRESH_SECRET: parsed.data.JWT_REFRESH_SECRET ?? WEAK_REFRESH_DEFAULT,
};
export type Env = typeof env;

