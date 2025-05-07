import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertPatientVisitSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import ConsentForm from "@/components/ConsentForm";
import Invoice from "@/components/Invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Upload, Phone, MessageSquare, Save, Printer, Share2, Image, Video } from "lucide-react";

// Modify the schema to have nullable fields where appropriate
const patientVisitFormSchema = insertPatientVisitSchema
  .extend({
    date: z.string(),
    nextAppointment: z.string().nullable().optional(),
  })
  .omit({ attachments: true, consentForms: true });

type PatientVisitFormValues = z.infer<typeof patientVisitFormSchema>;

export default function PatientRecord() {
  const { patientId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeConsentForm, setActiveConsentForm] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visitId, setVisitId] = useState<number | null>(null);

  // Fetch patient details
  const { data: patient, isLoading: isLoadingPatient } = useQuery({
    queryKey: [`/api/patients/patientId/${patientId}`],
    enabled: !!patientId,
  });

  // Fetch dropdown options from settings
  const { data: dropdownOptions } = useQuery({
    queryKey: ["/api/settings/key/dropdown_options"],
  });

  // Create form with default values
  const form = useForm<PatientVisitFormValues>({
    resolver: zodResolver(patientVisitFormSchema),
    defaultValues: {
      patientId: patientId || "",
      date: new Date().toISOString().split("T")[0],
      medicalHistory: "",
      drugAllergy: "",
      previousDentalHistory: "",
      chiefComplaint: "",
      oralExamination: "",
      investigation: "",
      treatmentPlan: "",
      prescription: "",
      treatmentDone: "",
      advice: "",
      notes: "",
      nextAppointment: "",
    },
  });

  // Create mutation for saving the visit
  const saveMutation = useMutation({
    mutationFn: async (values: PatientVisitFormValues) => {
      if (visitId) {
        // Update existing visit
        const response = await apiRequest("PUT", `/api/visits/${visitId}`, values);
        return response.json();
      } else {
        // Create new visit
        const response = await apiRequest("POST", "/api/visits", values);
        return response.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/visits`] });
      if (!visitId) {
        setVisitId(data.id);
      }
      toast({
        title: "Success",
        description: "Patient record saved successfully.",
      });
    },
    onError: (error) => {
      console.error("Error saving patient record:", error);
      toast({
        title: "Error",
        description: "Failed to save patient record.",
        variant: "destructive",
      });
    },
  });

  // Check if there's an existing visit record for today
  useEffect(() => {
    const fetchTodayVisit = async () => {
      if (!patientId) return;
      
      try {
        const response = await fetch(`/api/patients/${patientId}/visits`);
        const visits = await response.json();
        
        // Find a visit for today
        const today = new Date().toISOString().split("T")[0];
        const todayVisit = visits.find((visit: any) => visit.date === today);
        
        if (todayVisit) {
          // Populate form with existing visit data
          setVisitId(todayVisit.id);
          
          // Set form values
          Object.keys(todayVisit).forEach((key) => {
            if (key in form.getValues() && key !== "patientId") {
              form.setValue(key as any, todayVisit[key]);
            }
          });
        }
      } catch (error) {
        console.error("Error fetching today's visit:", error);
      }
    };
    
    fetchTodayVisit();
  }, [patientId, form]);

  const onSubmit = (values: PatientVisitFormValues) => {
    setIsSubmitting(true);
    saveMutation.mutate(values, {
      onSettled: () => {
        setIsSubmitting(false);
      },
    });
  };

  const handleWhatsApp = () => {
    if (!patient?.phoneNumber) return;
    window.open(`https://wa.me/${patient.phoneNumber.replace(/[^0-9]/g, "")}`, "_blank");
  };

  const handleSMS = () => {
    if (!patient?.phoneNumber) return;
    window.open(`sms:${patient.phoneNumber}`, "_blank");
  };

  const handlePhone = () => {
    if (!patient?.phoneNumber) return;
    window.open(`tel:${patient.phoneNumber}`, "_blank");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    if (!event.target.files || !event.target.files[0] || !visitId) {
      return;
    }

    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("visitId", visitId.toString());

    try {
      const response = await fetch("/api/upload/patient-attachment", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      toast({
        title: "Success",
        description: `${fileType} uploaded successfully.`,
      });
    } catch (error) {
      console.error(`Error uploading ${fileType}:`, error);
      toast({
        title: "Error",
        description: `Failed to upload ${fileType}.`,
        variant: "destructive",
      });
    }
  };

  const showConsentForm = (formType: string) => {
    setActiveConsentForm(formType);
  };

  const handleConsentFormComplete = () => {
    setActiveConsentForm(null);
    queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}`] });
  };

  const getDropdownOptions = (key: string) => {
    if (!dropdownOptions?.settingValue) return [];
    return dropdownOptions.settingValue[key] || [];
  };

  if (isLoadingPatient) {
    return (
      <Layout title="Patient Record" showBackButton={true} backTo="/patients/list">
        <div className="flex justify-center items-center h-64">
          <p>Loading patient data...</p>
        </div>
      </Layout>
    );
  }

  if (!patient) {
    return (
      <Layout title="Patient Record" showBackButton={true} backTo="/patients/list">
        <div className="flex justify-center items-center h-64">
          <p>Patient not found. Please check the patient ID.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Patient Record" showBackButton={true} backTo="/patients/list">
      {activeConsentForm ? (
        <ConsentForm
          visitId={visitId!}
          formType={activeConsentForm}
          onComplete={handleConsentFormComplete}
        />
      ) : (
        <>
          {/* Patient Info Summary */}
          <div className="bg-white shadow-sm border-b mb-6">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-wrap items-center justify-between">
                <div className="flex items-center mb-3 sm:mb-0">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white text-xl font-semibold mr-3">
                    {patient.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-800">{patient.name}</h2>
                    <div className="flex flex-wrap text-sm text-neutral-600">
                      <span className="mr-3">{patient.patientId}</span>
                      <span className="mr-3">{patient.age} years</span>
                      <span>{patient.sex.charAt(0).toUpperCase() + patient.sex.slice(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handlePhone}
                    className="text-primary hover:text-primary-dark"
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleWhatsApp}
                    className="text-green-500 hover:text-green-600"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSMS}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="mb-4 flex justify-end space-x-3 print:hidden">
                <Button variant="outline" size="sm" className="text-sm">
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
                <Button variant="outline" size="sm" className="text-sm">
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Date */}
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              className="bg-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Patient ID (read-only) */}
                    <FormField
                      control={form.control}
                      name="patientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient ID</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              readOnly
                              className="bg-neutral-100"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Chief Complaint */}
                    <FormField
                      control={form.control}
                      name="chiefComplaint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chief Complaint</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select complaint" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Select complaint</SelectItem>
                              {getDropdownOptions("chiefComplaint").map((option: string) => (
                                <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, "_")}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Medical History */}
                    <FormField
                      control={form.control}
                      name="medicalHistory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medical History</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select medical history" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Select medical history</SelectItem>
                              {getDropdownOptions("medicalHistory").map((option: string) => (
                                <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, "_")}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Drug Allergy */}
                    <FormField
                      control={form.control}
                      name="drugAllergy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Drug Allergy</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select drug allergy" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Select drug allergy</SelectItem>
                              {getDropdownOptions("drugAllergy").map((option: string) => (
                                <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, "_")}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Previous Dental History */}
                    <FormField
                      control={form.control}
                      name="previousDentalHistory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Previous Dental History</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select dental history" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Select dental history</SelectItem>
                              {getDropdownOptions("previousDentalHistory").map((option: string) => (
                                <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, "_")}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Oral Examination */}
                    <FormField
                      control={form.control}
                      name="oralExamination"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Oral Examination (O/E)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select findings" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Select findings</SelectItem>
                              {getDropdownOptions("oralExamination").map((option: string) => (
                                <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, "_")}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Investigation */}
                    <FormField
                      control={form.control}
                      name="investigation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Investigation</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select investigation" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Select investigation</SelectItem>
                              {getDropdownOptions("investigation").map((option: string) => (
                                <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, "_")}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Treatment Plan */}
                    <FormField
                      control={form.control}
                      name="treatmentPlan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Treatment Plan</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select treatment plan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Select treatment plan</SelectItem>
                              {getDropdownOptions("treatmentPlan").map((option: string) => (
                                <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, "_")}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* RX (Prescription) */}
                    <FormField
                      control={form.control}
                      name="prescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RX (Prescription)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select medication" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Select medication</SelectItem>
                              {getDropdownOptions("prescription").map((option: string) => (
                                <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, "_")}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Treatment Done */}
                    <FormField
                      control={form.control}
                      name="treatmentDone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Treatment Done</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select treatment done" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Select treatment done</SelectItem>
                              {getDropdownOptions("treatmentDone").map((option: string) => (
                                <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, "_")}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Advice */}
                    <FormField
                      control={form.control}
                      name="advice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Advice</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select advice" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Select advice</SelectItem>
                              {getDropdownOptions("advice").map((option: string) => (
                                <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, "_")}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Next Appointment */}
                    <FormField
                      control={form.control}
                      name="nextAppointment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Next Appointment</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value || ""}
                              className="bg-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="md:col-span-3">
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Add additional notes here..."
                              className="h-24 resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Attachments */}
                  <div className="bg-neutral-50 rounded-lg p-4 border border-dashed border-neutral-300">
                    <h3 className="text-lg font-semibold text-neutral-800 mb-3 font-heading">Attachments</h3>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex flex-col items-center justify-center w-32 h-32 bg-neutral-100 rounded-lg border border-neutral-300 cursor-pointer hover:bg-neutral-200 transition-colors">
                        <div className="text-center">
                          <Image className="text-neutral-500 h-8 w-8 mx-auto" />
                          <p className="text-sm text-neutral-600 mt-1">Add Image</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "Image")}
                          disabled={!visitId}
                        />
                      </label>
                      <label className="flex flex-col items-center justify-center w-32 h-32 bg-neutral-100 rounded-lg border border-neutral-300 cursor-pointer hover:bg-neutral-200 transition-colors">
                        <div className="text-center">
                          <Video className="text-neutral-500 h-8 w-8 mx-auto" />
                          <p className="text-sm text-neutral-600 mt-1">Add Video</p>
                        </div>
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "Video")}
                          disabled={!visitId}
                        />
                      </label>
                    </div>
                    {!visitId && (
                      <p className="text-sm text-amber-600 mt-2">
                        Save the patient record first to enable file uploads.
                      </p>
                    )}
                  </div>
                  
                  {/* Consent Forms */}
                  <div className="bg-neutral-50 rounded-lg p-4 border border-dashed border-neutral-300">
                    <h3 className="text-lg font-semibold text-neutral-800 mb-3 font-heading">Consent Forms</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center justify-between"
                        onClick={() => showConsentForm("extraction")}
                        disabled={!visitId}
                      >
                        <span>Extraction Consent</span>
                        <Upload className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center justify-between"
                        onClick={() => showConsentForm("root_canal")}
                        disabled={!visitId}
                      >
                        <span>Root Canal Consent</span>
                        <Upload className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center justify-between"
                        onClick={() => showConsentForm("custom")}
                        disabled={!visitId}
                      >
                        <span>Upload Custom Consent</span>
                        <Upload className="h-4 w-4 text-primary" />
                      </Button>
                    </div>
                    {!visitId && (
                      <p className="text-sm text-amber-600 mt-2">
                        Save the patient record first to enable consent forms.
                      </p>
                    )}
                  </div>
                  
                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg flex items-center"
                      disabled={isSubmitting}
                    >
                      <Save className="mr-2 h-5 w-5" />
                      {isSubmitting ? "Saving..." : "Save Record"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Invoice Section */}
          {showInvoice && visitId && (
            <Invoice patientId={patientId!} visitId={visitId} />
          )}
        </>
      )}
    </Layout>
  );
}
