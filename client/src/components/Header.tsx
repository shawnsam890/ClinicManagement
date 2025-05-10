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
        className="relative bg-cover bg-center h-80 w-full overflow-hidden" 
        style={{ backgroundImage: `url(${dentalClinicImage})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }}
      >
        {/* Search Bar */}
        <div className="absolute top-4 left-0 right-0 z-20 px-4">
          <div className="max-w-sm mx-auto bg-white/40 rounded-xl shadow-md py-1.5 px-3 backdrop-blur-sm">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  className="w-full rounded-full border border-gray-300 pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
          </div>
        </div>
        
        {/* User Avatar */}
        <div className="absolute top-4 right-4 z-20">
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
        
        {/* Light subtle overlay for text legibility */}
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Content Container - Moved higher up */}
        <div className="container mx-auto h-full px-4 relative z-10 flex items-center pt-20">
          <div className="flex justify-between items-center w-full">
            {/* Left Side - Slogan with DM Sans font */}
            <div className="text-white inline-block">
              <p className="text-5xl leading-tight font-dm-sans" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.6)" }}>
                {firstSloganLine}
              </p>
              <p className="text-5xl leading-tight font-dm-sans" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.6)" }}>
                {secondSloganLine}
              </p>
            </div>
            
            {/* Right Side - Doctor Welcome with Canva Sans (Open Sans) font */}
            <div className="text-white text-right">
              <p className="text-2xl leading-tight font-canva-sans" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.6)" }}>
                {firstGreetingWord}
              </p>
              <p className="text-4xl font-bold leading-tight font-canva-sans" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.6)" }}>
                {restGreeting}
              </p>
            </div>
          </div>
        </div>
      
        {/* Only show back button if needed */}
        {showBackButton && (
          <div className="absolute bottom-4 left-4 z-20">
            <button
              onClick={() => navigate(backTo)}
              className="text-white hover:text-white/80 bg-black/20 p-2 rounded-full"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}