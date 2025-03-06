
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-3" />
          <h2 className="text-xl font-semibold mb-2">Något gick fel</h2>
          <p className="text-muted-foreground mb-4">{this.state.errorMessage || 'Ett fel uppstod vid laddning av sidan'}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Försök igen
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
