import { Link } from "wouter";
import { Home, FileText, Microscope, Users, BarChart2, Settings } from "lucide-react";

export default function SimpleDashboard() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Purple sidebar */}
      <div className="w-20 bg-purple-700 flex flex-col items-center py-8 gap-8">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-purple-700"></div>
        </div>
        
        <nav className="flex flex-col gap-6">
          <Link href="/dashboard">
            <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white hover:bg-opacity-30 transition-all cursor-pointer">
              <Home size={20} />
            </div>
          </Link>
          <Link href="/patients">
            <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-white/70 hover:bg-white/10 transition-all cursor-pointer">
              <FileText size={20} />
            </div>
          </Link>
          <Link href="/lab-works">
            <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-white/70 hover:bg-white/10 transition-all cursor-pointer">
              <Microscope size={20} />
            </div>
          </Link>
          <Link href="/staff">
            <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-white/70 hover:bg-white/10 transition-all cursor-pointer">
              <Users size={20} />
            </div>
          </Link>
          <Link href="/revenue">
            <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-white/70 hover:bg-white/10 transition-all cursor-pointer">
              <BarChart2 size={20} />
            </div>
          </Link>
        </nav>
        
        <div className="mt-auto">
          <Link href="/settings">
            <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-white/70 hover:bg-white/10 transition-all cursor-pointer">
              <Settings size={20} />
            </div>
          </Link>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Dr. Shawn's Clinic Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Sample card */}
            <div className="bg-purple-700 rounded-3xl p-6 text-white">
              <h2 className="text-lg font-semibold mb-2">Patient Statistics</h2>
              <p>Total patients: 120</p>
              <p>New this month: 15</p>
            </div>
            
            {/* Sample card */}
            <div className="bg-pink-500 rounded-3xl p-6 text-white">
              <h2 className="text-lg font-semibold mb-2">Revenue</h2>
              <p>This month: $8,750</p>
              <p>Pending: $1,230</p>
            </div>
            
            {/* Sample card */}
            <div className="bg-indigo-600 rounded-3xl p-6 text-white">
              <h2 className="text-lg font-semibold mb-2">Lab Work</h2>
              <p>Pending: 7</p>
              <p>Completed: 22</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}