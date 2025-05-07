import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Calendar } from "@/components/ui/calendar";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAppointmentSchema } from "@shared/schema";
import { z } from "zod";
import { Loader2 } from "lucide-react";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Success",
        description: "Appointment created successfully",
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
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Appointments</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Appointment</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Appointment</DialogTitle>
              <DialogDescription>
                Schedule a new appointment for a patient
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 py-4">
                <div className="mb-4">
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

                <div className="mb-4">
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

                <div className="mb-4">
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
                          {dropdownSettings?.settingValue?.labTechnicians?.map(
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

                <div className="mb-4">
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

                <div className="mb-4">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    {...form.register("notes")}
                    placeholder="Add any notes about the appointment"
                  />
                </div>
              </div>

              <DialogFooter>
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
                  <TableHead>Patient ID</TableHead>
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
                    <TableCell>{appointment.patientId}</TableCell>
                    <TableCell>{appointment.doctorName}</TableCell>
                    <TableCell>{appointment.treatmentDone}</TableCell>
                    <TableCell>{appointment.notes}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
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