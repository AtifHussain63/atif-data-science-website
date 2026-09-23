import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showDetails: false,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    // Ignore benign WebSocket/HMR disconnection errors common in iframe environments
    const msg = error?.message || error?.toString?.() || '';
    if (
      msg.includes('WebSocket closed without opened') ||
      msg.includes('failed to connect to websocket')
    ) {
      return { hasError: false, error: null, showDetails: false };
    }
    return { hasError: true, error, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const msg = error?.message || error?.toString?.() || '';
    if (
      msg.includes('WebSocket closed without opened') ||
      msg.includes('failed to connect to websocket')
    ) {
      return;
    }
    console.error('Unhandled Application Exception caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
    window.location.hash = '#home';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
            
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Something went wrong
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                An unexpected error occurred while rendering this page. You can retry the action or return to the safe homepage.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
              >
                <Home className="w-4 h-4" /> Return to Homepage
              </button>
            </div>

            {this.state.error && (
              <div className="pt-4 border-t border-slate-800 text-left">
                <button
                  type="button"
                  onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                  className="text-[11px] text-slate-400 hover:text-slate-300 flex items-center gap-1 mx-auto"
                >
                  Technical Details <ChevronDown className={`w-3.5 h-3.5 transition-transform ${this.state.showDetails ? 'rotate-180' : ''}`} />
                </button>
                {this.state.showDetails && (
                  <pre className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-red-400 overflow-x-auto font-mono max-h-40">
                    {this.state.error.toString()}
                  </pre>
                )}
              </div>
            )}

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
