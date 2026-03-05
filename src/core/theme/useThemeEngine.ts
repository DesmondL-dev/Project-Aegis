import { useEffect } from 'react';
import {
  TENANT_REGISTRY,
  TOKEN_TO_CSS_VAR,
  type ThemeTokens,
} from './theme.config';

// O(1) CSS Variable Injection into the document root scope.
// Bypasses React re-render cycles entirely — the DOM is the state machine.
// Guard against window absence to prevent SSR hydration mismatch.
const injectThemePayload = (tokens: ThemeTokens): void => {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  (Object.keys(tokens) as Array<keyof ThemeTokens>).forEach((tokenKey) => {
    const cssVar = TOKEN_TO_CSS_VAR[tokenKey];
    root.style.setProperty(cssVar, tokens[tokenKey]);
  });
};

// Teardown: revert all injected variables to their CSS fallback values.
// Invoked during tenant context teardown or test isolation boundaries.
const ejectThemePayload = (): void => {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  Object.values(TOKEN_TO_CSS_VAR).forEach((cssVar) => {
    root.style.removeProperty(cssVar);
  });
};

interface UseThemeEngineOptions {
  // Tenant key must resolve against TENANT_REGISTRY.
  // Unresolved keys fail silently — no runtime throw —
  // to prevent a misconfigured tenant from crashing the application boundary.
  tenantKey: string;
}

export const useThemeEngine = ({ tenantKey }: UseThemeEngineOptions): void => {
  useEffect(() => {
    const tokens = TENANT_REGISTRY[tenantKey];

    if (!tokens) {
      console.warn(
        `[ThemeEngine] Unresolved tenant key: "${tenantKey}". CSS variables will retain fallback values.`
      );
      return;
    }

    injectThemePayload(tokens);

    // Teardown on unmount or tenant key change to prevent
    // stale variable pollution across tenant boundary transitions.
    return () => {
      ejectThemePayload();
    };
  }, [tenantKey]);
};
