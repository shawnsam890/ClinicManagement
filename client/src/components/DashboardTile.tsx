import { ReactNode } from "react";
import { useLocation } from "wouter";

interface DashboardTileProps {
  title: string;
  description?: string;
  imageSrc: string;
  icon?: ReactNode;
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
      className="group relative cursor-pointer"
      onClick={() => navigate(href)}
    >
      {/* Image Card with Rounded Corners */}
      <div className="aspect-square overflow-hidden rounded-3xl shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-[1.02]">
        <img 
          src={imageSrc} 
          alt={title} 
          className="h-full w-full object-cover"
        />
      </div>
      
      {/* Title at Bottom */}
      <div className="text-center mt-3">
        <h3 className="text-lg font-medium text-gray-800">{title}</h3>
      </div>
    </div>
  );
}
