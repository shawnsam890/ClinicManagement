import { Button } from "@/components/ui/button";
import { Home, AlertTriangle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
      {/* Diagonal stripes background */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,hsl(var(--secondary)/.3)_25%,transparent_25%,transparent_50%,hsl(var(--secondary)/.3)_50%,hsl(var(--secondary)/.3)_75%,transparent_75%,transparent)] bg-[length:8px_8px] -z-10"></div>
      
      <div className="accent-card w-full max-w-xl mx-4 py-12">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-24 w-24 flex items-center justify-center bg-secondary/20 rounded-full mb-6">
            <AlertTriangle size={48} className="text-secondary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-gradient">404</span> Not Found
          </h1>
          <div className="h-1 w-20 bg-gradient-to-r from-primary to-secondary rounded-full my-4"></div>
          <p className="text-lg text-muted-foreground">
            We couldn't find the page you're looking for.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button variant="outline" className="group" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Go Back
            </Link>
          </Button>
          <Button className="pill-button flex items-center gap-2" asChild>
            <Link href="/">
              <Home size={16} />
              Return Home
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-24 h-24 rounded-full bg-primary/10 -z-10 blur-2xl"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-secondary/10 -z-10 blur-2xl"></div>
    </div>
  );
}
