import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";

// Pages
import Home from "./pages/Home";
import OnboardingIndex from "./pages/Onboarding/Index";

// DIAGNOSE PAGE (plain text)
function FulfilmentCalculatiePage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Calculatie (diagnose)</h1>
      <p>Router werkt. Hier komt de classifier.</p>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",                    // explicit parent path
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },                                 // /
      { path: "onboarding", element: <OnboardingIndex /> },               // /onboarding
      { path: "onboarding/fulfilment/calculatie", element: <FulfilmentCalculatiePage /> }, // /onboarding/fulfilment/calculatie
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
