import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bell, ChevronDown, Settings, User } from "lucide-react";
import dentalClinicImage from "@assets/Dental Extraction.jpg";

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
    <header className="shadow-md">
      {/* Main Header with Image Background */}
      <div 
        className="relative bg-cover bg-center h-48 md:h-56" 
        style={{ backgroundImage: `url(${dentalClinicImage})` }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/30"></div>
        
        {/* Content Container */}
        <div className="container mx-auto h-full px-4 py-3 relative z-10">
          {/* Top Navigation */}
          <div className="flex justify-end items-center">
            <button className="text-white mr-4 hover:text-neutral-200 p-2 rounded-full hover:bg-white/10 transition-all">
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex items-center cursor-pointer bg-white/10 rounded-full px-3 py-1 hover:bg-white/20 transition-all">
              <div className="w-8 h-8 bg-white rounded-full mr-2 flex items-center justify-center text-primary font-semibold">
                DS
              </div>
              <span className="text-white text-sm hidden md:inline-block">Dr. Shawn</span>
              <ChevronDown className="text-white ml-1 h-4 w-4" />
            </div>
          </div>
          
          {/* Clinic Info Container */}
          <div className="flex justify-between items-end h-28 md:h-32 mt-6">
            {/* Left Side - Clinic Name & Slogan */}
            <div className="text-white">
              <h1 className="text-2xl md:text-3xl font-bold mb-2 font-heading drop-shadow-lg">
                {clinicName}
              </h1>
              <p className="text-lg md:text-xl font-medium drop-shadow-lg text-white/90 max-w-xs">
                {slogan}
              </p>
            </div>
            
            {/* Right Side - Doctor Welcome */}
            <div className="hidden md:block text-white text-right">
              <p className="text-xl font-medium drop-shadow-lg">
                {doctorGreeting}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subheader with Page Title */}
      <div className="bg-white border-b">
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
    </header>
  );
}
