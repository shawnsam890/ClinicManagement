import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, LogOut, Info, Search, Settings, User } from "lucide-react";
import { useState } from "react";
import smileBackground from "@/assets/DR_20250510_152157_0000.png";

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
  const [showUserMenu, setShowUserMenu] = useState(false);
  
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

  const handleLogout = () => {
    // Call the logout API endpoint
    fetch("/api/logout", {
      method: "POST",
      credentials: "include"
    }).then(() => {
      navigate("/auth");
    });
  };

  return (
    <header className="flex flex-col">
      {title === "Dashboard" ? (
        /* Full page header with background image for Dashboard */
        <div 
          className="bg-cover bg-center min-h-screen"
          style={{ backgroundImage: `url(${smileBackground})` }}
        >
          {/* Top Navigation Bar */}
          <nav className="flex items-center justify-between p-4">
            {/* Clinic Name in Pill */}
            <div className="bg-white/95 rounded-full px-6 py-3 shadow-lg">
              <h1 className="text-xl font-bold text-gray-800">
                {clinicName}
              </h1>
            </div>
            
            {/* Search Bar */}
            <div className="relative flex-grow max-w-md mx-8">
              <div className="bg-white/95 rounded-full flex items-center shadow-lg px-4 py-2">
                <input 
                  type="text" 
                  placeholder="Search for Patients" 
                  className="flex-grow border-none outline-none text-sm bg-transparent pl-2"
                />
                <Search className="h-5 w-5 text-gray-500" />
              </div>
            </div>
            
            {/* User Avatar Dropdown */}
            <div className="relative">
              <button 
                className="bg-white/95 rounded-full h-14 w-14 flex items-center justify-center text-xl font-bold shadow-lg"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                DR
              </button>
              
              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-5 duration-200">
                  <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <User className="h-4 w-4 mr-2" />
                    Account
                  </button>
                  <button 
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </button>
                  <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Info className="h-4 w-4 mr-2" />
                    Software Info
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      ) : (
        /* Simple header for non-dashboard pages */
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
