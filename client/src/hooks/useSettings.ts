import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Setting } from "@shared/schema";

export function useSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState<any>({});

  // Get clinic info
  const { data: clinicInfo } = useQuery<Setting>({
    queryKey: ["/api/settings/key/clinic_info"],
  });

  // Get patient ID format
  const { data: patientIdFormat } = useQuery<Setting>({
    queryKey: ["/api/settings/key/patient_id_format"],
  });

  // Get dropdown options
  const { data: dropdownOptionsSetting } = useQuery<Setting>({
    queryKey: ["/api/settings/key/dropdown_options"],
  });

  // Set dropdown options once they're loaded
  useEffect(() => {
    if (dropdownOptionsSetting?.settingValue) {
      setDropdownOptions(dropdownOptionsSetting.settingValue);
    }
  }, [dropdownOptionsSetting]);

  // Update clinic info
  const updateClinicInfo = async (clinicInfoData: any) => {
    setIsLoading(true);
    try {
      if (!clinicInfo) {
        throw new Error("Clinic info not found");
      }
      
      const response = await apiRequest("PUT", `/api/settings/${clinicInfo.id}`, {
        settingValue: {
          ...clinicInfo.settingValue,
          ...clinicInfoData,
        },
      });
      
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/settings/key/clinic_info"] });
      
      toast({
        title: "Success",
        description: "Clinic information updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error updating clinic info:", error);
      toast({
        title: "Error",
        description: "Failed to update clinic information",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update patient ID format
  const updatePatientIdFormat = async (formatData: any) => {
    setIsLoading(true);
    try {
      if (!patientIdFormat) {
        throw new Error("Patient ID format not found");
      }
      
      const response = await apiRequest("PUT", `/api/settings/${patientIdFormat.id}`, {
        settingValue: formatData,
      });
      
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/settings/key/patient_id_format"] });
      
      toast({
        title: "Success",
        description: "Patient ID format updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error updating patient ID format:", error);
      toast({
        title: "Error",
        description: "Failed to update patient ID format",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update dropdown options
  const updateDropdownOptions = async (options: any) => {
    setIsLoading(true);
    try {
      if (!dropdownOptionsSetting) {
        throw new Error("Dropdown options not found");
      }
      
      const response = await apiRequest("PUT", `/api/settings/${dropdownOptionsSetting.id}`, {
        settingValue: options,
      });
      
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/settings/key/dropdown_options"] });
      setDropdownOptions(options);
      
      toast({
        title: "Success",
        description: "Dropdown options updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error updating dropdown options:", error);
      toast({
        title: "Error",
        description: "Failed to update dropdown options",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Upload clinic logo
  const uploadClinicLogo = async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      
      const response = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload logo");
      }
      
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/settings/key/clinic_info"] });
      
      toast({
        title: "Success",
        description: "Clinic logo uploaded successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error uploading clinic logo:", error);
      toast({
        title: "Error",
        description: "Failed to upload clinic logo",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    clinicInfo: clinicInfo?.settingValue,
    patientIdFormat: patientIdFormat?.settingValue,
    dropdownOptions,
    isLoading,
    updateClinicInfo,
    updatePatientIdFormat,
    updateDropdownOptions,
    uploadClinicLogo,
  };
}
