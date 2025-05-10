import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import DashboardTile from "@/components/DashboardTile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Import exact same images as shown in the design
import patientDatabaseImage from "@assets/Screenshot_2025-05-07-16-48-33-795_com.simpld.app-edit.jpg";
import labWorkImage from "@assets/Dental Extraction.jpg";
import revenueImage from "@assets/Screenshot 2025-05-10 003048.png";
import staffManagementImage from "@assets/Screenshot_2025-05-10-00-28-27-943_com.replit.app.jpg";
import settingsImage from "@assets/2 ss.png";
import doctorsImage from "@assets/root canal consent form.jpg";

export default function Dashboard() {
  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
  });

  const { data: labWorks } = useQuery({
    queryKey: ["/api/lab-works"],
  });

  const { data: invoices } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const { data: appointments } = useQuery({
    queryKey: ["/api/appointments"],
  });

  const { data: clinicInfo } = useQuery({
    queryKey: ["/api/settings/key/clinic_info"],
  });

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate today's appointments
  const todayAppointmentsCount = appointments?.filter((appointment: any) => 
    appointment.date === today
  )?.length || 0;

  // Calculate pending lab works
  const pendingLabWorksCount = labWorks?.filter((lab: any) => 
    lab.status === "pending" || lab.status === "in_progress"
  )?.length || 0;

  // Calculate today's revenue
  const todayRevenue = invoices?.filter((invoice: any) => 
    invoice.date === today
  )?.reduce((sum: number, invoice: any) => sum + invoice.totalAmount, 0) || 0;

  return (
    <Layout title="Dashboard">
      {/* Main content container - we position tile grid over the background image */}
      <div className="px-6 pt-[400px] pb-10 max-w-7xl mx-auto">
        {/* Dashboard Tiles - 3x2 Grid as shown in your design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          <DashboardTile
            title="Patient Database"
            imageSrc={patientDatabaseImage}
            href="/patients"
          />
          
          <DashboardTile
            title="Lab Work"
            imageSrc={labWorkImage}
            href="/lab-works"
          />
          
          <DashboardTile
            title="Staff Management"
            imageSrc={staffManagementImage}
            href="/staff"
          />
          
          <DashboardTile
            title="Revenue"
            imageSrc={revenueImage}
            href="/revenue"
          />
          
          <DashboardTile
            title="Doctors"
            imageSrc={doctorsImage}
            href="/doctors"
          />
          
          <DashboardTile
            title="Settings"
            imageSrc={settingsImage}
            href="/settings"
          />
        </div>
      </div>
    </Layout>
  );
}
