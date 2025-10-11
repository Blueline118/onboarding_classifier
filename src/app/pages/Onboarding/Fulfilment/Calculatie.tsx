import { Suspense, lazy } from "react";

const OnboardingClassifier = lazy(() => import("@/OnboardingClassifier"));

export default function FulfilmentCalculatie() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Laden…</div>}>
      <OnboardingClassifier />
    </Suspense>
  );
}
