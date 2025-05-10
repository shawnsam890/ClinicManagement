import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bell, ChevronDown, Search, Settings, User } from "lucide-react";
import smileBackground from "@/assets/smile-background.png";

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  backTo?: string;
}

export default function Header({
  title,
  showBackButton = false,
  backTo = "/dashboard",
}: HeaderProps) {
  const [, navigate] = useLocation();
  
  const { data: clinicInfo } = useQuery<{
    id: number;
    settingKey: string;
    settingValue: {
      name?: string;
      logo?: string;
      slogan?: string;
      doctorGreeting?: string;
      email?: string;
      phone?: string;
      address?: string;
    };
    category: string;
  }>({
    queryKey: ["/api/settings/key/clinic_info"],
  });

  const clinicName = clinicInfo?.settingValue?.name || "Dr. Shawn's Dental Clinic";
  const slogan = clinicInfo?.settingValue?.slogan || "Creating Smiles, Creating Happiness";
  const doctorGreeting = clinicInfo?.settingValue?.doctorGreeting || "Welcome Dr. Shawn";

  return (
    <header>
      {/* Main Header with Smile Background */}
      <div 
        className="relative bg-cover bg-center h-[500px]" 
        style={{ backgroundImage: `url(${smileBackground})` }}
      >
        {/* Top Navigation Bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10">
          {/* Clinic Name in Pill */}
          <div className="bg-white rounded-full px-6 py-3 shadow-lg">
            <h1 className="text-xl font-bold text-gray-800">
              {clinicName}
            </h1>
          </div>
          
          {/* Search Bar */}
          <div className="relative flex-grow max-w-md mx-8">
            <div className="bg-white rounded-full flex items-center shadow-lg px-4 py-2">
              <input 
                type="text" 
                placeholder="Search for Patients" 
                className="flex-grow border-none outline-none text-sm pl-2"
              />
              <Search className="h-5 w-5 text-gray-500" />
            </div>
          </div>
          
          {/* User Avatar */}
          <div className="bg-white rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold shadow-lg">
            DR
          </div>
        </div>
        
        {/* Left Side - Slogan */}
        <div className="absolute bottom-32 left-8 text-white">
          <p className="text-3xl font-light italic leading-relaxed">
            Creating Smiles<br />
            Creating Happiness
          </p>
        </div>
        
        {/* Right Side - Doctor Welcome */}
        <div className="absolute right-8 top-1/3 text-white">
          <p className="text-4xl font-bold mb-0">
            Welcome
          </p>
          <p className="text-5xl font-bold">
            Dr. Shawn
          </p>
        </div>
      </div>
      
      {/* Dashboard or Page Title rendered conditionally */}
      {title !== "Dashboard" && (
        <div className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center">
              {showBackButton && (
                <button
                  onClick={() => navigate(backTo)}
                  className="text-primary mr-3 hover:text-primary/80"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <h2 className="text-primary font-bold text-xl font-heading">{title}</h2>
            </div>
            
            {/* Settings Button */}
            <button 
              onClick={() => navigate("/settings")} 
              className="text-gray-600 hover:text-primary p-2 rounded-full hover:bg-gray-100 transition-all"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
