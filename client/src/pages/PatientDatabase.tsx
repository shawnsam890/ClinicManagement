import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, FolderOpen } from "lucide-react";

export default function PatientDatabase() {
  const [, navigate] = useLocation();

  return (
    <Layout 
      title="Patient Database" 
      showBackButton={true}
      backTo="/dashboard"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* New Patient Registration */}
        <Card 
          className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          onClick={() => navigate("/patients/new")}
        >
          <div className="h-48 bg-neutral-200 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" 
              alt="New Patient Registration" 
              className="w-full h-full object-cover" 
            />
          </div>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-neutral-800 font-heading">New Patient Registration</h3>
              <UserPlus className="text-primary h-5 w-5" />
            </div>
            <p className="text-neutral-600">Register new patients with detailed information</p>
          </CardContent>
        </Card>
        
        {/* Existing Patient Database */}
        <Card 
          className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          onClick={() => navigate("/patients/list")}
        >
          <div className="h-48 bg-neutral-200 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1622902046580-2b47f47f5471?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" 
              alt="Existing Patient Database" 
              className="w-full h-full object-cover" 
            />
          </div>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-neutral-800 font-heading">Existing Patient Database</h3>
              <FolderOpen className="text-primary h-5 w-5" />
            </div>
            <p className="text-neutral-600">Access and manage existing patient records</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
