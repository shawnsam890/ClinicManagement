import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import DashboardTile from "@/components/DashboardTile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FlaskRound, BarChart4, Settings, UserCog, Calendar, Clock, Activity, CreditCard } from "lucide-react";
import patientDatabaseImage from "@/assets/tiles/patient-database.jpg";
import labWorksImage from "@/assets/tiles/lab-works.jpg";
import staffManagementImage from "@/assets/tiles/staff-management.jpg";

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
      {/* Today's Overview - Now positioned with spacing after header */}
      <div className="mt-6 mb-10">
        <Card className="bg-white shadow-lg border-none overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full -ml-8 -mb-8"></div>
          
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-xl font-heading flex items-center">
              <div className="bg-primary/10 p-2 rounded-full mr-3">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              Today's Overview
              <span className="ml-auto text-sm font-normal text-neutral-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Appointments Card */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 shadow-sm border border-primary/10 transition-all hover:shadow-md relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-primary/5 rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-neutral-600 mb-1">Appointments Today</p>
                      <p className="text-3xl font-bold text-primary">{todayAppointmentsCount}</p>
                    </div>
                    <div className="bg-white rounded-full p-3 shadow-sm">
                      <Calendar className="h-7 w-7 text-primary" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></div>
                    <span className="text-xs text-neutral-600">
                      {todayAppointmentsCount === 0 
                        ? "No appointments scheduled" 
                        : todayAppointmentsCount === 1 
                          ? "1 appointment scheduled today" 
                          : `${todayAppointmentsCount} appointments scheduled`}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Pending Lab Works Card */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 shadow-sm border border-amber-200 transition-all hover:shadow-md relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-amber-100 rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-neutral-600 mb-1">Pending Lab Works</p>
                      <p className="text-3xl font-bold text-amber-600">{pendingLabWorksCount}</p>
                    </div>
                    <div className="bg-white rounded-full p-3 shadow-sm">
                      <Activity className="h-7 w-7 text-amber-500" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2"></div>
                    <span className="text-xs text-neutral-600">
                      {pendingLabWorksCount === 0 
                        ? "No pending lab work" 
                        : pendingLabWorksCount === 1 
                          ? "1 lab work pending review" 
                          : `${pendingLabWorksCount} lab works awaiting action`}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Today's Revenue Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 shadow-sm border border-emerald-200 transition-all hover:shadow-md relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-20 h-20 bg-emerald-100 rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-neutral-600 mb-1">Today's Revenue</p>
                      <p className="text-3xl font-bold text-emerald-600">₹{todayRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-full p-3 shadow-sm">
                      <CreditCard className="h-7 w-7 text-emerald-500" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2"></div>
                    <span className="text-xs text-neutral-600">
                      {todayRevenue === 0 
                        ? "No revenue recorded today" 
                        : `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')} - Latest revenue update`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-2xl font-bold text-neutral-800 mb-6 font-heading">Dashboard</h2>
      
      {/* Dashboard Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <DashboardTile
          title="Patient Database"
          description="Manage patient records, appointments, and histories"
          imageSrc={patientDatabaseImage}
          icon={<Users />}
          href="/patients"
        />
        
        <DashboardTile
          title="Lab Works"
          description="Track lab orders, results, and inventory"
          imageSrc={labWorksImage}
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
          imageSrc={staffManagementImage}
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
    </Layout>
  );
}
