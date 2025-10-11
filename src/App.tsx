import React, { useEffect, useMemo, useState } from "react";

import { ToasterProvider } from "./components/ui/Toaster";
import { ClassifierProvider } from "./features/classifier";
import AppRouter from "./app/AppRouter";

export default function App(): JSX.Element {
  const [isMounted, setIsMounted] = useState(false);
console.log("[BOOT] App render");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const content = useMemo(() => {
    // Router pas renderen na mount (voorkomt edge-cases met SSR-like checks)
    return isMounted ? <AppRouter /> : <React.Fragment />;
  }, [isMounted]);

  return (
    <ClassifierProvider>
      <ToasterProvider>{content}</ToasterProvider>
    </ClassifierProvider>
  );
}
