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
import AppointmentsPage from "@/pages/AppointmentsPage";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/patients" component={PatientDatabase} />
      <ProtectedRoute path="/patients/new" component={NewPatientForm} />
      <ProtectedRoute path="/patients/record/:patientId" component={PatientRecord} />
      <ProtectedRoute path="/patients/list" component={ExistingPatients} />
      <ProtectedRoute path="/lab-works" component={LabWorks} />
      <ProtectedRoute path="/revenue" component={Revenue} />
      <ProtectedRoute path="/staff" component={StaffManagement} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/appointments" component={AppointmentsPage} />
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
