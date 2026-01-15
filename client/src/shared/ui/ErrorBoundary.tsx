import * as React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "./button";
import { Alert, AlertTitle, AlertDescription } from "./alert";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<FallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
}

interface FallbackProps {
  error: Error;
  resetError: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component that catches React errors in child components
 * and displays a fallback UI with retry functionality.
 *
 * Features:
 * - Catches component errors during render, lifecycle, and constructors
 * - Displays user-friendly error messages
 * - Provides retry functionality
 * - Logs errors to console (can be extended to error reporting service)
 * - Supports custom fallback UI
 * - Graceful degradation
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you could send to an error reporting service:
    // reportErrorToService(error, errorInfo);
  }

  resetError = (): void => {
    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }

    // Reset error state
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      // Default fallback UI
      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * Default fallback UI displayed when an error is caught
 */
function DefaultErrorFallback({ error, resetError }: FallbackProps) {
  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Alert variant="error" className="mb-6">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold mb-2">
            Something went wrong
          </AlertTitle>
          <AlertDescription>
            <p className="mb-4 text-[#061623]/80">
              We're sorry, but something unexpected happened. The error has been
              logged and we'll look into it.
            </p>

            {isDevelopment && (
              <div className="mt-4 p-4 bg-white rounded border border-[#E3E3E3]">
                <p className="font-mono text-xs text-[#C1201C] mb-2">
                  <strong>Error:</strong> {error.message}
                </p>
                {error.stack && (
                  <pre className="font-mono text-xs text-[#061623]/70 overflow-x-auto max-h-40 overflow-y-auto">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>

        <div className="flex gap-3 justify-center">
          <Button
            onClick={resetError}
            variant="default"
            size="lg"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            onClick={() => (window.location.href = "/")}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to create an error boundary imperatively
 * Useful for handling async errors outside of React's render cycle
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error("Error caught by useErrorHandler:", error);
    setError(error);
  }, []);

  if (error) {
    throw error; // This will be caught by the nearest ErrorBoundary
  }

  return handleError;
}

/**
 * Compact error fallback for inline errors (not full-page)
 */
export function CompactErrorFallback({ error, resetError }: FallbackProps) {
  return (
    <Alert variant="error" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error Loading Component</AlertTitle>
      <AlertDescription>
        <p className="text-sm mb-2">{error.message}</p>
        <Button onClick={resetError} variant="outline" size="sm">
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}
