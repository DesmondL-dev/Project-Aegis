export type RbacRole = 'ADMIN' | 'ANALYST';

const MASK_PREFIX = '****-****-****-';
const SIN_MASK_PREFIX = '***-***-';
const LAST_VISIBLE_DIGITS = 4;

// Pure function — RBAC-driven dynamic data masking. No side effects; deterministic output.
// ADMIN: full visibility (raw). ANALYST or undefined: last four chars visible (OWASP A02).
export function maskAccount(
  account: string,
  role: RbacRole | undefined
): string {
  if (role === 'ADMIN') {
    return account;
  }
  const suffix = account.length >= LAST_VISIBLE_DIGITS
    ? account.slice(-LAST_VISIBLE_DIGITS)
    : account || '****';
  return `${MASK_PREFIX}${suffix}`;
}

// SIN-specific mask — last four digits visible (e.g. ***-***-1234).
function maskedSin(sin: string): string {
  const suffix = sin.length >= LAST_VISIBLE_DIGITS
    ? sin.slice(-LAST_VISIBLE_DIGITS)
    : sin || '****';
  return `${SIN_MASK_PREFIX}${suffix}`;
}

// Strict RBAC: ANALYST always sees masked SIN; ADMIN sees raw only when isRevealed.
export function maskSin(
  sin: string,
  role: RbacRole,
  isRevealed: boolean
): string {
  if (role === 'ANALYST') {
    return maskedSin(sin);
  }
  return isRevealed ? sin : maskedSin(sin);
}
