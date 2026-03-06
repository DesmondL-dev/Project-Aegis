import { z } from 'zod';

// OWASP A03 — Injection Defense Layer.
// Aggressive blocklist regex to reject payloads containing script injection
// vectors or common SQL injection patterns before they reach the network boundary.
const INJECTION_BLOCKLIST = /<script|<\/script|--|;--|'--|DROP\s+TABLE|SELECT\s+\*|INSERT\s+INTO|DELETE\s+FROM|UNION\s+SELECT|xp_cmdshell/i;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email payload is required.' })
    .max(100, { message: 'Email payload exceeds maximum length of 100 characters.' })
    // Normalization MUST precede format validation — .trim() and .toLowerCase()
    // are applied in pipeline order. Placing them after .email() causes Zod to
    // validate the raw, un-normalized input first. A payload like
    // '  USER@DOMAIN.COM  ' would fail .email() due to the leading/trailing
    // whitespace before the transform ever executes, producing a false negative.
    .trim()
    .toLowerCase()
    .email({ message: 'Invalid email address structure.' })
    // Injection scan executes on the already-normalized value to eliminate
    // obfuscation vectors that exploit mixed casing (e.g., '<Script>') — the
    // INJECTION_BLOCKLIST uses /i flag as a secondary defense, but operating
    // on a pre-lowercased string guarantees deterministic match behavior.
    .refine(
      (val) => !INJECTION_BLOCKLIST.test(val),
      { message: 'Email payload contains disallowed character sequences.' }
    ),

  password: z
    .string()
    .min(8, { message: 'Password must meet the minimum entropy requirement (8 characters).' })
    .max(64, { message: 'Password payload exceeds maximum allowed length.' })
    // Banking-grade complexity: require uppercase, numeric, and special character
    .refine((val) => /[A-Z]/.test(val), {
      message: 'Password must contain at least one uppercase character.',
    })
    .refine((val) => /[0-9]/.test(val), {
      message: 'Password must contain at least one numeric character.',
    })
    .refine((val) => /[^A-Za-z0-9]/.test(val), {
      message: 'Password must contain at least one special character.',
    }),
});

// Inferred from the runtime Zod schema to guarantee compile-time and
// runtime type contracts remain perpetually in sync.
export type LoginPayload = z.infer<typeof loginSchema>;
