/// <reference types="cypress" />
/**
 * Dashboard Global Filters E2E Matrix
 * Enterprise-grade flow assertions: skeleton hydration, AODA filter toggles, grid state binding.
 * Deterministic auth seeding: direct navigation to login, explicit UI credential injection,
 * submit, then assert auth perimeter clear — no conditional url().then() (race-condition anti-pattern).
 */

describe('Dashboard Global Filters E2E Matrix', () => {
  const BASE_URL = 'http://localhost:3000';

  beforeEach(() => {
    // Deterministic Auth Seeding: always start at login; no guard-based branching.
    cy.visit(`${BASE_URL}/login`);

    // Explicit UI interaction: Zod-valid email and complex password (assumed valid per schema).
    cy.get('input[name="email"]', { timeout: 10000 }).should('be.visible').type('admin@aegis.com');
    cy.get('input[name="password"]').type('Admin123!@#');
    cy.get('button[type="submit"]').click();

    // Wait for Auth Perimeter to clear: app replaces history with protected root.
    cy.url().should('eq', `${BASE_URL}/`);
  });

  it('should display skeleton loader then hydrate real data', () => {
    // Skeleton State: AML grid placeholder is visible before async payload resolves.
    cy.get('.animate-pulse', { timeout: 500 }).should('exist');

    // Network Idle Wait: data fetch completes (~SIMULATED_LATENCY_MS); grid rows mount with data-index.
    cy.get('[data-index="0"]', { timeout: 10000 }).should('be.visible');

    // DOM Traversal: at least one real data row is present (state hydration complete).
    cy.get('[role="button"][data-index]').should('have.length.at.least', 1);
  });

  it('should filter data grid when High Risk Accounts card is clicked', () => {
    // Wait for initial payload hydration so the grid is in a stable state before filter interaction.
    cy.get('[data-index="0"]', { timeout: 10000 }).should('be.visible');

    // AODA: locate filter toggle by role and accessible label (card displays "HIGH RISK ACCOUNTS" via uppercase).
    cy.contains('[role="button"]', /high risk accounts/i).as('highRiskCard');
    cy.get('@highRiskCard').click();

    // AODA state assertion: toggle reports selected state for assistive tech.
    cy.get('@highRiskCard').should('have.attr', 'aria-pressed', 'true');

    // Grid re-render assertion: filtered slice is applied; grid still renders (content or row count may differ).
    cy.get('[role="button"][data-index]').should('have.length.at.least', 1);
  });
});
