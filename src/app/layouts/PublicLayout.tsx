import { Outlet, NavLink } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <nav
        style={{
          display: "flex",
          gap: 24,
          marginBottom: 32,
          fontWeight: 600,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <NavLink
          to="/"
          style={({ isActive }) => ({
            color: isActive ? "#0b83cd" : "#66676b",
            textDecoration: "none",
          })}
        >
          Home
        </NavLink>

        <NavLink
          to="/onboarding"
          style={({ isActive }) => ({
            color: isActive ? "#0b83cd" : "#66676b",
            textDecoration: "none",
          })}
        >
          Onboarding
        </NavLink>

        <NavLink
          to="/onboarding/fulfilment/calculatie"
          style={({ isActive }) => ({
            color: isActive ? "#0b83cd" : "#66676b",
            textDecoration: "none",
          })}
        >
          Calculatie
        </NavLink>
      </nav>

      <Outlet />
    </div>
  );
}
