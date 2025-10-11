import { createHashRouter, RouterProvider } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";

// ⛔ weg met lazy + alias; ✅ directe relatieve import (prod-proof)
import OnboardingClassifier from "../OnboardingClassifier";

function FulfilmentCalculatiePage() {
  return <OnboardingClassifier />;
}

// Heel eenvoudige zichtbare pagina’s om router te bewijzen
function HomePage() {
  return <div style={{ padding: 24 }}>Home — router werkt ✅</div>;
}
function OnboardingIndex() {
  return <div style={{ padding: 24 }}>Onboarding — coming soon</div>;
}

const router = createHashRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/onboarding", element: <OnboardingIndex /> },
      { path: "/onboarding/fulfilment/calculatie", element: <FulfilmentCalculatiePage /> },
      // Fallback: toon iig de calculator i.p.v. leeg scherm
      { path: "*", element: <FulfilmentCalculatiePage /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
