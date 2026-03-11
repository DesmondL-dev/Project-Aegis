/**
 * useDemoMode — Environment Routing (Feature Flagging)
 *
 * Non-destructive Onboarding Overlay trigger: safely decouples visual beacons
 * for non-technical recruiters from the core enterprise component tree.
 * Includes Session Storage persistence to survive Auth routing redirects.
 */
export const useDemoMode = (): { isDemoMode: boolean } => {
  // SSR / Environment safety check
  if (typeof window === "undefined") {
    return { isDemoMode: false };
  }

  // Sniff the current URL payload
  const params = new URLSearchParams(window.location.search);
  const hasDemoParam = params.get("mode") === "demo";

  // Lock the demographic flag into physical memory if detected
  if (hasDemoParam) {
    sessionStorage.setItem("aegis_demo_mode", "true");
  }

  // Evaluate the final state: true if in URL OR persisted in session
  const isDemoMode = hasDemoParam || sessionStorage.getItem("aegis_demo_mode") === "true";

  return { isDemoMode };
};