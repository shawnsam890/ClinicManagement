import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LabWork, LabInventoryItem } from "@shared/schema";

export function useLabWorks(patientId?: string | null) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Get all lab works or patient-specific lab works if patientId is provided
  // Add extra console logging to debug
  console.log(`useLabWorks hook called with patientId: ${patientId}`);
  
  // For this component, we'll always use the general endpoint
  // and filter the results in the component for more control
  const { data: labWorks, isLoading: isLoadingLabWorks } = useQuery<LabWork[]>({
    queryKey: ["/api/lab-works"],
  });

  // Get lab work by ID
  const getLabWorkById = (id: number) => {
    return useQuery<LabWork>({
      queryKey: [`/api/lab-works/${id}`],
      enabled: !!id,
    });
  };

  // Get lab works by patient ID
  const getLabWorksByPatientId = (patientId: string | null) => {
    // Only proceed if patientId is valid
    const isValidPatientId = patientId !== undefined && patientId !== null && patientId !== "";
    
    return useQuery<LabWork[]>({
      queryKey: isValidPatientId ? [`/api/patients/${patientId}/lab-works`] : ["/api/lab-works"],
      enabled: isValidPatientId,
    });
  };

  // Get all lab inventory
  const { data: labInventory, isLoading: isLoadingLabInventory } = useQuery<LabInventoryItem[]>({
    queryKey: ["/api/lab-inventory"],
  });

  // Create new lab work
  const createLabWork = async (labWorkData: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/lab-works", labWorkData);
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/lab-works"] });
      if (labWorkData.patientId) {
        queryClient.invalidateQueries({ queryKey: [`/api/patients/${labWorkData.patientId}/lab-works`] });
      }
      
      toast({
        title: "Success",
        description: "Lab work created successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error creating lab work:", error);
      toast({
        title: "Error",
        description: "Failed to create lab work",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update lab work
  const updateLabWork = async (id: number, labWorkData: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/lab-works/${id}`, labWorkData);
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/lab-works"] });
      queryClient.invalidateQueries({ queryKey: [`/api/lab-works/${id}`] });
      if (labWorkData.patientId) {
        queryClient.invalidateQueries({ queryKey: [`/api/patients/${labWorkData.patientId}/lab-works`] });
      }
      
      toast({
        title: "Success",
        description: "Lab work updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error updating lab work:", error);
      toast({
        title: "Error",
        description: "Failed to update lab work",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete lab work
  const deleteLabWork = async (id: number) => {
    setIsLoading(true);
    try {
      await apiRequest("DELETE", `/api/lab-works/${id}`, undefined);
      
      queryClient.invalidateQueries({ queryKey: ["/api/lab-works"] });
      
      toast({
        title: "Success",
        description: "Lab work deleted successfully",
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting lab work:", error);
      toast({
        title: "Error",
        description: "Failed to delete lab work",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Create inventory item
  const createInventoryItem = async (itemData: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/lab-inventory", itemData);
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/lab-inventory"] });
      
      toast({
        title: "Success",
        description: "Inventory item added successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error creating inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to add inventory item",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update inventory item
  const updateInventoryItem = async (id: number, itemData: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/lab-inventory/${id}`, itemData);
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/lab-inventory"] });
      
      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error updating inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to update inventory item",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete inventory item
  const deleteInventoryItem = async (id: number) => {
    setIsLoading(true);
    try {
      await apiRequest("DELETE", `/api/lab-inventory/${id}`, undefined);
      
      queryClient.invalidateQueries({ queryKey: ["/api/lab-inventory"] });
      
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    labWorks,
    isLoadingLabWorks,
    labInventory,
    isLoadingLabInventory,
    isLoading,
    getLabWorkById,
    getLabWorksByPatientId,
    createLabWork,
    updateLabWork,
    deleteLabWork,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
  };
}
