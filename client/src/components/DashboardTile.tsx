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
      className="dashboard-tile bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      onClick={() => navigate(href)}
    >
      <div className="h-36 bg-neutral-200 overflow-hidden">
        <img src={imageSrc} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-neutral-800 font-heading">{title}</h3>
          <span className="text-primary">{icon}</span>
        </div>
        <p className="text-sm text-neutral-600">{description}</p>
      </div>
    </div>
  );
}
