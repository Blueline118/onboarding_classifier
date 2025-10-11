import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";

// Placeholders die je net gemaakt hebt
import Home from "./pages/Home";
import OnboardingIndex from "./pages/Onboarding/Index";

// Gebruik hier je werkende classifier op de calculatie-route
import OnboardingClassifier from "@/OnboardingClassifier";

function FulfilmentCalculatiePage() {
  return <OnboardingClassifier />;
}

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
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
