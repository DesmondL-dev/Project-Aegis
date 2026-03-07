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
    .email({ message: 'Invalid email address structure.' })
    // Normalize before injection scan — trim and lowercase first to eliminate
    // obfuscation vectors that exploit whitespace or mixed casing.
    .trim()
    .toLowerCase()
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

  // Role-Based Access Control — claims slot for JWT payload simulation.
  // Optional at submit; server (or mock) may derive from identity.
  role: z.enum(['ADMIN', 'ANALYST']).optional(),
});

// Inferred from the runtime Zod schema to guarantee compile-time and
// runtime type contracts remain perpetually in sync.
export type LoginPayload = z.infer<typeof loginSchema>;
