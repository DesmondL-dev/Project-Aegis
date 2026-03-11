/**
 * DemoBeacon — Non-destructive visual anchor for uninitiated users.
 *
 * Presentation-only overlay: renders a pulsing beacon and contextual copy when
 * demo mode is active (?mode=demo). Zero DOM footprint when not in demo mode.
 */

import { useDemoMode } from '../hooks/useDemoMode'; 

export const DemoBeacon = ({ message }: { message: string }) => {
  const { isDemoMode } = useDemoMode();

  if (!isDemoMode) return null;

  return (
    
    <div className="flex items-center gap-1.5 animate-pulse bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-md shadow-sm mr-1">
      
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      
      <span className="text-[10px] font-bold tracking-wide text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
        {message}
      </span>
    </div>
  );
};