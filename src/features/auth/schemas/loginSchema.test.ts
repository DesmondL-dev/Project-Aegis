import { describe, it, expect } from 'vitest';
import { loginSchema } from './loginSchema';

// Test Suite: Zero-Trust Auth Gateway — Zod Schema Intercept Layer
//
// Validates the payload boundary enforcement logic of `loginSchema`.
// These tests operate exclusively at the schema level — no component
// or network surface is involved. Any regression here implies a direct
// breach in the OWASP A03 (Injection) and input validation defense chain.

describe('loginSchema', () => {

  describe('Valid payload', () => {
    it('should pass safeParse for a fully compliant credential payload', () => {
      const validPayload = {
        email:    'analyst@aegis.bank.com',
        password: 'Secure@99',
      };

      const result = loginSchema.safeParse(validPayload);

      expect(result.success).toBe(true);

      if (result.success) {
        // Assert normalization transforms were applied:
        // email is lowercased and trimmed before downstream hydration.
        expect(result.data.email).toBe('analyst@aegis.bank.com');
      }
    });

    it('should normalize email to lowercase before passing', () => {
      const result = loginSchema.safeParse({
        email:    '  ANALYST@AEGIS.BANK.COM  ',
        password: 'Secure@99',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('analyst@aegis.bank.com');
      }
    });
  });

  describe('Email — Zod Intercept Assertions', () => {
    it('should reject an empty email payload', () => {
      const result = loginSchema.safeParse({ email: '', password: 'Secure@99' });
      expect(result.success).toBe(false);
    });

    it('should reject a malformed email structure (missing TLD)', () => {
      const result = loginSchema.safeParse({ email: 'notanemail', password: 'Secure@99' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    it('should reject an email payload exceeding the 100-character maximum', () => {
      const longEmail = `${'a'.repeat(90)}@aegis.bank.com`;
      const result = loginSchema.safeParse({ email: longEmail, password: 'Secure@99' });
      expect(result.success).toBe(false);
    });

    it('should intercept a script injection vector in the email field (OWASP A03)', () => {
      // Assertion: the injection blocklist regex must fire and abort
      // safeParse before the payload reaches any downstream consumer.
      const xssPayload = '<script>alert(1)</script>@aegis.bank.com';
      const result = loginSchema.safeParse({ email: xssPayload, password: 'Secure@99' });
      expect(result.success).toBe(false);
    });

    it('should intercept a SQL injection pattern in the email field (OWASP A03)', () => {
      const sqlPayload = "'; DROP TABLE users; --@aegis.bank.com";
      const result = loginSchema.safeParse({ email: sqlPayload, password: 'Secure@99' });
      expect(result.success).toBe(false);
    });
  });

  describe('Password — Banking-Grade Entropy Assertions', () => {
    it('should reject a password below the minimum entropy threshold (< 8 chars)', () => {
      const result = loginSchema.safeParse({ email: 'analyst@aegis.bank.com', password: 'Ab1!' });
      expect(result.success).toBe(false);
    });

    it('should reject a password missing an uppercase character', () => {
      const result = loginSchema.safeParse({ email: 'analyst@aegis.bank.com', password: 'secure@99' });
      expect(result.success).toBe(false);
    });

    it('should reject a password missing a numeric character', () => {
      const result = loginSchema.safeParse({ email: 'analyst@aegis.bank.com', password: 'Secure@Pass' });
      expect(result.success).toBe(false);
    });

    it('should reject a password missing a special character', () => {
      const result = loginSchema.safeParse({ email: 'analyst@aegis.bank.com', password: 'Secure99' });
      expect(result.success).toBe(false);
    });

    it('should reject a password exceeding the 64-character DoS payload limit', () => {
      const bloatPayload = `A1!${'a'.repeat(62)}`;
      const result = loginSchema.safeParse({ email: 'analyst@aegis.bank.com', password: bloatPayload });
      expect(result.success).toBe(false);
    });
  });
});
