import React, { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white" role="alert">
        <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-8">SYSTEM ERROR</div>
        <h2 className="text-5xl md:text-7xl tracking-tighter mb-6 uppercase leading-none" style={{ fontWeight: 700 }}>Something broke</h2>
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-neutral-500 mb-4 max-w-lg leading-relaxed">The current view failed to render. Retry the view; if the problem persists, reload the page.</p>
        {this.state.error && <pre className="font-mono text-[10px] text-neutral-400 bg-neutral-50 border border-neutral-200 p-4 mb-8 max-w-lg overflow-auto text-left">{this.state.error.message}</pre>}
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={this.handleReset} className="px-10 py-4 bg-neutral-800 text-white font-mono text-xs uppercase tracking-widest hover:bg-neutral-700 transition-colors">Try Again</button>
          <button type="button" onClick={() => window.location.reload()} className="px-10 py-4 border border-neutral-300 bg-white text-neutral-800 font-mono text-xs uppercase tracking-widest hover:bg-neutral-50 transition-colors">Reload</button>
        </div>
      </div>
    );
  }
}
