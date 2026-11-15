'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-rose-50/50 dark:bg-rose-950/10 rounded-3xl border border-rose-100 dark:border-rose-900/50">
          <div className="p-4 bg-rose-100 text-rose-600 rounded-2xl mb-6">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">Module Interrupted</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 font-medium">
            Something went wrong while loading this component. Our team has been notified.
          </p>
          <Button 
            onClick={() => this.setState({ hasError: false })}
            className="gap-2 rounded-xl bg-slate-900 hover:bg-slate-800"
          >
            <RotateCcw className="h-4 w-4" /> Try Reloading
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
