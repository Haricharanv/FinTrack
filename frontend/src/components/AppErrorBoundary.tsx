import { Component, type ReactNode } from 'react';
import { ArrowRight, Leaf } from 'lucide-react';

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="app-recovery">
          <Leaf size={36} />
          <h1>Let’s turn a fresh page.</h1>
          <p>This view couldn’t load. Your saved expenses are still in your notebook.</p>
          <button className="button button-primary" onClick={() => window.location.reload()}>
            Reload FinTrack <ArrowRight size={17} />
          </button>
        </main>
      );
    return this.props.children;
  }
}
