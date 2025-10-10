import React, { useEffect, useMemo, useState } from "react";

import OnboardingClassifier from "./OnboardingClassifier";
import { ToasterProvider } from "./components/ui/Toaster";
import { ClassifierProvider } from "./features/classifier";

export default function App(): JSX.Element {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const content = useMemo(() => {
    return isMounted ? <OnboardingClassifier /> : <React.Fragment />;
  }, [isMounted]);

  return (
    <ClassifierProvider>
      <ToasterProvider>{content}</ToasterProvider>
    </ClassifierProvider>
  );
}
