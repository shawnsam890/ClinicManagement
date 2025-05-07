import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Patient, PatientVisit } from "@shared/schema";

export function usePatients() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Get all patients
  const { data: patients, isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Get patient by ID
  const getPatientById = (id: number) => {
    return useQuery<Patient>({
      queryKey: [`/api/patients/${id}`],
      enabled: !!id,
    });
  };

  // Get patient by patient ID
  const getPatientByPatientId = (patientId: string) => {
    return useQuery<Patient>({
      queryKey: [`/api/patients/patientId/${patientId}`],
      enabled: !!patientId,
    });
  };

  // Get patient visits
  const getPatientVisits = (patientId: string) => {
    return useQuery<PatientVisit[]>({
      queryKey: [`/api/patients/${patientId}/visits`],
      enabled: !!patientId,
    });
  };

  // Create new patient
  const createPatient = async (patientData: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/patients", patientData);
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      
      toast({
        title: "Success",
        description: "Patient created successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error creating patient:", error);
      toast({
        title: "Error",
        description: "Failed to create patient",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update patient
  const updatePatient = async (id: number, patientData: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/patients/${id}`, patientData);
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${id}`] });
      
      toast({
        title: "Success",
        description: "Patient updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error updating patient:", error);
      toast({
        title: "Error",
        description: "Failed to update patient",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete patient
  const deletePatient = async (id: number) => {
    setIsLoading(true);
    try {
      await apiRequest("DELETE", `/api/patients/${id}`, undefined);
      
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      
      toast({
        title: "Success",
        description: "Patient deleted successfully",
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast({
        title: "Error",
        description: "Failed to delete patient",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Create patient visit
  const createPatientVisit = async (visitData: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/visits", visitData);
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${visitData.patientId}/visits`] });
      
      toast({
        title: "Success",
        description: "Patient visit created successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error creating patient visit:", error);
      toast({
        title: "Error",
        description: "Failed to create patient visit",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update patient visit
  const updatePatientVisit = async (id: number, visitData: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/visits/${id}`, visitData);
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${visitData.patientId}/visits`] });
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${id}`] });
      
      toast({
        title: "Success",
        description: "Patient visit updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error updating patient visit:", error);
      toast({
        title: "Error",
        description: "Failed to update patient visit",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    patients,
    isLoadingPatients,
    isLoading,
    getPatientById,
    getPatientByPatientId,
    getPatientVisits,
    createPatient,
    updatePatient,
    deletePatient,
    createPatientVisit,
    updatePatientVisit,
  };
}
