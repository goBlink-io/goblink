'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="card p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'var(--error-bg)' }}
            >
              <AlertTriangle className="w-6 h-6" style={{ color: 'var(--error)' }} />
            </div>
            
            <div>
              <h3 className="text-h4 mb-2" style={{ color: 'var(--text-primary)' }}>
                Something went wrong
              </h3>
              <p className="text-body-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                {this.props.fallbackMessage || 
                  'An unexpected error occurred. Please try again.'}
              </p>
            </div>

            <button
              onClick={this.handleReset}
              className="btn btn-primary px-6 py-2.5"
            >
              Try Again
            </button>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left w-full">
                <summary className="text-tiny cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                  Error details (dev only)
                </summary>
                <pre className="mt-2 p-3 rounded-lg text-tiny overflow-auto" style={{ background: 'var(--elevated)', color: 'var(--text-muted)' }}>
                  {this.state.error.toString()}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
