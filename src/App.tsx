/* eslint-disable */
import OnboardingClassifier from "./OnboardingClassifier";
import { ToasterProvider } from "./components/ui/Toaster";

export default function App() {
  return (
    <ToasterProvider>
      <OnboardingClassifier />
    </ToasterProvider>
  );
}
