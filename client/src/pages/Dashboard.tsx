import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import DashboardTile from "@/components/DashboardTile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FlaskRound, BarChart4, Settings, UserCog, Calendar, Clock, Activity, CreditCard } from "lucide-react";

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
      {/* Today's Overview - Now positioned directly under header */}
      <div className="-mt-6 mb-8">
        <Card className="bg-white shadow-lg border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-heading flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary" />
              Today's Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Appointments Card */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 shadow-sm border border-primary/10 transition-all hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 mb-1">Appointments Today</p>
                    <p className="text-3xl font-bold text-primary">{todayAppointmentsCount}</p>
                  </div>
                  <div className="bg-white rounded-full p-2 shadow-sm">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-neutral-500">{today.split('-').reverse().join('/')} | {new Date().toLocaleString('en-US', { weekday: 'long' })}</div>
              </div>
              
              {/* Pending Lab Works Card */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 shadow-sm border border-amber-200 transition-all hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 mb-1">Pending Lab Works</p>
                    <p className="text-3xl font-bold text-amber-600">{pendingLabWorksCount}</p>
                  </div>
                  <div className="bg-white rounded-full p-2 shadow-sm">
                    <Activity className="h-6 w-6 text-amber-500" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-neutral-500">
                  {pendingLabWorksCount === 0 ? "No pending lab work" : pendingLabWorksCount === 1 ? "1 lab work pending" : `${pendingLabWorksCount} lab works pending`}
                </div>
              </div>
              
              {/* Today's Revenue Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 shadow-sm border border-emerald-200 transition-all hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 mb-1">Today's Revenue</p>
                    <p className="text-3xl font-bold text-emerald-600">₹{todayRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-full p-2 shadow-sm">
                    <CreditCard className="h-6 w-6 text-emerald-500" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-neutral-500">
                  {todayRevenue === 0 ? "No revenue recorded today" : "Revenue as of " + new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
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
    </Layout>
  );
}
