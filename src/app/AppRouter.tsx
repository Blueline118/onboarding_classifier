import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import Home from "./pages/Home";
import OnboardingIndex from "./pages/Onboarding/Index";

// --- DIAGNOSE: geen imports/lazy/alias op calculatie ---
function FulfilmentCalculatiePage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Calculatie (diagnose)</h1>
      <p>Router + assets laden goed. De classifier import staat tijdelijk uit.</p>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    // optioneel: simpel houden, geen errorElement
    children: [
      { path: "/", element: <Home /> },
      { path: "/onboarding", element: <OnboardingIndex /> },
      { path: "/onboarding/fulfilment/calculatie", element: <FulfilmentCalculatiePage /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
