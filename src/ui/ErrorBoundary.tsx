import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: (error: Error) => ReactNode;
}

interface State {
  error: Error | null;
}

/** Contains a crash to one part of the page (e.g. a single widget). */
export default class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Weborg: component crashed", error, info.componentStack);
  }

  override render() {
    return this.state.error
      ? this.props.fallback(this.state.error)
      : this.props.children;
  }
}
