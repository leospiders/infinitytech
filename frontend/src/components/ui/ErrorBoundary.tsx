import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="neo-card p-8 m-4 text-center">
          <div className="text-danger font-bold text-sm mb-2">Something went wrong</div>
          <div className="text-muted text-xs mb-4">{this.state.error?.message}</div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="neo-btn py-2 px-4 text-xs font-semibold"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
