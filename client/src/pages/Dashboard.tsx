import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import DashboardTile from "@/components/DashboardTile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FlaskRound, BarChart4, Settings, UserCog, Calendar } from "lucide-react";

// Import dashboard images - we'll use the attached assets here
import patientDatabaseImage from "@assets/Screenshot_2025-05-07-16-48-33-795_com.simpld.app-edit.jpg";
import labWorkImage from "@assets/Dental Extraction.jpg";
import revenueImage from "@assets/Screenshot 2025-05-10 003048.png";
import staffManagementImage from "@assets/Screenshot_2025-05-10-00-28-27-943_com.replit.app.jpg";
import settingsImage from "@assets/2 ss.png";
// Using a JPEG instead of PDF for doctors image since PDFs can't be displayed as images
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
    <Layout title={clinicInfo?.settingValue?.name || "Dr. Shawn's Clinic"}>
      <h2 className="text-2xl font-bold text-neutral-800 mb-6 font-heading">Dashboard</h2>
      
      {/* Dashboard Tiles - 3x2 Grid as shown in design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
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
      
      {/* Quick Stats */}
      <Card className="mt-8 bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-heading">Today's Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-100 rounded-lg p-4">
              <p className="text-sm text-neutral-600">Appointments Today</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-semibold text-primary">{todayAppointmentsCount}</p>
                <span className="text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
            </div>
            <div className="bg-neutral-100 rounded-lg p-4">
              <p className="text-sm text-neutral-600">Pending Lab Works</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-semibold text-warning">{pendingLabWorksCount}</p>
                <span className="text-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
            </div>
            <div className="bg-neutral-100 rounded-lg p-4">
              <p className="text-sm text-neutral-600">Today's Revenue</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-semibold text-success">₹{todayRevenue.toLocaleString()}</p>
                <span className="text-success">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
