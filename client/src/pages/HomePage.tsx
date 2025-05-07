import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Upload } from "lucide-react";

export default function HomePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [clinicName, setClinicName] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Try to load existing clinic info
  useState(() => {
    const fetchClinicInfo = async () => {
      try {
        const response = await fetch("/api/settings/key/clinic_info");
        if (response.ok) {
          const data = await response.json();
          if (data?.settingValue) {
            setClinicName(data.settingValue.name || "");
            setLogoPreview(data.settingValue.logo || null);
          }
        }
      } catch (error) {
        console.error("Error fetching clinic info:", error);
      }
    };
    
    fetchClinicInfo();
  });

  const handleLogoUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Logo image must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setLogoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleEnterApp = async () => {
    if (!clinicName.trim()) {
      toast({
        title: "Clinic name required",
        description: "Please enter your clinic name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // First, check if clinic_info setting exists
      const response = await fetch("/api/settings/key/clinic_info");
      const data = await response.json();
      
      const clinicInfo = {
        name: clinicName,
        logo: logoPreview || "",
        address: data?.settingValue?.address || "",
        phone: data?.settingValue?.phone || "",
        email: data?.settingValue?.email || ""
      };
      
      if (data?.id) {
        // Update existing setting
        await apiRequest("PUT", `/api/settings/${data.id}`, {
          settingValue: clinicInfo
        });
      } else {
        // Create new setting
        await apiRequest("POST", "/api/settings", {
          settingKey: "clinic_info",
          settingValue: clinicInfo,
          category: "clinic_info"
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/settings/key/clinic_info"] });
      
      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving clinic info:", error);
      toast({
        title: "Error",
        description: "Failed to save clinic information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-primary-light to-primary py-10 px-4">
      <Card className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        <CardContent className="p-0">
          <h1 className="text-3xl font-bold text-primary mb-6 font-heading">
            Dr. Shawn's Clinic Management Software
          </h1>
          
          <div className="mb-8">
            <div 
              className="w-32 h-32 mx-auto bg-neutral-200 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-primary cursor-pointer relative overflow-hidden"
              onClick={handleLogoUpload}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Clinic Logo" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="text-center">
                  <Upload className="text-neutral-500 h-8 w-8 mx-auto" />
                  <p className="text-sm text-neutral-600 mt-1">Upload Logo</p>
                </div>
              )}
            </div>
            <p className="text-sm text-neutral-600">Click to upload your clinic logo</p>
          </div>
          
          <div className="relative mb-6">
            <Label 
              htmlFor="clinicName" 
              className="absolute text-neutral-600 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-3"
            >
              Clinic Name
            </Label>
            <Input
              id="clinicName"
              type="text"
              className="block w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder=" "
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
            />
          </div>
          
          <Button
            onClick={handleEnterApp}
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Enter Application"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
