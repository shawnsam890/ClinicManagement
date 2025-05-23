import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import InvoiceForm from "./InvoiceForm";
import InvoiceDetails from "./InvoiceDetails";
import { Invoice, InvoiceItem } from "@shared/schema";

interface InvoiceProps {
  patientId: string;
  visitId?: number;
  patientName: string;
  invoices?: (Invoice & { items: InvoiceItem[] })[];
  onBack?: () => void;
}

export default function InvoiceComponent({ patientId, visitId, patientName, invoices = [], onBack }: InvoiceProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(
    invoices.length > 0 ? invoices[0].id : null
  );
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoice: any) => {
      try {
        // Create the invoice with paidAmount and balanceAmount
        console.log("Creating invoice:", invoice);
        
        // Ensure all fields are properly formatted
        const invoiceData = {
          patientId: invoice.patientId,
          visitId: invoice.visitId || null,
          date: invoice.date,
          totalAmount: Number(invoice.totalAmount) || 0,
          paidAmount: Number(invoice.paidAmount) || 0,
          balanceAmount: Number(invoice.balanceAmount) || 0,
          status: invoice.status || "Pending",
          paymentMethod: invoice.paymentMethod || null,
          notes: invoice.notes || ""
        };
        
        console.log("Sending invoice data:", invoiceData);
        const invoiceRes = await apiRequest("POST", "/api/invoices", invoiceData);
        const newInvoice = await invoiceRes.json();
        
        // Create each line item
        const itemPromises = invoice.items.map((item: any) => 
          apiRequest("POST", "/api/invoice-items", {
            description: item.description || "",
            amount: Number(item.amount) || 0,
            invoiceId: newInvoice.id
          })
        );
        
        await Promise.all(itemPromises);
        
        return newInvoice;
      } catch (error) {
        console.error("Error creating invoice:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate both the patient and visit specific invoice queries
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/invoices`] });
      if (visitId) {
        queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/invoices`] });
      }
      toast({
        title: "Invoice created",
        description: "New invoice has been created successfully.",
      });
      setShowForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create invoice",
        description: error.message || "There was an error creating the invoice.",
        variant: "destructive",
      });
    },
  });

  // Update invoice mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async (invoice: any) => {
      try {
        // Update the invoice with paid and balance amounts
        console.log("Updating invoice:", invoice);
        
        // Ensure all fields are properly formatted
        const invoiceData = {
          date: invoice.date,
          status: invoice.status || "Pending",
          totalAmount: Number(invoice.totalAmount) || 0,
          paidAmount: Number(invoice.paidAmount) || 0,
          balanceAmount: Number(invoice.balanceAmount) || 0,
          paymentMethod: invoice.paymentMethod || null,
          paymentDate: invoice.paymentDate || null,
          notes: invoice.notes || "",
        };
        
        console.log("Sending update data:", invoiceData);
        const invoiceRes = await apiRequest("PUT", `/api/invoices/${invoice.id}`, invoiceData);
        
        const updatedInvoice = await invoiceRes.json();
        
        // Handle items - first get existing items
        const existingItemsRes = await apiRequest("GET", `/api/invoices/${invoice.id}/items`);
        const existingItems = await existingItemsRes.json();
        
        // Identify items to update, add, or delete
        const itemsToUpdate = invoice.items.filter((item: any) => item.id);
        const itemsToAdd = invoice.items.filter((item: any) => !item.id);
        const itemsToDelete = existingItems.filter(
          (existingItem: any) => !invoice.items.some((item: any) => item.id === existingItem.id)
        );
        
        // Update existing items
        const updatePromises = itemsToUpdate.map((item: any) => 
          apiRequest("PUT", `/api/invoice-items/${item.id}`, {
            description: item.description || "",
            amount: Number(item.amount) || 0,
          })
        );
        
        // Add new items
        const addPromises = itemsToAdd.map((item: any) => 
          apiRequest("POST", "/api/invoice-items", {
            description: item.description || "",
            amount: Number(item.amount) || 0,
            invoiceId: invoice.id
          })
        );
        
        // Delete removed items
        const deletePromises = itemsToDelete.map((item: any) => 
          apiRequest("DELETE", `/api/invoice-items/${item.id}`)
        );
        
        await Promise.all([...updatePromises, ...addPromises, ...deletePromises]);
        
        return updatedInvoice;
      } catch (error) {
        console.error("Error updating invoice:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate both patient and visit specific invoice queries
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/invoices`] });
      if (visitId) {
        queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/invoices`] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update invoice",
        description: error.message || "There was an error updating the invoice.",
        variant: "destructive",
      });
    },
  });

  const handleSaveInvoice = (invoiceData: any) => {
    const invoice = {
      ...invoiceData,
      patientId,
      visitId: visitId || null,
    };
    
    createInvoiceMutation.mutate(invoice);
  };

  const handleUpdateInvoice = (invoiceData: any) => {
    updateInvoiceMutation.mutate(invoiceData);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center">
          {onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack} 
              className="mr-2"
            >
              Back
            </Button>
          )}
          <CardTitle>{visitId ? 'Visit Invoice' : `All Invoices for ${patientName}`}</CardTitle>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </CardHeader>
      
      <CardContent>
        {showForm ? (
          <InvoiceForm
            patientId={patientId}
            onSave={handleSaveInvoice}
            onCancel={() => setShowForm(false)}
          />
        ) : invoices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No invoices found for this patient.</p>
            <Button onClick={() => setShowForm(true)}>Create First Invoice</Button>
          </div>
        ) : (
          <Tabs defaultValue={selectedInvoice?.toString()} onValueChange={(value) => setSelectedInvoice(parseInt(value))}>
            <TabsList className="mb-4 w-full overflow-x-auto max-w-full flex">
              {invoices.map((invoice) => (
                <TabsTrigger key={invoice.id} value={invoice.id.toString()} className="min-w-fit">
                  Invoice #{invoice.id}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {invoices.map((invoice) => (
              <TabsContent key={invoice.id} value={invoice.id.toString()}>
                <InvoiceDetails
                  invoice={invoice}
                  onUpdate={handleUpdateInvoice}
                  patientName={patientName}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}