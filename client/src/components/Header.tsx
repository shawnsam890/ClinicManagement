import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Bell, 
  ChevronDown, 
  Settings, 
  Search, 
  User, 
  LogOut, 
  Info
} from "lucide-react";
// Import the healthy smile image
import dentalClinicImage from "@/assets/healthy-smile.png";

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
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
  // Split slogan into two lines
  const sloganParts = (clinicInfo?.settingValue?.slogan || "Creating Smiles, Creating Happiness").split(",");
  const firstSloganLine = sloganParts[0] || "Creating Smiles";
  const secondSloganLine = sloganParts[1]?.trim() || "Creating Happiness";
  
  // Split doctor greeting into two lines
  const greetingParts = (clinicInfo?.settingValue?.doctorGreeting || "Welcome Dr. Shawn").split(" ");
  const firstGreetingWord = greetingParts[0] || "Welcome";
  const restGreeting = greetingParts.slice(1).join(" ") || "Dr. Shawn";

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/patients?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    // Handle logout functionality - to be implemented
    navigate("/auth");
  };

  return (
    <header className="shadow-md">
      {/* Main Header with Image Background */}
      <div 
        className="relative bg-cover bg-center h-64 overflow-hidden" 
        style={{ backgroundImage: `url(${dentalClinicImage})`, backgroundSize: '100%', backgroundPosition: 'center 30%' }}
      >
        {/* Top Bar */}
        <div className="absolute top-4 left-0 right-0 z-20 px-4">
          <div className="bg-white/90 rounded-xl shadow-lg max-w-5xl mx-auto p-3 backdrop-blur-sm flex items-center justify-between">
            <h1 className="text-xl font-bold text-primary mr-4">{clinicName}</h1>
            
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  className="w-full rounded-full border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
            
            <div className="relative">
              <div 
                className="flex items-center cursor-pointer bg-primary text-white rounded-full px-3 py-1 hover:bg-primary/90 transition-all"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="w-8 h-8 bg-white rounded-full mr-2 flex items-center justify-center text-primary font-semibold">
                  Dr
                </div>
                <span className="text-white text-sm hidden md:inline-block">Dr. Shawn</span>
                <ChevronDown className="text-white ml-1 h-4 w-4" />
              </div>
              
              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-5 duration-200">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium">Dr. Shawn Sam</p>
                    <p className="text-xs text-gray-500">shawnsam890</p>
                  </div>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100">
                    <User className="h-4 w-4 mr-2" /> My Account
                  </button>
                  <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100">
                    <LogOut className="h-4 w-4 mr-2" /> Log Out
                  </button>
                  <div className="border-t">
                    <button className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100">
                      <Info className="h-4 w-4 mr-2" /> Software Info
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Translucent Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/30" style={{ mixBlendMode: 'multiply' }}></div>
        
        {/* Content Container */}
        <div className="container mx-auto h-full px-4 relative z-10 flex items-end pb-6">
          <div className="flex justify-between items-end w-full">
            {/* Left Side - Slogan */}
            <div className="text-white bg-black/20 p-3 rounded-lg backdrop-blur-sm shadow-lg inline-block">
              <p className="text-2xl font-medium drop-shadow-lg leading-tight">
                {firstSloganLine}
              </p>
              <p className="text-2xl font-medium drop-shadow-lg leading-tight">
                {secondSloganLine}
              </p>
            </div>
            
            {/* Right Side - Doctor Welcome */}
            <div className="text-white text-right">
              <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
                <p className="text-xl font-medium text-white leading-tight">
                  {firstGreetingWord}
                </p>
                <p className="text-xl font-bold text-white leading-tight">
                  {restGreeting}
                </p>
              </div>
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
