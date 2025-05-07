import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import Dashboard from "@/pages/Dashboard";
import PatientDatabase from "@/pages/PatientDatabase";
import NewPatientForm from "@/pages/NewPatientForm";
import PatientRecord from "@/pages/PatientRecord";
import ExistingPatients from "@/pages/ExistingPatients";
import LabWorks from "@/pages/LabWorks";
import Revenue from "@/pages/Revenue";
import StaffManagement from "@/pages/StaffManagement";
import Settings from "@/pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/patients" component={PatientDatabase} />
      <Route path="/patients/new" component={NewPatientForm} />
      <Route path="/patients/record/:patientId" component={PatientRecord} />
      <Route path="/patients/list" component={ExistingPatients} />
      <Route path="/lab-works" component={LabWorks} />
      <Route path="/revenue" component={Revenue} />
      <Route path="/staff" component={StaffManagement} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
