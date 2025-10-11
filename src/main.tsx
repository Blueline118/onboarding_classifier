

// src/App.tsx
console.log("[BOOT] main.tsx start");

import { ToasterProvider } from "./components/ui/Toaster";
import { ClassifierProvider } from "./features/classifier";
import AppRouter from "./app/AppRouter";

export default function App() {
  return (
    <ClassifierProvider>
      <ToasterProvider>
        <AppRouter />
      </ToasterProvider>
    </ClassifierProvider>
  );
}
