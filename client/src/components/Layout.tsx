import { ReactNode } from "react";
import Header from "./Header";

interface LayoutProps {
  children: ReactNode;
  title: string;
  showBackButton?: boolean;
  backTo?: string;
}

export default function Layout({
  children,
  title,
  showBackButton = false,
  backTo = "/dashboard",
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-100">
      <Header
        title={title}
        showBackButton={showBackButton}
        backTo={backTo}
      />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
