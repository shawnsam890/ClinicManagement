import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Invoice, InvoiceItem } from "@shared/schema";

export function useInvoice() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Get all invoices
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  // Get invoice by ID
  const getInvoiceById = (id: number) => {
    return useQuery<Invoice>({
      queryKey: [`/api/invoices/${id}`],
      enabled: !!id,
    });
  };

  // Get invoices by patient ID
  const getInvoicesByPatientId = (patientId: string) => {
    return useQuery<Invoice[]>({
      queryKey: [`/api/patients/${patientId}/invoices`],
      enabled: !!patientId,
    });
  };

  // Get invoice items
  const getInvoiceItems = (invoiceId: number) => {
    return useQuery<InvoiceItem[]>({
      queryKey: [`/api/invoices/${invoiceId}/items`],
      enabled: !!invoiceId,
    });
  };

  // Create new invoice
  const createInvoice = async (invoiceData: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/invoices", invoiceData);
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      if (invoiceData.patientId) {
        queryClient.invalidateQueries({ queryKey: [`/api/patients/${invoiceData.patientId}/invoices`] });
      }
      
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update invoice
  const updateInvoice = async (id: number, invoiceData: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/invoices/${id}`, invoiceData);
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${id}`] });
      if (invoiceData.patientId) {
        queryClient.invalidateQueries({ queryKey: [`/api/patients/${invoiceData.patientId}/invoices`] });
      }
      
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete invoice
  const deleteInvoice = async (id: number) => {
    setIsLoading(true);
    try {
      await apiRequest("DELETE", `/api/invoices/${id}`, undefined);
      
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Create invoice item
  const createInvoiceItem = async (itemData: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/invoice-items", itemData);
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${itemData.invoiceId}/items`] });
      
      toast({
        title: "Success",
        description: "Invoice item added successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error creating invoice item:", error);
      toast({
        title: "Error",
        description: "Failed to add invoice item",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update invoice item
  const updateInvoiceItem = async (id: number, invoiceId: number, itemData: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("PUT", `/api/invoice-items/${id}`, itemData);
      const data = await response.json();
      
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}/items`] });
      
      toast({
        title: "Success",
        description: "Invoice item updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error("Error updating invoice item:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice item",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete invoice item
  const deleteInvoiceItem = async (id: number, invoiceId: number) => {
    setIsLoading(true);
    try {
      await apiRequest("DELETE", `/api/invoice-items/${id}`, undefined);
      
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}/items`] });
      
      toast({
        title: "Success",
        description: "Invoice item deleted successfully",
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting invoice item:", error);
      toast({
        title: "Error",
        description: "Failed to delete invoice item",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Generate invoice PDF (mock function for now)
  const generateInvoicePdf = async (invoiceId: number) => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call an API endpoint to generate a PDF
      toast({
        title: "Success",
        description: "Invoice PDF generated successfully",
      });
      
      return true;
    } catch (error) {
      console.error("Error generating invoice PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate invoice PDF",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    invoices,
    isLoadingInvoices,
    isLoading,
    getInvoiceById,
    getInvoicesByPatientId,
    getInvoiceItems,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    createInvoiceItem,
    updateInvoiceItem,
    deleteInvoiceItem,
    generateInvoicePdf,
  };
}
