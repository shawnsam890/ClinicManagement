import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, PlusCircle } from "lucide-react";

// Define the schema for the invoice form
const invoiceFormSchema = z.object({
  patientId: z.string(),
  date: z.string().min(1, { message: "Date is required" }),
  items: z.array(
    z.object({
      description: z.string().min(1, { message: "Description is required" }),
      amount: z.coerce.number().min(0, { message: "Amount must be a positive number" }),
    })
  ),
  status: z.string().min(1, { message: "Status is required" }),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  totalAmount: z.coerce.number(),
  paidAmount: z.coerce.number().default(0),
  balanceAmount: z.coerce.number().default(0),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  patientId: string;
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export default function InvoiceForm({ patientId, initialData, onSave, onCancel }: InvoiceFormProps) {
  const [calculatingTotals, setCalculatingTotals] = useState(false);

  // Set default date to today if not provided
  const today = new Date().toISOString().split('T')[0];
  
  // Form setup
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      date: initialData.date || today,
      paidAmount: initialData.paidAmount || 0,
      balanceAmount: initialData.balanceAmount || 0
    } : {
      patientId,
      date: today,
      items: [
        { description: "", amount: 0 }
      ],
      status: "Pending",
      paymentMethod: "",
      notes: "",
      totalAmount: 0,
      paidAmount: 0,
      balanceAmount: 0
    }
  });
  
  // Field array for invoice items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  // Calculate totals and balance
  const calculateTotals = () => {
    setCalculatingTotals(true);
    
    // Calculate total amount
    const items = form.getValues("items");
    const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    form.setValue("totalAmount", total);
    
    // Calculate balance amount
    const paidAmount = form.getValues("paidAmount") || 0;
    const balance = total - paidAmount;
    form.setValue("balanceAmount", balance);
    
    // Update status automatically if paid amount equals total amount
    if (paidAmount >= total && total > 0) {
      form.setValue("status", "Paid");
    } else if (paidAmount > 0 && paidAmount < total) {
      form.setValue("status", "Partially Paid");
    } else if (total > 0) {
      form.setValue("status", "Pending");
    }
    
    setCalculatingTotals(false);
  };
  
  // Handle form submission
  const onSubmit = (data: InvoiceFormValues) => {
    // Final calculation
    calculateTotals();
    
    // Get the latest values after calculation
    const formData = form.getValues();
    onSave(formData);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Hidden patient ID field */}
        <input type="hidden" {...form.register("patientId")} value={patientId} />
        
        {/* Date */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Invoice Items */}
        <div>
          <h3 className="text-md font-medium mb-2">Invoice Items</h3>
          
          {/* Header */}
          <div className="grid grid-cols-[4fr_1fr_auto] gap-2 items-center mb-2">
            <FormLabel className="text-sm">Description</FormLabel>
            <FormLabel className="text-sm">Amount (₹)</FormLabel>
            <span></span>
          </div>
          
          {/* Items */}
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-[4fr_1fr_auto] gap-2 items-center mb-2">
              <FormField
                control={form.control}
                name={`items.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} placeholder="Service/Item description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`items.${index}.amount`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        min="0" 
                        placeholder="Amount" 
                        onChange={(e) => {
                          field.onChange(e);
                          // Recalculate totals when amount changes
                          setTimeout(() => calculateTotals(), 0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ description: "", amount: 0 })}
            className="mt-2"
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </div>
        
        {/* Amounts */}
        <div className="space-y-4 border-t pt-4">
          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel>Total Amount (₹)</FormLabel>
                  <div className="text-xl font-bold">
                    ₹{(field.value || 0).toFixed(2)}
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="paidAmount"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel>Paid Amount (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      min="0" 
                      className="w-32 text-right" 
                      onChange={(e) => {
                        field.onChange(e);
                        // Recalculate balances when paid amount changes
                        setTimeout(() => calculateTotals(), 0);
                      }}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="balanceAmount"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel>Balance Amount (₹)</FormLabel>
                  <div className="text-lg font-semibold text-red-600">
                    ₹{(field.value || 0).toFixed(2)}
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Payment Method - show only if status is Paid */}
        {form.watch("status") === "Paid" && (
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Add any notes here" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save Invoice</Button>
        </div>
      </form>
    </Form>
  );
}