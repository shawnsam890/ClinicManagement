import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bell, ChevronDown, User } from "lucide-react";

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
  
  const { data: clinicInfo } = useQuery({
    queryKey: ["/api/settings/key/clinic_info"],
  });

  return (
    <header className="bg-primary shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          {showBackButton && (
            <button
              onClick={() => navigate(backTo)}
              className="text-white mr-3"
              aria-label="Back"
            >
              <ArrowLeft />
            </button>
          )}
          {!showBackButton && clinicInfo?.settingValue?.logo && (
            <div className="w-10 h-10 bg-white rounded-full mr-3 flex items-center justify-center overflow-hidden">
              <img
                src={clinicInfo.settingValue.logo}
                alt="Clinic Logo"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {!showBackButton && !clinicInfo?.settingValue?.logo && (
            <div className="w-10 h-10 bg-white rounded-full mr-3 flex items-center justify-center overflow-hidden">
              <User className="text-primary" />
            </div>
          )}
          <h1 className="text-white font-bold text-xl font-heading">{title}</h1>
        </div>
        <div className="flex items-center">
          <button className="text-white mr-4 hover:text-neutral-200">
            <Bell />
          </button>
          <div className="flex items-center cursor-pointer">
            <div className="w-8 h-8 bg-white rounded-full mr-2 flex items-center justify-center text-primary font-semibold">
              DS
            </div>
            <span className="text-white text-sm hidden md:inline-block">Dr. Shawn</span>
            <ChevronDown className="text-white ml-1 h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
