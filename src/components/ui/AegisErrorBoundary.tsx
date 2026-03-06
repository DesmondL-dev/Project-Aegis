import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

interface AegisErrorBoundaryProps {
  children: ReactNode;
}

interface AegisErrorBoundaryState {
  hasError: boolean;
}

// AegisErrorBoundary — Render Tree Isolation Layer.
//
// React Error Boundaries are implemented exclusively as class components.
// They intercept JavaScript errors thrown during the render phase of any
// descendant subtree, preventing the entire application from unmounting.
//
// Graceful Degradation: When an error is caught, the boundary renders a
// Secure Fallback UI instead of the crashed subtree. Sibling subtrees
// wrapped in separate boundaries remain fully operational — this is the
// Render Tree Isolation pattern. A Grid crash does not take down the Drawer.
export class AegisErrorBoundary extends Component<
  AegisErrorBoundaryProps,
  AegisErrorBoundaryState
> {
  state: AegisErrorBoundaryState = {
    hasError: false,
  };

  // Synchronous lifecycle — invoked during the render phase when a child
  // throws. Updates state to trigger a re-render of the fallback UI.
  // Must be a pure function with no side effects.
  static getDerivedStateFromError(): AegisErrorBoundaryState {
    return { hasError: true };
  }

  // Asynchronous lifecycle — invoked after an error has been caught.
  // Use this for side effects: logging to an observability pipeline,
  // reporting to a crash analytics service, etc. We simulate secure
  // console logging here — in production this would dispatch to Sentry,
  // Datadog RUM, or an internal telemetry endpoint.
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[AegisErrorBoundary] Render tree isolated. Error intercepted:', {
      message: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  // Resets the error state, allowing the user to attempt a re-render of
  // the previously crashed subtree. This is a soft recovery — the component
  // tree will be re-mounted from scratch. If the error was transient
  // (e.g., network race), the retry may succeed.
  handleReloadSegment = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[280px] rounded-xl border border-border bg-surface">
          <div className="flex flex-col items-center gap-4 p-6 text-center max-w-sm">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <ShieldAlert className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Component Isolated
              </h3>
              <p className="mt-2 text-xs text-text-muted">
                Secure fallback activated. This segment encountered an error and has been
                quarantined to prevent cascade failure.
              </p>
            </div>
            <button
              onClick={this.handleReloadSegment}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-border text-text-primary hover:bg-surface-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload Segment
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
