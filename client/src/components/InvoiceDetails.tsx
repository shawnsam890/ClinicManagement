import { useState } from "react";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Download, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import InvoiceForm from "./InvoiceForm";
import { Invoice, InvoiceItem } from "@shared/schema";

// Define color mapping for invoice status
const statusColors: Record<string, string> = {
  Paid: "bg-green-100 text-green-800 hover:bg-green-200",
  Pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  Cancelled: "bg-red-100 text-red-800 hover:bg-red-200"
};

interface InvoiceDetailsProps {
  invoice: Invoice & { items: InvoiceItem[] };
  onUpdate: (updatedInvoice: any) => void;
  patientName: string;
}

export default function InvoiceDetails({ invoice, onUpdate, patientName }: InvoiceDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Could not open print window. Please check your popup settings.",
        variant: "destructive"
      });
      return;
    }
    
    // Generate invoice HTML
    const invoiceContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${invoice.id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .invoice-header {
            text-align: center;
            margin-bottom: 30px;
          }
          .invoice-header h1 {
            margin: 0;
            color: #2563eb;
          }
          .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .invoice-details div {
            flex: 1;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f9fafb;
          }
          .totals {
            text-align: right;
            margin-top: 30px;
          }
          .total-amount {
            font-size: 18px;
            font-weight: bold;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <h1>Dr. Shawn's Dental Clinic</h1>
          <p>Invoice #${invoice.id}</p>
        </div>
        
        <div class="invoice-details">
          <div>
            <h3>Billed To:</h3>
            <p>${patientName}<br/>
            Patient ID: ${invoice.patientId}</p>
          </div>
          <div>
            <h3>Invoice Details:</h3>
            <p>
              Date: ${format(new Date(invoice.date), 'dd/MM/yyyy')}<br/>
              Status: ${invoice.status}<br/>
              ${invoice.paymentMethod ? `Payment Method: ${invoice.paymentMethod}<br/>` : ''}
              ${invoice.paymentDate ? `Payment Date: ${format(new Date(invoice.paymentDate), 'dd/MM/yyyy')}<br/>` : ''}
            </p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Rate (₹)</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td>${item.rate.toFixed(2)}</td>
                <td>${item.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <p class="total-amount">Total Amount: ₹${invoice.totalAmount.toFixed(2)}</p>
        </div>
        
        ${invoice.notes ? `
          <div>
            <h3>Notes:</h3>
            <p>${invoice.notes}</p>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Thank you for choosing Dr. Shawn's Dental Clinic!</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(invoiceContent);
    printWindow.document.close();
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
  
  const handleSaveEdit = (updatedInvoice: any) => {
    // Combine the updated invoice with the necessary IDs
    const finalInvoice = {
      ...updatedInvoice,
      id: invoice.id,
    };
    
    onUpdate(finalInvoice);
    setIsEditing(false);
    
    toast({
      title: "Invoice updated",
      description: "The invoice has been updated successfully.",
    });
  };
  
  if (isEditing) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Edit Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceForm 
            patientId={invoice.patientId}
            initialData={{
              ...invoice,
              items: invoice.items,
            }}
            onSave={handleSaveEdit}
            onCancel={() => setIsEditing(false)}
          />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Invoice #{invoice.id}</CardTitle>
          <CardDescription>
            Created on {format(new Date(invoice.date), 'MMMM dd, yyyy')}
          </CardDescription>
        </div>
        <Badge className={statusColors[invoice.status] || "bg-gray-100"}>
          {invoice.status}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-1">Patient</h3>
            <p className="font-medium">{patientName}</p>
            <p className="text-sm text-muted-foreground">{invoice.patientId}</p>
          </div>
          
          {invoice.status === 'Paid' && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Payment Details</h3>
              <p className="font-medium">{invoice.paymentMethod}</p>
              {invoice.paymentDate && (
                <p className="text-sm text-muted-foreground">
                  Paid on {format(new Date(invoice.paymentDate), 'dd/MM/yyyy')}
                </p>
              )}
            </div>
          )}
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Invoice Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted border-b">
                  <th className="text-left p-2">Description</th>
                  <th className="text-center p-2">Quantity</th>
                  <th className="text-right p-2">Rate (₹)</th>
                  <th className="text-right p-2">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">{item.description}</td>
                    <td className="text-center p-2">{item.quantity}</td>
                    <td className="text-right p-2">{item.rate.toFixed(2)}</td>
                    <td className="text-right p-2">{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td colSpan={3} className="text-right p-2">Total:</td>
                  <td className="text-right p-2">₹{invoice.totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {invoice.notes && (
          <div>
            <h3 className="font-semibold mb-1">Notes</h3>
            <p className="text-sm">{invoice.notes}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="default" size="sm" onClick={handlePrint}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </CardFooter>
    </Card>
  );
}