import { Link } from "wouter";
import { User, Beaker, BarChart2, Users, Settings, Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ModernHomePage() {
  const { user } = useAuth();

  // Dashboard tile data
  const dashboardTiles = [
    {
      title: "Patient Database",
      description: "Manage patient records, appointments, and histories",
      icon: <User className="text-blue-500" size={24} />,
      link: "/patients",
      image: "/attached_assets/start.png"
    },
    {
      title: "Lab Works",
      description: "Track lab orders, results, and inventory",
      icon: <Beaker className="text-blue-500" size={24} />,
      link: "/lab-works",
      image: "/attached_assets/start.png"
    },
    {
      title: "Revenue",
      description: "Manage billing, payments, and financial reports",
      icon: <BarChart2 className="text-blue-500" size={24} />,
      link: "/revenue",
      image: "/attached_assets/start.png"
    },
    {
      title: "Staff Management",
      description: "Manage staff details, schedule, and salary",
      icon: <Users className="text-blue-500" size={24} />,
      link: "/staff",
      image: "/attached_assets/start.png"
    },
    {
      title: "Settings",
      description: "Configure application preferences and settings",
      icon: <Settings className="text-blue-500" size={24} />,
      link: "/settings",
      image: "/attached_assets/start.png"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-500 text-white w-full py-3 px-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <User className="text-blue-500" size={24} />
          </div>
          <h1 className="text-xl font-bold">Dr. Shawn's Clinic</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="relative">
            <Bell size={22} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">3</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <Avatar>
              <AvatarFallback className="bg-blue-700 text-white">
                DS
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">Dr. Shawn</span>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
        
        {/* Dashboard tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardTiles.map((tile, index) => (
            <Link key={index} href={tile.link}>
              <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                {/* Image section */}
                <div className="h-48 bg-gray-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-700/80 to-indigo-600/80"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {tile.icon}
                    <span className="text-white font-bold text-xl ml-2">{tile.title}</span>
                  </div>
                </div>
                
                {/* Content section */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    {tile.icon}
                    <span className="ml-2">{tile.title}</span>
                  </h3>
                  <p className="text-gray-600">{tile.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}