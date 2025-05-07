import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useStaff } from "@/hooks/useStaff";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, DollarSign } from "lucide-react";

const salaryFormSchema = z.object({
  amount: z.coerce.number().min(0, "Amount must be a positive number"),
  bonus: z.coerce.number().min(0, "Bonus must be a positive number").optional(),
  deduction: z.coerce.number().min(0, "Deduction must be a positive number").optional(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentDate: z.string().min(1, "Payment date is required"),
  notes: z.string().optional(),
});

type SalaryFormValues = z.infer<typeof salaryFormSchema>;

interface SalaryFormProps {
  staffMember: any;
  onComplete?: () => void;
}

export default function SalaryForm({ staffMember, onComplete }: SalaryFormProps) {
  const { toast } = useToast();
  const { processSalary } = useStaff();
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<SalaryFormValues>({
    resolver: zodResolver(salaryFormSchema),
    defaultValues: {
      amount: staffMember?.salary || 0,
      bonus: 0,
      deduction: 0,
      paymentMethod: "bank_transfer",
      paymentDate: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  });

  const onSubmit = async (values: SalaryFormValues) => {
    setIsProcessing(true);
    try {
      const salaryData = {
        staffId: staffMember.id,
        amount: values.amount,
        bonus: values.bonus || 0,
        deduction: values.deduction || 0,
        netAmount: values.amount + (values.bonus || 0) - (values.deduction || 0),
        paymentMethod: values.paymentMethod,
        paymentDate: values.paymentDate,
        notes: values.notes || "",
        status: "paid",
      };
      
      await processSalary(salaryData);
      setSuccess(true);
      
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 2000);
    } catch (error) {
      console.error("Error processing salary:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateNetSalary = () => {
    const values = form.getValues();
    return values.amount + (values.bonus || 0) - (values.deduction || 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Process Salary Payment</CardTitle>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold text-green-600">Payment Processed!</h3>
            <p className="text-neutral-600 mt-2">
              Salary payment for {staffMember.name} has been successfully processed.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-neutral-50 p-4 rounded-md mb-6">
                <div className="flex items-center mb-2">
                  <DollarSign className="h-5 w-5 text-primary mr-2" />
                  <h3 className="font-medium text-lg">Salary Details</h3>
                </div>
                <p className="text-sm text-neutral-600 mb-4">
                  Processing salary payment for <span className="font-semibold">{staffMember.name}</span> ({staffMember.role})
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-500">Employee ID:</span>
                    <span className="ml-2 font-medium">{staffMember.id}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Base Salary:</span>
                    <span className="ml-2 font-medium">₹{staffMember.salary.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Join Date:</span>
                    <span className="ml-2 font-medium">{staffMember.joinDate}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Amount</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter amount" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(parseFloat(e.target.value));
                            form.trigger("amount");
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bonus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bonus</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter bonus amount (if any)" 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deduction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deduction</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter deduction amount (if any)" 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-neutral-100 p-4 rounded-md flex flex-col justify-center">
                  <div className="text-sm text-neutral-500">Net Salary</div>
                  <div className="text-2xl font-bold text-primary">₹{calculateNetSalary().toLocaleString()}</div>
                </div>

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes here"
                        className="h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isProcessing}
                  className="w-full md:w-auto"
                >
                  {isProcessing ? "Processing..." : "Process Salary Payment"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}