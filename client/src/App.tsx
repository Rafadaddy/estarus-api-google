import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppsScriptHome from "@/pages/apps-script-home";

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <AppsScriptHome />
    </TooltipProvider>
  );
}

export default App;
