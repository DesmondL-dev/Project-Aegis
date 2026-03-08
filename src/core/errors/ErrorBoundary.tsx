import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional teardown invoked when user clicks Reload; e.g. reset parent state that caused the throw. */
  onReset?: () => void;
}

/**
 * Containment shell for component-tree failures. Uses getDerivedStateFromError
 * and componentDidCatch (class-component-only APIs) to isolate blast radius
 * and enable graceful degradation. Resetting state unmounts the failed subtree
 * and re-mounts children on "Reload Component".
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Teardown / logging hook; state already set by getDerivedStateFromError.
    if (typeof console !== 'undefined' && console.error) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  handleReload = (): void => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <div
          className="rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-slate-900/95 p-6 shadow-sm"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 rounded-lg bg-red-50 dark:bg-red-950/30" aria-hidden>
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                Component error
              </h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                {this.state.error.message}
              </p>
              <button
                type="button"
                onClick={this.handleReload}
                className="mt-4 inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 bg-white dark:bg-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
                aria-label="Reload component and retry"
              >
                Reload Component
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
