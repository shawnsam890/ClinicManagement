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
  CardFooter,
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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  FileText, 
  Edit, 
  Eye, 
  Paperclip, 
  FileCheck, 
  Receipt, 
  Plus 
} from "lucide-react";
import PrescriptionForm from "@/components/PrescriptionForm";

// Extended schema with validation
const appointmentFormSchema = insertAppointmentSchema.extend({
  patientId: z.string().min(1, { message: "Patient ID is required" }),
  date: z.string().min(1, { message: "Date is required" }),
  doctorName: z.string().min(1, { message: "Doctor name is required" }),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export default function AppointmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("details");
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Success",
        description: "Appointment created successfully",
      });
      setIsDialogOpen(false);
      form.reset();
      
      // Open the view dialog to show the newly created appointment
      setSelectedAppointment(data);
      setIsViewDialogOpen(true);
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
    const patient = patients?.find((p) => p.patientId === patientId);
    return patient ? patient.name : "Unknown";
  };

  // Handle viewing an appointment
  const handleViewAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setActiveTab("details");
    setIsViewDialogOpen(true);
  };

  // Handle editing an appointment
  const handleEditAppointment = () => {
    if (!selectedAppointment) return;
    
    // Set form values for editing
    form.setValue("patientId", selectedAppointment.patientId);
    form.setValue("date", selectedAppointment.date);
    form.setValue("doctorName", selectedAppointment.doctorName || "");
    form.setValue("treatmentDone", selectedAppointment.treatmentDone || null);
    form.setValue("notes", selectedAppointment.notes || null);
    form.setValue("visitId", selectedAppointment.visitId || null);
    form.setValue("invoiceId", selectedAppointment.invoiceId || null);
    
    // Close view dialog and open edit dialog
    setIsViewDialogOpen(false);
    setIsDialogOpen(true);
  };

  // Create patient visit and link to appointment
  const createPatientVisit = async () => {
    if (!selectedAppointment) return;
    
    try {
      const visitData = {
        patientId: selectedAppointment.patientId,
        date: selectedAppointment.date,
        chiefComplaint: "Follow-up visit", // Default value
        treatmentDone: selectedAppointment.treatmentDone,
      };
      
      const res = await apiRequest("POST", "/api/visits", visitData);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create patient visit");
      }
      
      const createdVisit = await res.json();
      
      // Update appointment with the new visit ID
      await updateAppointmentMutation.mutateAsync({
        ...selectedAppointment,
        visitId: createdVisit.id,
      });
      
      // Refresh the selected appointment
      setSelectedAppointment({
        ...selectedAppointment,
        visitId: createdVisit.id,
      });
      
      toast({
        title: "Success",
        description: "Patient visit created and linked to appointment",
      });
      
      return createdVisit;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Create invoice and link to appointment
  const createInvoice = async () => {
    if (!selectedAppointment) return;
    
    try {
      const newInvoice = {
        patientId: selectedAppointment.patientId,
        date: selectedAppointment.date,
        totalAmount: 0, // Will be filled in later
        status: "pending",
        visitId: selectedAppointment.visitId,
      };
      
      const res = await apiRequest("POST", "/api/invoices", newInvoice);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create invoice");
      }
      
      const createdInvoice = await res.json();
      
      // Update appointment with the new invoice ID
      await updateAppointmentMutation.mutateAsync({
        ...selectedAppointment,
        invoiceId: createdInvoice.id,
      });
      
      // Refresh the selected appointment
      setSelectedAppointment({
        ...selectedAppointment,
        invoiceId: createdInvoice.id,
      });
      
      toast({
        title: "Success",
        description: "Invoice created and linked to appointment",
      });
      
      return createdInvoice;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Form setup
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
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
    createAppointmentMutation.mutate(data);
  };

  // Filter patients by search term
  const filteredPatients = patients?.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.phoneNumber &&
        patient.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-6 overflow-auto h-screen pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Appointments</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Appointment</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Create New Appointment</DialogTitle>
              <DialogDescription>
                Schedule a new appointment for a patient
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 py-4">
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
                          filteredPatients.map((patient) => (
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
                  
                  {/* Additional Treatment Input */}
                  <div className="md:col-span-3 mt-2">
                    <Label htmlFor="additionalTreatment">Additional Treatment Details</Label>
                    <Textarea
                      id="additionalTreatment"
                      placeholder="Enter any additional treatment details"
                      className="min-h-[60px]"
                    />
                  </div>
                </div>

                {/* Notes Section */}
                <div>
                  <Label htmlFor="notes">Clinical Notes</Label>
                  <Textarea
                    id="notes"
                    {...form.register("notes")}
                    placeholder="Add any notes about the appointment"
                    className="min-h-[100px]"
                  />
                </div>

                {/* Prescription Section */}
                <h3 className="text-lg font-semibold border-b pb-2 mb-2 mt-4">Prescription & Medication</h3>
                <div className="bg-muted/20 p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-4">
                    Prescriptions can be added after creating the appointment and linking it to a patient visit.
                  </p>
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
                
                {/* Invoice Section */}
                <h3 className="text-lg font-semibold border-b pb-2 mb-2 mt-4">Invoice & Billing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invoiceAmount">Invoice Amount</Label>
                    <Input
                      id="invoiceAmount"
                      type="number"
                      placeholder="Enter amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentStatus">Payment Status</Label>
                    <Select>
                      <SelectTrigger>
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
                      className="min-h-[60px]"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-4 pt-4 border-t">
                <Button type="submit" disabled={createAppointmentMutation.isPending}>
                  {createAppointmentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Appointment"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* View Appointment Dialog */}
        {selectedAppointment && (
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="sm:max-w-[800px] overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>
                  Appointment for {getPatientName(selectedAppointment.patientId)}
                </DialogTitle>
                <DialogDescription>
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    {selectedAppointment.date}
                  </div>
                </DialogDescription>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="prescription">Prescription</TabsTrigger>
                  <TabsTrigger value="attachments">Attachments</TabsTrigger>
                  <TabsTrigger value="invoice">Invoice</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Patient</Label>
                      <div className="font-medium">
                        {getPatientName(selectedAppointment.patientId)} ({selectedAppointment.patientId})
                      </div>
                    </div>
                    <div>
                      <Label>Doctor</Label>
                      <div className="font-medium">{selectedAppointment.doctorName || "Not specified"}</div>
                    </div>
                    <div>
                      <Label>Date</Label>
                      <div className="font-medium">{selectedAppointment.date}</div>
                    </div>
                    <div>
                      <Label>Treatment</Label>
                      <div className="font-medium">{selectedAppointment.treatmentDone || "Not specified"}</div>
                    </div>
                    <div className="col-span-2">
                      <Label>Notes</Label>
                      <div className="font-medium whitespace-pre-wrap border p-2 rounded-md bg-gray-50 min-h-[100px]">
                        {selectedAppointment.notes || "No notes provided"}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="mr-2">
                      Close
                    </Button>
                    <Button onClick={handleEditAppointment}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Appointment
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="prescription" className="space-y-4 mt-4">
                  {selectedAppointment.visitId ? (
                    <PrescriptionForm
                      visitId={selectedAppointment.visitId}
                      readOnly={false}
                    />
                  ) : (
                    <div className="border border-muted rounded-md p-6 text-center">
                      <div className="mb-4 text-muted-foreground">
                        No prescription has been created for this appointment yet.
                        You need to create a patient visit record first.
                      </div>
                      <Button onClick={createPatientVisit}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Patient Visit Record
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="attachments" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <Paperclip className="h-4 w-4 mr-2" />
                          Attachments
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedAppointment.attachments ? (
                          <div>
                            {/* Display attachments here */}
                            <div className="flex items-center p-2 border rounded-md">
                              <FileText className="h-5 w-5 mr-2 text-blue-500" />
                              <span>attachment.pdf</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            No attachments uploaded
                            <div className="mt-2">
                              <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Upload Attachment
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <FileCheck className="h-4 w-4 mr-2" />
                          Consent Forms
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedAppointment.consentForms ? (
                          <div>
                            {/* Display consent forms here */}
                            <div className="flex items-center p-2 border rounded-md">
                              <FileText className="h-5 w-5 mr-2 text-green-500" />
                              <span>consent_form.pdf</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            No consent forms uploaded
                            <div className="mt-2">
                              <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Upload Consent Form
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="invoice" className="space-y-4 mt-4">
                  {selectedAppointment.invoiceId ? (
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between mb-4">
                        <h3 className="text-lg font-medium">Invoice #{selectedAppointment.invoiceId}</h3>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Invoice
                        </Button>
                      </div>
                      <div className="text-muted-foreground">
                        This appointment has an associated invoice.
                      </div>
                    </div>
                  ) : (
                    <div className="border border-muted rounded-md p-6 text-center">
                      <div className="mb-4 text-muted-foreground">
                        No invoice has been created for this appointment
                      </div>
                      <Button onClick={createInvoice}>
                        <Receipt className="h-4 w-4 mr-2" />
                        Create Invoice
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>
            View and manage all scheduled appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAppointments ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : appointments && appointments.length > 0 ? (
            <Table>
              <TableCaption>List of all scheduled appointments</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{appointment.date}</TableCell>
                    <TableCell>
                      {getPatientName(appointment.patientId)}
                      <div className="text-xs text-muted-foreground">
                        {appointment.patientId}
                      </div>
                    </TableCell>
                    <TableCell>{appointment.doctorName}</TableCell>
                    <TableCell>{appointment.treatmentDone}</TableCell>
                    <TableCell>
                      {appointment.notes && appointment.notes.length > 30
                        ? `${appointment.notes.substring(0, 30)}...`
                        : appointment.notes || ""}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewAppointment(appointment)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-6 text-gray-500">
              No appointments scheduled. Create a new appointment to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}