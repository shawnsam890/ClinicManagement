import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Staff, StaffAttendance, StaffSalary } from "@shared/schema";
import { format } from "date-fns";

export function useStaff() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Get all staff
  const { data: staff, isLoading: isLoadingStaff } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  // Get staff by ID
  const getStaffById = (id: number) => {
    return useQuery<Staff>({
      queryKey: [`/api/staff/${id}`],
      enabled: !!id,
    });
  };

  // Get staff attendance
  const getStaffAttendance = (staffId: number) => {
    return useQuery<StaffAttendance[]>({
      queryKey: [`/api/staff/${staffId}/attendance`],
      enabled: !!staffId,
    });
  };

  // Get staff salary
  const getStaffSalary = (staffId: number) => {
    return useQuery<StaffSalary[]>({
      queryKey: [`/api/staff/${staffId}/salary`],
      enabled: !!staffId,
    });
  };

  // Create new staff
  const createStaff = async (staffData: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/staff", staffData);
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      
      toast({
        title: "Success",
        description: "Staff member added successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error creating staff:", error);
      toast({
        title: "Error",
        description: "Failed to add staff member",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update staff
  const updateStaff = async (id: number, staffData: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/staff/${id}`, staffData);
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      queryClient.invalidateQueries({ queryKey: [`/api/staff/${id}`] });
      
      toast({
        title: "Success",
        description: "Staff member updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error updating staff:", error);
      toast({
        title: "Error",
        description: "Failed to update staff member",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete staff
  const deleteStaff = async (id: number) => {
    setIsLoading(true);
    try {
      await apiRequest("DELETE", `/api/staff/${id}`, undefined);
      
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      
      toast({
        title: "Success",
        description: "Staff member deleted successfully",
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast({
        title: "Error",
        description: "Failed to delete staff member",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Add attendance record
  const addAttendance = async (staffId: number, date: string, present: boolean, remarks?: string) => {
    setIsLoading(true);
    try {
      const attendanceData = {
        staffId,
        date,
        present,
        remarks: remarks || "",
      };
      
      const response = await apiRequest("POST", "/api/attendance", attendanceData);
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: [`/api/staff/${staffId}/attendance`] });
      
      toast({
        title: "Success",
        description: "Attendance recorded successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error recording attendance:", error);
      toast({
        title: "Error",
        description: "Failed to record attendance",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update attendance record
  const updateAttendance = async (id: number, staffId: number, attendanceData: Partial<StaffAttendance>) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/attendance/${id}`, attendanceData);
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: [`/api/staff/${staffId}/attendance`] });
      
      toast({
        title: "Success",
        description: "Attendance updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast({
        title: "Error",
        description: "Failed to update attendance",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Process salary
  const processSalary = async (salaryData: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/salary", salaryData);
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: [`/api/staff/${salaryData.staffId}/salary`] });
      
      toast({
        title: "Success",
        description: "Salary processed successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error processing salary:", error);
      toast({
        title: "Error",
        description: "Failed to process salary",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update salary
  const updateSalary = async (id: number, staffId: number, salaryData: Partial<StaffSalary>) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/salary/${id}`, salaryData);
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: [`/api/staff/${staffId}/salary`] });
      
      toast({
        title: "Success",
        description: "Salary updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error updating salary:", error);
      toast({
        title: "Error",
        description: "Failed to update salary",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    staff,
    isLoadingStaff,
    isLoading,
    getStaffById,
    getStaffAttendance,
    getStaffSalary,
    createStaff,
    updateStaff,
    deleteStaff,
    addAttendance,
    updateAttendance,
    processSalary,
    updateSalary,
  };
}
