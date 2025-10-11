import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";

// Pages
import Home from "./pages/Home";
import OnboardingIndex from "./pages/Onboarding/Index";
// in AppRouter.tsx, boven router:
import { Suspense, lazy } from "react";
const OnboardingClassifier = lazy(() => import("@/OnboardingClassifier"));
function FulfilmentCalculatiePage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Laden…</div>}>
      <OnboardingClassifier />
    </Suspense>
  );
}


function ErrorPage() {
  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
        Er ging iets mis
      </h1>
      <p>
        Probeer de pagina te herladen. Als dit blijft gebeuren, controleer de
        browser console (F12) voor de foutmelding.
      </p>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    errorElement: <ErrorPage />, // <-- vangt router runtime errors
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
