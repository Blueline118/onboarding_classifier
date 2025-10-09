/* eslint-disable */
import OnboardingClassifier from "./OnboardingClassifier";
import { ToasterProvider } from "./components/ui/Toaster";
import { ClassifierProvider } from "@/features/classifier";

export default function App() {
  return (
    <ClassifierProvider>
      <ToasterProvider>
        <OnboardingClassifier />
      </ToasterProvider>
    </ClassifierProvider>
  );
}
