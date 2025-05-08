import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import ConsentForm from "@/components/ConsentForm";
import PrescriptionForm from "@/components/PrescriptionForm";
import Invoice from "@/components/Invoice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Phone, MessageSquare, Plus, CalendarDays, Receipt, ClipboardList, FileText } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Patient, PatientVisit, Prescription, Invoice as InvoiceType } from "@shared/schema";

export default function PatientRecord() {
  const { patientId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [activeConsentForm, setActiveConsentForm] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

  // Fetch patient details
  const { data: patient, isLoading: isLoadingPatient } = useQuery<Patient>({
    queryKey: [`/api/patients/patientId/${patientId}`],
    enabled: !!patientId,
  });

  // Fetch patient visits (prescriptions/Rx)
  const { data: visits = [], isLoading: isLoadingVisits } = useQuery<PatientVisit[]>({
    queryKey: [`/api/patients/${patientId}/visits`],
    enabled: !!patientId,
  });

  // Fetch medications for dropdown
  const { data: medications = [] } = useQuery<any[]>({
    queryKey: ['/api/medications'],
  });

  // Fetch patient invoices
  const { data: invoices = [] } = useQuery<InvoiceType[]>({
    queryKey: [`/api/patients/${patientId}/invoices`],
    enabled: !!patientId,
  });

  // Fetch prescriptions for selected visit
  const { data: prescriptions = [], isLoading: isLoadingPrescriptions } = useQuery<Prescription[]>({
    queryKey: [`/api/visits/${selectedVisitId}/prescriptions`],
    enabled: !!selectedVisitId,
  });

  // Create a new Visit (Rx)
  const createVisitMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/visits", {
        patientId,
        date: new Date().toISOString().split('T')[0],
        chiefComplaint: data.chiefComplaint || "Not specified",
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/visits`] });
      setSelectedVisitId(data.id);
      setActiveTab("rx");
      setShowPrescriptionForm(true);
      toast({
        title: "Success",
        description: "New prescription created",
      });
    },
    onError: (error) => {
      console.error("Error creating prescription:", error);
      toast({
        title: "Error",
        description: "Failed to create new prescription",
        variant: "destructive",
      });
    },
  });

  // Create a new follow-up appointment for a specific visit
  const createFollowUpMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/visits", {
        patientId,
        date: new Date().toISOString().split('T')[0],
        chiefComplaint: "Follow-up for visit #" + data.visitId,
        previousVisitId: data.visitId,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/visits`] });
      setSelectedVisitId(data.id);
      setActiveTab("rx");
      toast({
        title: "Success",
        description: "Follow-up appointment created",
      });
    },
    onError: (error) => {
      console.error("Error creating follow-up:", error);
      toast({
        title: "Error",
        description: "Failed to create follow-up appointment",
        variant: "destructive",
      });
    },
  });

  // Handle WhatsApp click
  const handleWhatsApp = () => {
    if (!patient) return;
    // Using a type assertion to handle the property access safely
    const phone = patient.phoneNumber || "";
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}`, "_blank");
  };

  // Handle SMS click
  const handleSMS = () => {
    if (!patient) return;
    // Using a type assertion to handle the property access safely
    const phone = patient.phoneNumber || "";
    window.open(`sms:${phone}`, "_blank");
  };

  // Handle Phone click
  const handlePhone = () => {
    if (!patient) return;
    // Using a type assertion to handle the property access safely
    const phone = patient.phoneNumber || "";
    window.open(`tel:${phone}`, "_blank");
  };

  // Create a new Prescription (Rx)
  const handleCreateRx = () => {
    createVisitMutation.mutate({ chiefComplaint: "New prescription" });
  };

  // Create a follow-up for a specific visit
  const handleCreateFollowUp = (visitId: number) => {
    // Use the dedicated follow-up endpoint
    apiRequest("POST", `/api/visits/${visitId}/follow-up`)
      .then(res => res.json())
      .then(data => {
        // After creating a follow-up, refetch visits to update the list
        queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/visits`] });
        // Navigate to the new visit immediately
        if (data && data.id) {
          setSelectedVisitId(data.id);
          setActiveTab("rx");
          setShowPrescriptionForm(true);
        }
      })
      .catch(error => {
        console.error("Error creating follow-up:", error);
        toast({
          title: "Error creating follow-up",
          description: "There was a problem creating the follow-up appointment.",
          variant: "destructive",
        });
      });
  };

  // Show prescription details
  const handleViewRx = (visitId: number) => {
    setSelectedVisitId(visitId);
    setActiveTab("rx");
    setShowPrescriptionForm(true);
  };

  // Handle consent form completion
  const handleConsentFormComplete = () => {
    setActiveConsentForm(null);
    if (selectedVisitId) {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${selectedVisitId}`] });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      return format(date, 'dd MMM yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Get chief complaint for visit
  const getChiefComplaint = (visit: Partial<PatientVisit>) => {
    return visit?.chiefComplaint || "Not specified";
  };

  // Loading state
  if (isLoadingPatient) {
    return (
      <Layout title="Patient Record" showBackButton={true} backTo="/patients/list">
        <div className="flex justify-center items-center h-64">
          <p>Loading patient data...</p>
        </div>
      </Layout>
    );
  }

  // Not found state
  if (!patient) {
    return (
      <Layout title="Patient Record" showBackButton={true} backTo="/patients/list">
        <div className="flex justify-center items-center h-64">
          <p>Patient not found. Please check the patient ID.</p>
        </div>
      </Layout>
    );
  }

  // Main render
  return (
    <Layout title="Patient Record" showBackButton={true} backTo="/patients/list">
      {activeConsentForm ? (
        <ConsentForm
          visitId={selectedVisitId!}
          formType={activeConsentForm}
          onComplete={handleConsentFormComplete}
        />
      ) : showInvoice && selectedVisitId ? (
        <Invoice
          visitId={selectedVisitId}
          patientId={patientId!}
          onBack={() => {
            setShowInvoice(false);
            setActiveTab("rx");
          }}
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

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Left Sidebar - List of Prescriptions */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Prescriptions</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleCreateRx} className="flex items-center">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Rx
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoadingVisits ? (
                    <div className="p-4 text-center">Loading prescriptions...</div>
                  ) : visits.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No prescriptions found. Click "Add Rx" to create a new one.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {[...visits].reverse().map((visit: any) => (
                        <div 
                          key={visit.id} 
                          className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                            selectedVisitId === visit.id ? 'bg-muted/50' : ''
                          }`}
                          onClick={() => handleViewRx(visit.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium truncate max-w-[180px]">
                                {getChiefComplaint(visit)}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center mt-1">
                                <CalendarDays className="h-3 w-3 mr-1" /> {formatDate(visit.date)}
                              </div>
                            </div>
                            {visit.nextAppointment && (
                              <Badge variant="outline" className="text-xs">
                                Follow-up
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Content Area - Selected Prescription Details */}
            <div className="md:col-span-3">
              {selectedVisitId ? (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>
                          {getChiefComplaint(visits.find((v: any) => v.id === selectedVisitId) || {})}
                        </CardTitle>
                        <CardDescription>
                          {formatDate(visits.find((v: any) => v.id === selectedVisitId)?.date || '')}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCreateFollowUp(selectedVisitId)}
                        >
                          <CalendarDays className="h-3.5 w-3.5 mr-1" /> Add Follow-Up
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowInvoice(true)}
                        >
                          <Receipt className="h-3.5 w-3.5 mr-1" /> Invoice
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="rx" onValueChange={setActiveTab} value={activeTab}>
                      <TabsList className="mb-4">
                        <TabsTrigger value="rx">Prescription</TabsTrigger>
                        <TabsTrigger value="treatment">Treatment</TabsTrigger>
                        <TabsTrigger value="history">Patient History</TabsTrigger>
                        <TabsTrigger value="followups">Follow-ups</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="rx">
                        {showPrescriptionForm && (
                          <div className="p-1">
                            <h3 className="text-lg font-semibold mb-4">Medications</h3>
                            <PrescriptionForm 
                              visitId={selectedVisitId} 
                              patientId={patientId}
                            />
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="treatment">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium mb-2">Complaint</h3>
                            <p className="text-sm p-3 bg-muted/30 rounded-md">
                              {visits.find((v: any) => v.id === selectedVisitId)?.chiefComplaint || "Not specified"}
                            </p>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium mb-2">Treatment Done</h3>
                            <p className="text-sm p-3 bg-muted/30 rounded-md">
                              {visits.find((v: any) => v.id === selectedVisitId)?.treatmentDone || "Not specified"}
                            </p>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium mb-2">Treatment Plan</h3>
                            <p className="text-sm p-3 bg-muted/30 rounded-md">
                              {visits.find((v: any) => v.id === selectedVisitId)?.treatmentPlan || "Not specified"}
                            </p>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium mb-2">Advice</h3>
                            <p className="text-sm p-3 bg-muted/30 rounded-md">
                              {visits.find((v: any) => v.id === selectedVisitId)?.advice || "Not specified"}
                            </p>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="history">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium mb-2">Medical History</h3>
                            <p className="text-sm p-3 bg-muted/30 rounded-md">
                              {visits.find((v: any) => v.id === selectedVisitId)?.medicalHistory || "Not specified"}
                            </p>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium mb-2">Drug Allergy</h3>
                            <p className="text-sm p-3 bg-muted/30 rounded-md">
                              {visits.find((v: any) => v.id === selectedVisitId)?.drugAllergy || "None"}
                            </p>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium mb-2">Previous Dental History</h3>
                            <p className="text-sm p-3 bg-muted/30 rounded-md">
                              {visits.find((v: any) => v.id === selectedVisitId)?.previousDentalHistory || "Not specified"}
                            </p>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="followups">
                        <div>
                          <h3 className="text-sm font-medium mb-3">Follow-up Appointments</h3>
                          
                          {/* Find follow-ups for this Rx */}
                          {visits.filter(v => v.previousVisitId === selectedVisitId).length > 0 ? (
                            <div className="space-y-3">
                              {visits
                                .filter(v => v.previousVisitId === selectedVisitId)
                                .map((followUp) => (
                                  <Card key={followUp.id} className="overflow-hidden">
                                    <div 
                                      className="p-3 hover:bg-muted/50 cursor-pointer"
                                      onClick={() => handleViewRx(followUp.id)}
                                    >
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <div className="font-medium">
                                            {getChiefComplaint(followUp)}
                                          </div>
                                          <div className="text-xs text-muted-foreground mt-1">
                                            {formatDate(followUp.date)}
                                          </div>
                                        </div>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewRx(followUp.id);
                                          }}
                                        >
                                          View Details
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                            </div>
                          ) : (
                            <div className="text-center p-6 border rounded-md text-muted-foreground">
                              No follow-up appointments found
                            </div>
                          )}
                          
                          <div className="mt-4 flex justify-end">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCreateFollowUp(selectedVisitId!)}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" /> Add Follow-Up
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full flex items-center justify-center border rounded-lg p-8 bg-muted/10">
                  <div className="text-center">
                    <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Prescription Selected</h3>
                    <p className="text-muted-foreground mb-4">
                      Select a prescription from the list or create a new one.
                    </p>
                    <Button onClick={handleCreateRx}>
                      <Plus className="h-4 w-4 mr-2" /> Create New Prescription
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}