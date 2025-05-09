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
import PatientRecord from "@/pages/PatientRecordRedesigned";
import ExistingPatients from "@/pages/ExistingPatients";
import LabWorks from "@/pages/LabWorks";
import Revenue from "@/pages/Revenue";
import StaffManagement from "@/pages/StaffManagement";
import Settings from "@/pages/Settings";
// Appointments removed as per requirement
import AuthPage from "@/pages/auth-page-fixed";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import SimpleDashboard from "@/pages/SimpleDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={SimpleDashboard} />
      <Route path="/dashboard" component={SimpleDashboard} />
      <Route path="/patients" component={PatientDatabase} />
      <Route path="/patients/new" component={NewPatientForm} />
      <Route path="/patients/record/:patientId" component={PatientRecord} />
      <Route path="/patients/list" component={ExistingPatients} />
      <Route path="/lab-works" component={LabWorks} />
      <Route path="/revenue" component={Revenue} />
      <Route path="/staff" component={StaffManagement} />
      <Route path="/settings" component={Settings} />
      {/* Appointments route removed */}
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
