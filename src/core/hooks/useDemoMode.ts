/**
 * useDemoMode — Environment Routing (Feature Flagging)
 *
 * Non-destructive Onboarding Overlay trigger: safely decouples visual beacons
 * for non-technical recruiters from the core enterprise component tree.
 * Includes Session Storage persistence to survive Auth routing redirects.
 */
export const useDemoMode = (): { isDemoMode: boolean } => {
  if (typeof window === "undefined") {
    return { isDemoMode: false };
  }
  const isDemoMode = localStorage.getItem("aegis_demo_mode") === "true";

  return { isDemoMode };
};