import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Receipt, Calendar, User, Phone, RefreshCcw, Loader2, Save, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface InvoiceDetailsProps {
  invoiceId: number;
  patientId: string;
  readOnly?: boolean;
}

export default function InvoiceDetails({ invoiceId, patientId, readOnly = false }: InvoiceDetailsProps) {
  const queryClient = useQueryClient();
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const { toast } = useToast();
  
  // Refresh function
  const refreshData = () => {
    // Force refresh all related queries
    queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}/items`] });
    queryClient.invalidateQueries({ queryKey: [`/api/patients/id/${patientId}`] });
  };
  
  // Update invoice mutation
  const updateInvoiceStatus = useMutation({
    mutationFn: async ({ status, paymentMethod }: { status: string, paymentMethod?: string }) => {
      // Use PATCH endpoint for partial updates
      const updateData: any = { 
        status,
        paymentDate: status === 'paid' ? new Date().toISOString().split('T')[0] : null
      };
      
      // Add payment method for paid status (default to cash if none selected)
      if (status === 'paid') {
        updateData.paymentMethod = paymentMethod || 'cash';
      } else {
        // Clear payment method and date if not paid
        updateData.paymentMethod = null;
      }
      
      const response = await apiRequest('PATCH', `/api/invoices/${invoiceId}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      refreshData();
      setIsEditingStatus(false);
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive",
      });
      console.error("Error updating invoice:", error);
    }
  });
  
  // Fetch invoice details
  const { data: invoice, isLoading: isLoadingInvoice } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}`],  // Removed refreshTrigger
    queryFn: async () => {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (!res.ok) throw new Error("Failed to load invoice");
      return await res.json();
    }
  });

  // Fetch patient details for the invoice
  const { data: patient, isLoading: isLoadingPatient } = useQuery({
    queryKey: [`/api/patients/id/${patientId}`],  // Removed refreshTrigger
    queryFn: async () => {
      const res = await fetch(`/api/patients/id/${patientId}`);
      if (!res.ok) throw new Error("Failed to load patient");
      return await res.json();
    }
  });

  // Fetch invoice items
  const { data: invoiceItems = [], isLoading: isLoadingItems } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}/items`],  // Removed refreshTrigger
    queryFn: async () => {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}/items`);
        if (!res.ok) throw new Error("Failed to load invoice items");
        return await res.json();
      } catch (error) {
        console.error("Error fetching invoice items:", error);
        return [];
      }
    }
  });

  // UseEffect to initialize the component only when invoiceId changes
  useEffect(() => {
    // Only refresh once when the component mounts or invoiceId changes
    refreshData();
  }, [invoiceId]); // Only re-run when invoiceId changes
  
  // Separate useEffect to update selectedStatus when invoice data is loaded
  useEffect(() => {
    if (invoice) {
      if (!selectedStatus) {
        setSelectedStatus(invoice.status);
      }
      if (!selectedPaymentMethod && invoice.paymentMethod) {
        setSelectedPaymentMethod(invoice.paymentMethod);
      }
    }
  }, [invoice, selectedStatus, selectedPaymentMethod]);
  
  const isLoading = isLoadingInvoice || isLoadingPatient || isLoadingItems;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-6 text-gray-500">
        <p>Invoice not found or could not be loaded.</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2" 
          onClick={refreshData}
        >
          <RefreshCcw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl flex items-center">
              <Receipt className="mr-2 h-6 w-6" /> Invoice #{invoice.id}
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2" 
                onClick={refreshData}
                title="Refresh invoice data"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription className="mt-1">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" /> {invoice.date}
              </div>
              <Badge 
                className={`mt-2 ${invoice.status === "paid" ? "bg-green-500" : "bg-red-500"}`}
                variant={invoice.status === "paid" ? "default" : "destructive"}
              >
                {invoice.status.toUpperCase()}
              </Badge>
            </CardDescription>
          </div>
          <div className="text-right">
            <h3 className="font-semibold">Total Amount</h3>
            <p className="text-2xl font-bold text-primary">
              ₹{invoice.totalAmount?.toFixed(2) || "0.00"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Patient Information</h3>
            {patient ? (
              <div className="space-y-2">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">{patient.name}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{patient.phoneNumber || "No phone number"}</span>
                </div>
                <div className="text-sm">
                  Patient ID: {patient.patientId}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Patient information not available</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Payment Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                {!readOnly && isEditingStatus ? (
                  <div className="flex items-center space-x-2">
                    <Select
                      value={selectedStatus}
                      onValueChange={(value) => {
                        setSelectedStatus(value);
                        // Initialize payment method when changing to paid status
                        if (value === 'paid' && !selectedPaymentMethod) {
                          setSelectedPaymentMethod('cash');
                        }
                      }}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* Show payment method selector when status is set to paid */}
                    {selectedStatus === 'paid' && (
                      <Select
                        value={selectedPaymentMethod}
                        onValueChange={setSelectedPaymentMethod}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Payment Method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="netbanking">Net Banking</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Button 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => updateInvoiceStatus.mutate({ status: selectedStatus, paymentMethod: selectedPaymentMethod })}
                      disabled={updateInvoiceStatus.isPending}
                    >
                      {updateInvoiceStatus.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      size="sm"
                      variant="ghost" 
                      className="h-8 w-8 p-0" 
                      onClick={() => {
                        setIsEditingStatus(false);
                        setSelectedStatus(invoice.status);
                        // Reset payment method to match invoice
                        setSelectedPaymentMethod(invoice.paymentMethod || '');
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Badge 
                      className={invoice.status === "paid" ? "bg-green-600" : 
                               invoice.status === "cancelled" ? "bg-gray-500" : "bg-amber-500"}
                    >
                      {invoice.status.toUpperCase()}
                    </Badge>
                    {!readOnly && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="h-6 w-6 p-0" 
                        onClick={() => {
                          setSelectedStatus(invoice.status);
                          setIsEditingStatus(true);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{invoice.date}</span>
              </div>
              {invoice.paymentMethod && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span>{invoice.paymentMethod}</span>
                </div>
              )}
              {invoice.paymentDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Date</span>
                  <span>{invoice.paymentDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div>
          <h3 className="text-lg font-semibold mb-4">Invoice Items</h3>
          {invoiceItems && invoiceItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceItems.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">₹{item.rate?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell className="text-right">₹{item.amount?.toFixed(2) || "0.00"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 border rounded-md">
              <p className="text-muted-foreground">No invoice items found</p>
            </div>
          )}
        </div>

        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>₹{invoice.totalAmount?.toFixed(2) || "0.00"}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-6">
            <Label>Notes</Label>
            <div className="mt-1 p-3 bg-muted/30 rounded-md text-sm">
              {invoice.notes}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}