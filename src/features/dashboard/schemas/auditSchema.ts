import { z } from 'zod';

// HTML entity escape map — covers the five canonical XSS injection vectors.
// Applied at the schema transform boundary before any payload reaches
// the render pipeline, neutralizing OWASP A03 (Injection) attack surface.
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',   // Must be first — prevents double-encoding of subsequent replacements
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

// Escape all five dangerous HTML entities in a single pass.
// Using a compiled regex union ensures O(n) traversal with no backtracking risk.
const escapeHtml = (raw: string): string =>
  raw.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);

export const auditSchema = z.object({
  notes: z
    .string()
    .min(10, { message: 'Audit justification must contain at least 10 characters for compliance logging.' })
    .max(1000, { message: 'Audit notes must not exceed 1000 characters.' })
    // Explain the WHY: Removed flawed regex blocklist. In modern OWASP standards, 
    // blacklisting is an anti-pattern. We rely entirely on absolute output encoding 
    // (entity escape transform) to neutralize all execution vectors including nested scripts.
    .transform((val) => escapeHtml(val.trim())),
});

// Output type reflects the post-transform shape — `notes` will be a sanitized string.
export type AuditPayload = z.infer<typeof auditSchema>;