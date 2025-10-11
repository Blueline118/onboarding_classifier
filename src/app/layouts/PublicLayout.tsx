import { Outlet, NavLink } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="oc-container" style={{ padding: 24 }}>
      <nav style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/onboarding">Onboarding</NavLink>
        <NavLink to="/onboarding/fulfilment/calculatie">Calculatie</NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
