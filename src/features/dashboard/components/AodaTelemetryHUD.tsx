import { useAodaTelemetry } from '../store/useAodaTelemetry';

// Embedded telemetry block within sidebar document flow to guarantee zero-occlusion.
// No fixed/absolute positioning; strict monochrome financial brutalism (Tier-1 bank).
// Must be aria-hidden to prevent feedback loop with the actual screen reader stream.

export const AodaTelemetryHUD = () => {
  const message = useAodaTelemetry((s) => s.message);
  const isVisible = useAodaTelemetry((s) => s.isVisible);

  if (!isVisible || !message) return null;

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className="w-full flex flex-col gap-2 p-3 mt-auto mb-4 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
    >
      <div className="font-bold text-slate-800 dark:text-slate-200 mb-1 font-mono text-[10px] leading-relaxed">
        [AODA_SYNC]
      </div>
      <p className="text-slate-600 dark:text-slate-400 font-mono text-[10px] leading-relaxed break-words">
        {message}
      </p>
    </div>
  );
};
