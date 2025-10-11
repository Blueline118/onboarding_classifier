import { Suspense, lazy } from "react";
import {
  createHashRouter,   // ⬅️ i.p.v. createBrowserRouter
  RouterProvider,
} from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";

// lazy load van je werkende classifier
const OnboardingClassifier = lazy(() => import("@/OnboardingClassifier"));

function FulfilmentCalculatiePage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Laden…</div>}>
      <OnboardingClassifier />
    </Suspense>
  );
}

const router = createHashRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <div style={{ padding: 24 }}>Home (coming soon)</div> },
      { path: "/onboarding", element: <div style={{ padding: 24 }}>Onboarding (coming soon)</div> },
      { path: "/onboarding/fulfilment/calculatie", element: <FulfilmentCalculatiePage /> },
      // Fallback zodat er altijd iets rendert:
      { path: "*", element: <FulfilmentCalculatiePage /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
