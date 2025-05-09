import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import PatientDatabase from "@/pages/PatientDatabase";
import NewPatientForm from "@/pages/NewPatientForm";
import PatientRecord from "@/pages/PatientRecordRedesigned";
import ExistingPatients from "@/pages/ExistingPatients";
import LabWorks from "@/pages/LabWorks";
import Revenue from "@/pages/Revenue";
import StaffManagement from "@/pages/StaffManagement";
import Settings from "@/pages/Settings";
import BasicDashboard from "@/pages/BasicDashboard";
import AuthPage from "@/pages/auth-page-fixed";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <BasicDashboard />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
