import { ReactNode } from "react";
import { useLocation } from "wouter";

interface DashboardTileProps {
  title: string;
  description: string;
  imageSrc: string;
  icon: ReactNode;
  href: string;
}

export default function DashboardTile({
  title,
  description,
  imageSrc,
  icon,
  href,
}: DashboardTileProps) {
  const [, navigate] = useLocation();

  return (
    <div
      className="dashboard-tile bg-white rounded-xl shadow-md overflow-hidden cursor-pointer group relative"
      onClick={() => navigate(href)}
    >
      {/* Overlay effect on hover */}
      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-all duration-300 z-10"></div>
      
      {/* Image container with zoom effect */}
      <div className="h-32 bg-neutral-200 overflow-hidden">
        <img 
          src={imageSrc} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110" 
        />
      </div>
      
      {/* Content section that slides up slightly on hover */}
      <div className="p-3.5 transform transition-all duration-300 group-hover:-translate-y-1">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-base font-semibold text-neutral-800 font-heading group-hover:text-primary transition-colors duration-300">{title}</h3>
          <span className="text-primary transform transition-all duration-300 group-hover:scale-110">{icon}</span>
        </div>
        <p className="text-xs text-neutral-600 line-clamp-2">{description}</p>
        
        {/* Animated arrow indicator */}
        <div className="flex justify-end mt-1.5 overflow-hidden">
          <span className="text-primary text-xs font-medium transform translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-center">
            View 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </div>
      </div>
      
      {/* Shadow effect that increases on hover */}
      <div className="absolute inset-0 shadow-md group-hover:shadow-lg transition-shadow duration-300 -z-10"></div>
      
      {/* Pop-up animation on hover */}
      <div className="absolute inset-0 transform transition-transform duration-300 group-hover:-translate-y-1 -z-10"></div>
    </div>
  );
}
