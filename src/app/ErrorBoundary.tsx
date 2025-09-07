import { Component, ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error?: Error };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: undefined };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('App crashed:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-dvh grid place-items-center p-6">
          <div className="max-w-md rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md p-6 shadow-elev">
            <h1 className="text-xl font-semibold">Etwas ist schiefgelaufen</h1>
            <p className="mt-2 text-neutral-300">Die Ansicht konnte nicht geladen werden.</p>
            <button
              onClick={() => location.reload()}
              className="btn btn-primary mt-4"
            >
              Neu laden
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;