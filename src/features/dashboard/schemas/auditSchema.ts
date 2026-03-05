import { z } from 'zod';

// HTML entity escape map — covers the five canonical XSS injection vectors.
// Applied at the schema transform boundary before any payload reaches
// the render pipeline, neutralizing OWASP A03 (Injection) attack surface.
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&':  '&amp;',   // Must be first — prevents double-encoding of subsequent replacements
  '<':  '&lt;',
  '>':  '&gt;',
  '"':  '&quot;',
  "'":  '&#x27;',
};

// Escape all five dangerous HTML entities in a single pass.
// Using a compiled regex union ensures O(n) traversal with no backtracking risk.
const escapeHtml = (raw: string): string =>
  raw.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);

export const auditSchema = z.object({
  notes: z
    .string()
    .min(1, { message: 'Audit notes payload is required.' })
    .max(1000, { message: 'Audit notes must not exceed 1000 characters.' })
    // XSS Sanitization Transform — all HTML special characters are escaped
    // before the payload is stored or re-rendered. This is a defense-in-depth
    // layer: it does not replace output encoding at the render boundary,
    // but prevents unsanitized payloads from persisting in the data layer.
    .transform((val) => escapeHtml(val.trim())),
});

// Output type reflects the post-transform shape — `notes` is guaranteed
// to be a sanitized, HTML-escaped string at this point in the pipeline.
export type AuditPayload = z.infer<typeof auditSchema>;
