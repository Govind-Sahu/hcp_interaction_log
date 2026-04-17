import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dashboard } from "@/pages/dashboard/Dashboard";
import { HcpList } from "@/pages/hcps/HcpList";
import { HcpDetail } from "@/pages/hcps/HcpDetail";
import { InteractionList } from "@/pages/interactions/InteractionList";
import { LogInteraction } from "@/pages/interactions/LogInteraction";
import { InteractionDetail } from "@/pages/interactions/InteractionDetail";
import { EditInteraction } from "@/pages/interactions/EditInteraction";
import { AiAgent } from "@/pages/agent/AiAgent";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/hcps" component={HcpList} />
        <Route path="/hcps/:id" component={HcpDetail} />
        <Route path="/interactions" component={InteractionList} />
        <Route path="/interactions/log" component={LogInteraction} />
        <Route path="/interactions/:id" component={InteractionDetail} />
        <Route path="/interactions/:id/edit" component={EditInteraction} />
        <Route path="/ai-agent" component={AiAgent} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
