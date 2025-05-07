import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertPatientSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, UserPlus, MessageSquare, Phone } from "lucide-react";

// Extend the patient schema with validation rules
const patientFormSchema = insertPatientSchema.extend({
  age: z.coerce.number().min(0).max(120),
  sex: z.enum(["male", "female", "other"]),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

export default function NewPatientForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditingId, setIsEditingId] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      patientId: "", // Will be auto-generated from the server
      name: "",
      age: 0,
      sex: "male",
      address: "",
      phoneNumber: "",
    },
  });

  // Fetch auto-generated patient ID when the form loads
  useState(() => {
    const fetchPatientId = async () => {
      try {
        // Create a temporary patient to get an ID
        const response = await apiRequest("POST", "/api/patients", {
          patientId: "",
          name: "Temporary",
          age: 0,
          sex: "male",
          address: "Temporary",
          phoneNumber: "0000000000",
        });
        
        const patient = await response.json();
        
        // Delete the temporary patient
        await apiRequest("DELETE", `/api/patients/${patient.id}`, undefined);
        
        // Set the ID in the form
        form.setValue("patientId", patient.patientId);
      } catch (error) {
        console.error("Error generating patient ID:", error);
        // Set a default ID format
        form.setValue("patientId", "PT2023-0001");
      }
    };
    
    fetchPatientId();
  });

  const onSubmit = async (data: PatientFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/patients", data);
      const newPatient = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      
      toast({
        title: "Success",
        description: "Patient registered successfully.",
      });
      
      // Navigate to the patient record page
      navigate(`/patients/record/${newPatient.patientId}`);
    } catch (error) {
      console.error("Error registering patient:", error);
      toast({
        title: "Error",
        description: "Failed to register patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEditId = () => {
    setIsEditingId(!isEditingId);
  };

  const handleWhatsApp = () => {
    const phoneNumber = form.getValues("phoneNumber");
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number first.",
        variant: "destructive",
      });
      return;
    }
    
    // Open WhatsApp with the phone number
    window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}`, "_blank");
  };

  const handleSMS = () => {
    const phoneNumber = form.getValues("phoneNumber");
    if (!phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number first.",
        variant: "destructive",
      });
      return;
    }
    
    // Open default SMS app with the phone number
    window.open(`sms:${phoneNumber}`, "_blank");
  };

  return (
    <Layout
      title="New Patient Registration"
      showBackButton={true}
      backTo="/patients"
    >
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient ID */}
                <FormField
                  control={form.control}
                  name="patientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient ID (auto-assigned)</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            {...field}
                            disabled={!isEditingId}
                            className={`${!isEditingId ? "bg-neutral-100" : ""}`}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 h-6 w-6 p-0"
                          onClick={toggleEditId}
                        >
                          <Pencil className="h-4 w-4 text-primary" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Patient Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter patient's full name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Age */}
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          min={0}
                          max={120}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Sex */}
                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sex</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Address */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter patient's address"
                          className="h-24 resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Phone Number with WhatsApp/Text Option */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter patient's phone number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex space-x-4 md:col-span-2 pt-2 md:pt-8">
                    <Button
                      type="button"
                      className="flex items-center justify-center space-x-2 bg-green-500 text-white hover:bg-green-600"
                      onClick={handleWhatsApp}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>WhatsApp</span>
                    </Button>
                    <Button
                      type="button"
                      className="flex items-center justify-center space-x-2 bg-blue-500 text-white hover:bg-blue-600"
                      onClick={handleSMS}
                    >
                      <Phone className="h-4 w-4" />
                      <span>SMS</span>
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Register Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg flex items-center"
                  disabled={isSubmitting}
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  {isSubmitting ? "Registering..." : "Register Patient"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </Layout>
  );
}
