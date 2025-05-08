import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Trash2, Save, Download, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { InvoiceItem } from "@shared/schema";

interface InvoiceProps {
  patientId: string;
  visitId?: number;
  onBack?: () => void;
}

interface InvoiceItemForm extends Omit<InvoiceItem, 'id' | 'invoiceId'> {
  id?: number;
  tempId?: string;
}

export default function Invoice({ patientId, visitId, onBack }: InvoiceProps) {
  const { toast } = useToast();
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemForm[]>([]);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if there's an existing invoice for this visit
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        if (!visitId) return;
        
        const response = await fetch(`/api/patients/${patientId}/invoices`);
        const invoices = await response.json();
        
        // Find invoice matching the visitId
        const existingInvoice = invoices.find((inv: any) => inv.visitId === visitId);
        
        if (existingInvoice) {
          setInvoiceId(existingInvoice.id);
          
          // Fetch invoice items
          const itemsResponse = await fetch(`/api/invoices/${existingInvoice.id}/items`);
          const items = await itemsResponse.json();
          setInvoiceItems(items);
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
      }
    };
    
    fetchInvoice();
  }, [patientId, visitId]);

  const addItem = () => {
    const newItem: InvoiceItemForm = {
      item: '',
      description: '',
      amount: 0,
      tempId: Date.now().toString()
    };
    
    setInvoiceItems([...invoiceItems, newItem]);
  };

  const updateItem = (index: number, field: keyof InvoiceItemForm, value: string | number) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setInvoiceItems(updatedItems);
  };

  const removeItem = (index: number) => {
    const itemToRemove = invoiceItems[index];
    
    if (itemToRemove.id) {
      // If it's a saved item, delete from the server
      deleteInvoiceItem(itemToRemove.id);
    }
    
    // Remove from state
    const updatedItems = invoiceItems.filter((_, i) => i !== index);
    setInvoiceItems(updatedItems);
  };

  const deleteInvoiceItem = async (id: number) => {
    try {
      await apiRequest('DELETE', `/api/invoice-items/${id}`, undefined);
    } catch (error) {
      console.error("Error deleting invoice item:", error);
      toast({
        title: "Error",
        description: "Failed to delete invoice item.",
        variant: "destructive",
      });
    }
  };

  const calculateTotal = () => {
    return invoiceItems.reduce((sum, item) => sum + Number(item.amount), 0);
  };

  const saveInvoice = async () => {
    if (invoiceItems.length === 0) {
      toast({
        title: "Empty Invoice",
        description: "Please add at least one item to the invoice.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // If we don't have an invoice ID yet, create a new invoice
      if (!invoiceId) {
        const invoiceData = {
          patientId,
          visitId,
          date: new Date().toISOString().split('T')[0],
          totalAmount: calculateTotal(),
          status: "unpaid",
        };
        
        const response = await apiRequest('POST', '/api/invoices', invoiceData);
        const newInvoice = await response.json();
        setInvoiceId(newInvoice.id);
        
        // Create all invoice items
        for (const item of invoiceItems) {
          await apiRequest('POST', '/api/invoice-items', {
            invoiceId: newInvoice.id,
            item: item.item,
            description: item.description,
            amount: Number(item.amount)
          });
        }
      } else {
        // Update existing invoice
        await apiRequest('PUT', `/api/invoices/${invoiceId}`, {
          totalAmount: calculateTotal(),
        });
        
        // Update or create invoice items
        for (const item of invoiceItems) {
          if (item.id) {
            // Update existing item
            await apiRequest('PUT', `/api/invoice-items/${item.id}`, {
              item: item.item,
              description: item.description,
              amount: Number(item.amount)
            });
          } else {
            // Create new item
            await apiRequest('POST', '/api/invoice-items', {
              invoiceId,
              item: item.item,
              description: item.description,
              amount: Number(item.amount)
            });
          }
        }
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/invoices`] });
      
      toast({
        title: "Success",
        description: "Invoice saved successfully.",
      });
      
      // Refresh the invoice data
      if (invoiceId) {
        const itemsResponse = await fetch(`/api/invoices/${invoiceId}/items`);
        const items = await itemsResponse.json();
        setInvoiceItems(items);
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast({
        title: "Error",
        description: "Failed to save invoice.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="mt-6 bg-neutral-50 rounded-lg p-4 border border-neutral-300 print:border-none">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack} 
              className="mr-3"
            >
              ← Back
            </Button>
          )}
          <h3 className="text-lg font-semibold text-neutral-800 font-heading">Invoice</h3>
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={printInvoice}
            className="print:hidden"
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="print:hidden"
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button
            size="sm"
            onClick={saveInvoice}
            disabled={isLoading}
            className="print:hidden"
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table className="border-collapse">
          <TableHeader>
            <TableRow className="bg-neutral-100">
              <TableHead className="py-3 px-4 text-left text-sm font-semibold text-neutral-700 border-b">Item</TableHead>
              <TableHead className="py-3 px-4 text-left text-sm font-semibold text-neutral-700 border-b">Description</TableHead>
              <TableHead className="py-3 px-4 text-right text-sm font-semibold text-neutral-700 border-b">Amount</TableHead>
              <TableHead className="py-3 px-4 text-center text-sm font-semibold text-neutral-700 border-b print:hidden">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoiceItems.map((item, index) => (
              <TableRow key={item.id || item.tempId} className="border-b">
                <TableCell className="py-3 px-4 text-sm text-neutral-800">
                  <Input
                    value={item.item}
                    onChange={(e) => updateItem(index, 'item', e.target.value)}
                    className="border-none text-sm p-0 h-auto"
                  />
                </TableCell>
                <TableCell className="py-3 px-4 text-sm text-neutral-600">
                  <Input
                    value={item.description || ''}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="border-none text-sm p-0 h-auto"
                  />
                </TableCell>
                <TableCell className="py-3 px-4 text-sm text-neutral-800 text-right">
                  <Input
                    type="number"
                    value={item.amount.toString()}
                    onChange={(e) => updateItem(index, 'amount', parseFloat(e.target.value) || 0)}
                    className="border-none text-sm p-0 h-auto text-right"
                  />
                </TableCell>
                <TableCell className="py-3 px-4 text-center print:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell 
                colSpan={2} 
                className="py-3 px-4 text-sm font-semibold text-neutral-800 text-right"
              >
                Total
              </TableCell>
              <TableCell className="py-3 px-4 text-sm font-semibold text-neutral-800 text-right">
                ₹{calculateTotal().toLocaleString()}
              </TableCell>
              <TableCell className="print:hidden"></TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div className="mt-4 print:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            className="flex items-center text-primary hover:text-primary-dark"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
      </div>
    </div>
  );
}
