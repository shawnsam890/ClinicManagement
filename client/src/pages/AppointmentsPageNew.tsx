import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAppointmentSchema } from "@shared/schema";
import { z } from "zod";
import { 
  Loader2, 
  Calendar, 
  Edit, 
  Paperclip, 
  FileCheck, 
  Receipt, 
  Plus,
  Trash,
  RefreshCcw,
  Separator,
  Badge,
} from "lucide-react";
import PrescriptionForm from "@/components/PrescriptionForm";
import InvoiceDetails from "@/components/InvoiceDetails";

// Extended schema with validation
const appointmentFormSchema = insertAppointmentSchema.extend({
  id: z.number().optional(),
  patientId: z.string().min(1, { message: "Patient ID is required" }),
  date: z.string().min(1, { message: "Date is required" }),
  doctorName: z.string().min(1, { message: "Doctor name is required" }),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export default function AppointmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Get all appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["/api/appointments"],
    queryFn: async () => {
      const res = await fetch("/api/appointments");
      if (!res.ok) throw new Error("Failed to load appointments");
      return await res.json();
    },
  });

  // Get all patients for search
  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["/api/patients"],
    queryFn: async () => {
      const res = await fetch("/api/patients");
      if (!res.ok) throw new Error("Failed to load patients");
      return await res.json();
    },
  });

  // Get dropdown settings
  const { data: dropdownSettings } = useQuery({
    queryKey: ["/api/settings/key/dropdown_options"],
    queryFn: async () => {
      const res = await fetch("/api/settings/key/dropdown_options");
      if (!res.ok) throw new Error("Failed to load dropdown options");
      return await res.json();
    },
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormValues) => {
      const res = await apiRequest("POST", "/api/appointments", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create appointment");
      }
      return await res.json();
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      
      // Automatically create a patient visit record
      try {
        const visitData = {
          patientId: data.patientId,
          date: data.date,
          chiefComplaint: data.treatmentDone || "Routine check-up",
          notes: data.notes,
        };
        
        const visitRes = await apiRequest("POST", "/api/visits", visitData);
        if (!visitRes.ok) {
          throw new Error("Failed to create patient visit");
        }
        
        const visitResult = await visitRes.json();
        
        // Update the appointment with the visit ID
        const updateData = {
          ...data,
          visitId: visitResult.id,
        };
        
        // Update with visit ID
        const updatedAppointment = await apiRequest("PUT", `/api/appointments/${data.id}`, updateData);
        const updatedAppointmentData = await updatedAppointment.json();
        
        // Create an invoice
        const newInvoice = {
          patientId: data.patientId,
          date: data.date,
          totalAmount: 0,
          status: "pending",
          visitId: visitResult.id,
          notes: `Invoice for appointment on ${data.date}`
        };
        
        const invoiceRes = await apiRequest("POST", "/api/invoices", newInvoice);
        
        if (invoiceRes.ok) {
          const createdInvoice = await invoiceRes.json();
          
          // Add a default invoice item
          const invoiceItem = {
            invoiceId: createdInvoice.id,
            description: data.treatmentDone || "Dental consultation",
            quantity: 1,
            rate: 500, // Default rate
            amount: 500 // Default amount
          };
          
          await apiRequest("POST", "/api/invoice-items", invoiceItem);
          
          // Update invoice with the total amount
          await apiRequest("PUT", `/api/invoices/${createdInvoice.id}`, {
            ...createdInvoice,
            totalAmount: 500
          });
          
          // Update appointment with invoice ID
          await apiRequest("PUT", `/api/appointments/${data.id}`, {
            ...updatedAppointmentData,
            invoiceId: createdInvoice.id
          });
        }
        
        // Refetch appointments
        await queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      } catch (error) {
        console.error("Error processing appointment:", error);
      }
      
      toast({
        title: "Success",
        description: "Appointment created successfully with visit and invoice",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update appointment mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/appointments/${data.id}`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update appointment");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Success",
        description: "Appointment updated successfully",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/appointments/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete appointment");
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Success",
        description: "Appointment deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get patient name by ID
  const getPatientName = (patientId: string) => {
    const patient = patients?.find((p: any) => p.patientId === patientId);
    return patient ? patient.name : "Unknown";
  };

  // Handle editing an appointment
  const handleEditAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    
    // Set form values for editing
    form.setValue("id", appointment.id);
    form.setValue("patientId", appointment.patientId);
    form.setValue("date", appointment.date);
    form.setValue("doctorName", appointment.doctorName || "");
    form.setValue("treatmentDone", appointment.treatmentDone || null);
    form.setValue("notes", appointment.notes || null);
    form.setValue("visitId", appointment.visitId || null);
    form.setValue("invoiceId", appointment.invoiceId || null);
    
    // Open edit dialog
    setIsDialogOpen(true);
  };
  
  // Handle deleting an appointment
  const handleDeleteAppointment = (id: number) => {
    if (window.confirm("Are you sure you want to delete this appointment? This action cannot be undone.")) {
      deleteAppointmentMutation.mutate(id);
    }
  };

  // Form setup
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      id: undefined,
      patientId: "",
      date: format(new Date(), "yyyy-MM-dd"),
      doctorName: "",
      treatmentDone: null,
      notes: null,
      visitId: null,
      invoiceId: null,
      attachments: null,
      consentForms: null,
    },
  });

  const onSubmit = (data: AppointmentFormValues) => {
    // If id exists, it's an update
    if (data.id) {
      updateAppointmentMutation.mutate(data);
    } else {
      // It's a new appointment - visit and invoice will be auto-created
      createAppointmentMutation.mutate(data);
    }
  };

  // Filter patients by search term
  const filteredPatients = patients?.filter(
    (patient: any) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.phoneNumber &&
        patient.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Reset form when dialog is closed
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Only reset if we're closing and not editing
      if (!form.getValues("id")) {
        form.reset();
      }
    }
    setIsDialogOpen(open);
  };

  return (
    <div className="container mx-auto p-6 overflow-auto h-screen pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Appointments</h1>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              form.reset();
              setSelectedAppointment(null);
            }}>
              Create Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{form.getValues("id") ? "Edit Appointment" : "Create New Appointment"}</DialogTitle>
              <DialogDescription>
                {form.getValues("id") ? "Edit appointment details" : "Schedule a new appointment for a patient"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Tabs defaultValue="patient-details" className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="patient-details">Patient & Details</TabsTrigger>
                  <TabsTrigger value="prescription">Prescription</TabsTrigger>
                  <TabsTrigger value="invoice">Invoice</TabsTrigger>
                </TabsList>
                
                <TabsContent value="patient-details" className="space-y-4 py-4">
                  <h3 className="text-lg font-semibold border-b pb-2 mb-2">Patient Information & Basic Details</h3>
                  
                  {/* Patient Selection Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                      <Label htmlFor="patientSearch">Search Patient</Label>
                      <Input
                        id="patientSearch"
                        placeholder="Search by name, ID, or phone number"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-2"
                      />

                      {searchTerm && filteredPatients && (
                        <div className="max-h-40 overflow-y-auto border rounded-md p-2 mb-4">
                          {filteredPatients.length > 0 ? (
                            filteredPatients.map((patient: any) => (
                              <div
                                key={patient.id}
                                className="p-2 hover:bg-gray-100 cursor-pointer rounded-md"
                                onClick={() => {
                                  form.setValue("patientId", patient.patientId);
                                  setSearchTerm("");
                                }}
                              >
                                <p className="font-medium">
                                  {patient.name} ({patient.patientId})
                                </p>
                                <p className="text-sm text-gray-500">
                                  {patient.phoneNumber}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-center py-2 text-gray-500">
                              No patients found
                            </p>
                          )}
                        </div>
                      )}

                      <div className="mt-2">
                        <Label htmlFor="patientId">Selected Patient ID</Label>
                        <Input
                          id="patientId"
                          {...form.register("patientId")}
                          readOnly
                        />
                        {form.formState.errors.patientId && (
                          <p className="text-red-500 text-sm mt-1">
                            {form.formState.errors.patientId.message}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Date, Doctor, Treatment Row */}
                    <div>
                      <Label htmlFor="date">Appointment Date</Label>
                      <Input
                        id="date"
                        type="date"
                        {...form.register("date")}
                      />
                      {form.formState.errors.date && (
                        <p className="text-red-500 text-sm mt-1">
                          {form.formState.errors.date.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="doctorName">Doctor</Label>
                      <Controller
                        control={form.control}
                        name="doctorName"
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value ?? ""}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select doctor" />
                            </SelectTrigger>
                            <SelectContent>
                              {dropdownSettings?.settingValue?.doctors?.map(
                                (doctor: string) => (
                                  <SelectItem key={doctor} value={doctor}>
                                    {doctor}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {form.formState.errors.doctorName && (
                        <p className="text-red-500 text-sm mt-1">
                          {form.formState.errors.doctorName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="treatmentDone">Treatment</Label>
                      <Controller
                        control={form.control}
                        name="treatmentDone"
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value ?? ""}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select treatment" />
                            </SelectTrigger>
                            <SelectContent>
                              {dropdownSettings?.settingValue?.treatmentDone?.map(
                                (treatment: string) => (
                                  <SelectItem key={treatment} value={treatment}>
                                    {treatment}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    
                    {/* Notes Section */}
                    <div className="md:col-span-3 mt-2">
                      <Label htmlFor="notes">Notes & Additional Treatment Details</Label>
                      <Textarea
                        id="notes"
                        {...form.register("notes")}
                        placeholder="Enter treatment details, notes, or other relevant information"
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>

                  {/* Attachments Section */}
                  <h3 className="text-lg font-semibold border-b pb-2 mb-2 mt-4">Attachments & Documentation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="attachments" className="flex items-center mb-2">
                        <Paperclip className="h-4 w-4 mr-2" /> Attachments
                      </Label>
                      <div className="border border-dashed rounded-md p-6 text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          Drag and drop files or click to upload
                        </p>
                        <Button type="button" variant="outline" size="sm">
                          Upload Files
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="consentForms" className="flex items-center mb-2">
                        <FileCheck className="h-4 w-4 mr-2" /> Consent Forms
                      </Label>
                      <div className="border border-dashed rounded-md p-6 text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          Drag and drop forms or click to upload
                        </p>
                        <Button type="button" variant="outline" size="sm">
                          Upload Forms
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="prescription" className="py-4">
                  <h3 className="text-lg font-semibold border-b pb-2 mb-2">Prescription & Medication</h3>
                  {form.getValues("id") && form.getValues("visitId") ? (
                    // For existing appointments with a visit ID
                    <PrescriptionForm
                      visitId={form.getValues("visitId") as number}
                      patientId={form.getValues("patientId")}
                    />
                  ) : (
                    // For new appointments or those without a visit ID
                    <div className="bg-muted/20 p-4 rounded-md text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        A patient visit will be created automatically when you save this appointment.
                        You can add prescriptions after saving.
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="invoice" className="py-4">
                  <h3 className="text-lg font-semibold border-b pb-2 mb-2">Invoice & Billing</h3>
                  {form.getValues("id") && form.getValues("invoiceId") ? (
                    // Show existing invoice if available
                    <InvoiceDetails 
                      invoiceId={form.getValues("invoiceId") as number}
                      patientId={form.getValues("patientId")}
                    />
                  ) : (
                    // New invoice form
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="invoiceAmount">Invoice Amount</Label>
                          <Input
                            id="invoiceAmount"
                            type="number"
                            placeholder="Enter amount"
                            className="mt-1"
                            defaultValue="500"
                          />
                        </div>
                        <div>
                          <Label htmlFor="paymentStatus">Payment Status</Label>
                          <Select defaultValue="pending">
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="partial">Partially Paid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="invoiceNotes">Invoice Notes</Label>
                          <Textarea
                            id="invoiceNotes"
                            placeholder="Enter any notes about the invoice"
                            className="min-h-[60px] mt-1"
                          />
                        </div>
                      </div>
                      <div className="bg-muted/20 p-4 rounded-md">
                        <p className="text-sm">
                          An invoice will be created automatically with default values when you save this appointment.
                          You can edit invoice details after saving.
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-4 pt-4 border-t">
                <Button 
                  type="submit" 
                  disabled={createAppointmentMutation.isPending || updateAppointmentMutation.isPending}
                >
                  {(createAppointmentMutation.isPending || updateAppointmentMutation.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    form.getValues("id") ? "Update Appointment" : "Save Appointment"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Appointments List */}
      {isLoadingAppointments ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : appointments && appointments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {appointments.map((appointment: any) => (
            <Card key={appointment.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      {appointment.date}
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      ID: {appointment.id}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditAppointment(appointment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteAppointment(appointment.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Patient</span>
                    <span className="font-medium">
                      {getPatientName(appointment.patientId)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Doctor</span>
                    <span>{appointment.doctorName || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Treatment</span>
                    <span>
                      {appointment.treatmentDone || "Consultation only"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Visit</span>
                    <span>
                      {appointment.visitId ? (
                        <Badge>Linked</Badge>
                      ) : (
                        <Badge variant="outline">Not linked</Badge>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice</span>
                    <span>
                      {appointment.invoiceId ? (
                        <Badge>Created</Badge>
                      ) : (
                        <Badge variant="outline">Not created</Badge>
                      )}
                    </span>
                  </div>
                </div>

                {appointment.notes && (
                  <>
                    <Separator className="my-2" />
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground font-medium">
                        Notes
                      </p>
                      <p className="text-sm mt-1">{appointment.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border rounded-lg bg-muted/10">
          <h3 className="text-lg font-medium">No appointments found</h3>
          <p className="text-muted-foreground mt-1">
            Create a new appointment to get started.
          </p>
        </div>
      )}
    </div>
  );
}