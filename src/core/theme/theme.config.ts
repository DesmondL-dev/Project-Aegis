// Canonical token contract for the Multi-tenant Theme Engine.
// All tenant payloads MUST conform to this interface to guarantee
// deterministic CSS Variable Injection at runtime.
export interface ThemeTokens {
  colorPrimary: string;
  colorPrimaryHover: string;
  colorSurface: string;
  colorSurfaceElevated: string;
  colorBackground: string;
  colorBorder: string;
  colorBorderFocus: string;
  colorTextPrimary: string;
  colorTextMuted: string;
}

// Tenant payload registry. Keys are opaque identifiers resolved at
// the application bootstrap boundary — never derived from user input.
export const TENANT_REGISTRY: Record<string, ThemeTokens> = {
  TENANT_ALPHA: {
    colorPrimary:         '#1a1a2e',
    colorPrimaryHover:    '#16213e',
    colorSurface:         '#ffffff',
    colorSurfaceElevated: '#f8f9fa',
    colorBackground:      '#f1f3f5',
    colorBorder:          '#dee2e6',
    colorBorderFocus:     '#1a1a2e',
    colorTextPrimary:     '#212529',
    colorTextMuted:       '#6c757d',
  },
  TENANT_BETA: {
    colorPrimary:         '#0f4c75',
    colorPrimaryHover:    '#1b6ca8',
    colorSurface:         '#ffffff',
    colorSurfaceElevated: '#f0f7ff',
    colorBackground:      '#e8f4fd',
    colorBorder:          '#b8d4ea',
    colorBorderFocus:     '#0f4c75',
    colorTextPrimary:     '#0d1b2a',
    colorTextMuted:       '#4a6fa5',
  },
};

// Canonical token key → CSS variable name mapping.
// Centralizing this contract prevents divergence between the
// injection engine and the Tailwind adapter layer.
export const TOKEN_TO_CSS_VAR: Record<keyof ThemeTokens, string> = {
  colorPrimary:         '--color-primary',
  colorPrimaryHover:    '--color-primary-hover',
  colorSurface:         '--color-surface',
  colorSurfaceElevated: '--color-surface-elevated',
  colorBackground:      '--color-background',
  colorBorder:          '--color-border',
  colorBorderFocus:     '--color-border-focus',
  colorTextPrimary:     '--color-text-primary',
  colorTextMuted:       '--color-text-muted',
};
