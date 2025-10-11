import { Outlet, NavLink } from "react-router-dom";
import React from "react";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { error };
  }
  componentDidCatch(error: any, info: any) {
    console.error("UI ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: "#b91c1c" }}>
          <h2>Er ging iets mis</h2>
          <pre>{String(this.state.error?.message || this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children as any;
  }
}

export default function PublicLayout() {
  return (
    <div className="oc-container" style={{ padding: 24 }}>
      <nav style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/onboarding">Onboarding</NavLink>
        <NavLink to="/onboarding/fulfilment/calculatie">Calculatie</NavLink>
      </nav>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </div>
  );
}
