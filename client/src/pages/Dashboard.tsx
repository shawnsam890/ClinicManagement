import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import DashboardTile from "@/components/DashboardTile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FlaskRound, BarChart4, Settings, UserCog, Calendar } from "lucide-react";

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
      
      {/* Dashboard Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <DashboardTile
          title="Patient Database"
          description="Manage patient records, appointments, and histories"
          imageSrc="https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
          icon={<Users />}
          href="/patients"
        />
        
        <DashboardTile
          title="Lab Works"
          description="Track lab orders, results, and inventory"
          imageSrc="https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300" 
          icon={<FlaskRound />}
          href="/lab-works"
        />
        
        <DashboardTile
          title="Revenue"
          description="Manage billing, payments, and financial reports"
          imageSrc="https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
          icon={<BarChart4 />}
          href="/revenue"
        />
        
        <DashboardTile
          title="Staff Management"
          description="Manage staff details, schedule, and salary"
          imageSrc="https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
          icon={<UserCog />}
          href="/staff"
        />
        
        {/* Appointments tile removed as per new workflow */}
        
        <DashboardTile
          title="Settings"
          description="Configure application preferences and options"
          imageSrc="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300"
          icon={<Settings />}
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
