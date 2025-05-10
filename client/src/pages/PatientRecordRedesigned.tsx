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
import VisitLog from "@/components/VisitLog";
import ToothFindingsSection from "@/components/ToothFindingsSection";
import GeneralizedFindingsSection from "@/components/GeneralizedFindingsSection";
import InvestigationSection from "@/components/InvestigationSection";
import FollowUpSection from "@/components/FollowUpSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Phone, MessageSquare, Plus, CalendarDays, Receipt, ClipboardList, FileText, 
  Edit, Save, X, PlusCircle, Trash2, Repeat, CheckCircle2, Activity, Pill, Stethoscope, FileEdit, Image } from "lucide-react";
import "./VisitLog.css";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Patient, PatientVisit, Prescription, Invoice as InvoiceType } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function PatientRecord() {
  const { patientId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [activeConsentForm, setActiveConsentForm] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showEditPatientDetails, setShowEditPatientDetails] = useState(false);
  const [patientForm, setPatientForm] = useState<any>({
    address: '',
    medicalHistory: '',
    dentalHistory: '',
    drugAllergy: ''
  });
  // We've removed the visit form and edit dialog state variables
  // as we're now editing directly in the visit log
  const [newMedicalHistoryOption, setNewMedicalHistoryOption] = useState('');
  const [newDentalHistoryOption, setNewDentalHistoryOption] = useState('');
  const [medicalHistoryOptions, setMedicalHistoryOptions] = useState<string[]>([]);
  const [dentalHistoryOptions, setDentalHistoryOptions] = useState<string[]>([]);

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

  // Fetch patient invoices with items
  const { data: rawInvoices = [], isLoading: isLoadingInvoices } = useQuery<InvoiceType[]>({
    queryKey: [`/api/patients/${patientId}/invoices`],
    enabled: !!patientId,
  });
  
  // Track which invoices we've loaded items for
  const [invoicesWithItems, setInvoicesWithItems] = useState<(InvoiceType & { items: any[] })[]>([]);
  
  // Check if an invoice exists before trying to load its items
  useEffect(() => {
    if (rawInvoices.length > 0) {
      const loadInvoiceItems = async () => {
        const existingInvoices = [];
        
        for (const invoice of rawInvoices) {
          try {
            // First verify if the invoice still exists
            const checkRes = await fetch(`/api/invoices/${invoice.id}`);
            if (checkRes.status === 404) {
              console.log(`Invoice ${invoice.id} no longer exists, skipping`);
              continue;
            }
            
            // If it exists, fetch its items
            const itemsRes = await fetch(`/api/invoices/${invoice.id}/items`);
            const items = await itemsRes.json();
            existingInvoices.push({ ...invoice, items });
          } catch (error) {
            console.error(`Failed to process invoice ${invoice.id}:`, error);
          }
        }
        
        setInvoicesWithItems(existingInvoices);
        
        // If the list of invoices has changed, refresh the raw list
        if (existingInvoices.length !== rawInvoices.length) {
          queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/invoices`] });
        }
      };
      
      loadInvoiceItems();
    } else {
      setInvoicesWithItems([]);
    }
  }, [rawInvoices, patientId, queryClient]);

  // Fetch prescriptions for selected visit
  const { data: prescriptions = [], isLoading: isLoadingPrescriptions } = useQuery<Prescription[]>({
    queryKey: [`/api/visits/${selectedVisitId}/prescriptions`],
    enabled: !!selectedVisitId,
  });
  
  // Fetch medical history and dental history options from settings
  const { data: settings } = useQuery<any>({
    queryKey: ['/api/settings/category/patient_options'],
  });

  // Update form data when patient is loaded
  useEffect(() => {
    if (patient) {
      setPatientForm({
        address: patient.address || '',
        medicalHistory: patient.medicalHistory || '',
        dentalHistory: patient.dentalHistory || '',
        drugAllergy: patient.drugAllergy || ''
      });
    }
  }, [patient]);

  // Load medical history and dental history options
  useEffect(() => {
    if (settings) {
      const medHistory = settings.find((s: any) => s.settingKey === 'medical_history_options');
      const dentHistory = settings.find((s: any) => s.settingKey === 'dental_history_options');
      
      if (medHistory && Array.isArray(medHistory.settingValue)) {
        setMedicalHistoryOptions(medHistory.settingValue);
      } else {
        // Default options if none exist
        setMedicalHistoryOptions(['Diabetes', 'Hypertension', 'Heart Disease', 'None']);
      }
      
      if (dentHistory && Array.isArray(dentHistory.settingValue)) {
        setDentalHistoryOptions(dentHistory.settingValue);
      } else {
        // Default options if none exist
        setDentalHistoryOptions(['Extraction', 'RCT', 'Scaling', 'None']);
      }
    }
  }, [settings]);

  // Create a new Visit (Rx)
  const createVisitMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Creating new visit for prescription:", data);
      const res = await apiRequest("POST", "/api/visits", {
        patientId,
        date: new Date().toISOString().split('T')[0],
        chiefComplaint: data.chiefComplaint || "Not specified",
      });
      return res.json();
    },
    onSuccess: (data) => {
      console.log("Visit created successfully:", data);
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/visits`] });
      
      // Set the selected visit and make sure to show prescription form
      setSelectedVisitId(data.id);
      setActiveTab("rx");
      
      // Force showing the prescription form
      console.log("Setting showPrescriptionForm to true");
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
    console.log("Creating new prescription");
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

  // Delete visit
  const deleteVisitMutation = useMutation({
    mutationFn: async (visitId: number) => {
      const res = await apiRequest("DELETE", `/api/visits/${visitId}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/visits`] });
      // If we deleted the selected visit, clear the selection
      if (selectedVisitId) {
        setSelectedVisitId(null);
        setShowPrescriptionForm(false);
      }
      toast({
        title: "Success",
        description: "Visit deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting visit:", error);
      toast({
        title: "Error",
        description: "Failed to delete visit",
        variant: "destructive",
      });
    },
  });

  // Handle delete visit
  const handleDeleteVisit = (visitId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the row click
    
    // Show confirmation before deleting
    if (window.confirm("Are you sure you want to delete this visit? This action cannot be undone.")) {
      deleteVisitMutation.mutate(visitId);
    }
  };

  // Update visit
  const updateVisitMutation = useMutation({
    mutationFn: async (data: { id: number } & Partial<PatientVisit>) => {
      const res = await apiRequest("PUT", `/api/visits/${data.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/visits`] });
      toast({
        title: "Success",
        description: "Visit updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating visit:", error);
      toast({
        title: "Error",
        description: "Failed to update visit",
        variant: "destructive",
      });
    },
  });

  // Update patient details
  const updatePatientMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/patients/${patientId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/patientId/${patientId}`] });
      setShowEditPatientDetails(false);
      toast({
        title: "Success",
        description: "Patient details updated",
      });
    },
    onError: (error) => {
      console.error("Error updating patient:", error);
      toast({
        title: "Error",
        description: "Failed to update patient details",
        variant: "destructive",
      });
    },
  });

  // Handle form changes
  const handleFormChange = (field: string, value: string) => {
    setPatientForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // We've removed the handleVisitFormChange function as we're now editing directly in the VisitLog

  // Save patient details
  const handleSavePatientDetails = () => {
    updatePatientMutation.mutate(patientForm);
  };

  // Add new history option
  const handleAddMedicalHistoryOption = () => {
    if (!newMedicalHistoryOption.trim()) return;
    
    const updatedOptions = [...medicalHistoryOptions, newMedicalHistoryOption];
    setMedicalHistoryOptions(updatedOptions);
    
    // Save to settings
    apiRequest("POST", "/api/settings", {
      settingKey: "medical_history_options",
      settingValue: updatedOptions,
      category: "patient_options"
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/category/patient_options'] });
      setNewMedicalHistoryOption('');
    }).catch(error => {
      console.error("Error saving medical history options:", error);
    });
  };

  // Add new dental history option
  const handleAddDentalHistoryOption = () => {
    if (!newDentalHistoryOption.trim()) return;
    
    const updatedOptions = [...dentalHistoryOptions, newDentalHistoryOption];
    setDentalHistoryOptions(updatedOptions);
    
    // Save to settings
    apiRequest("POST", "/api/settings", {
      settingKey: "dental_history_options",
      settingValue: updatedOptions,
      category: "patient_options"
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/category/patient_options'] });
      setNewDentalHistoryOption('');
    }).catch(error => {
      console.error("Error saving dental history options:", error);
    });
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
      ) : showInvoice ? (
        <Invoice
          visitId={selectedVisitId || undefined}
          patientId={patientId!}
          patientName={patient?.name || ""}
          invoices={invoicesWithItems}
          onBack={() => {
            setShowInvoice(false);
            if (selectedVisitId) {
              setActiveTab("rx");
            }
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
                      <span className="mr-3">{patient.sex.charAt(0).toUpperCase() + patient.sex.slice(1)}</span>
                    </div>
                    <div className="text-sm text-neutral-600 mt-1">
                      <span>{patient.address}</span>
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

          {/* Main Content - Organized in rows with wider columns */}
          <div className="grid grid-cols-1 gap-8">
            {/* First Row - Patient Details and Visit Log */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Medical Information - Wider Column */}
              <div>
                <Card className="border-none shadow-md">
                  <CardHeader className="pb-3 bg-gradient-to-r from-white to-blue-50/30">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="bg-primary/10 p-2 rounded-lg mr-3">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">Patient Details</CardTitle>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-primary hover:bg-primary/10"
                        onClick={() => setShowEditPatientDetails(true)}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/70 mr-2"></span>
                        Address
                      </h3>
                      <p className="text-sm p-3 bg-muted/30 rounded-md">
                        {patient.address || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/70 mr-2"></span>
                        Medical History
                      </h3>
                      <p className="text-sm p-3 bg-muted/30 rounded-md">
                        {patient.medicalHistory || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/70 mr-2"></span>
                        Dental History
                      </h3>
                      <p className="text-sm p-3 bg-muted/30 rounded-md">
                        {patient.dentalHistory || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/70 mr-2"></span>
                        Drug Allergy
                      </h3>
                      <p className="text-sm p-3 bg-muted/30 rounded-md">
                        {patient.drugAllergy || "None"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Visit Log - Wider Column */}
              <div>
                <VisitLog 
                  visits={visits} 
                  isLoadingVisits={isLoadingVisits}
                  selectedVisitId={selectedVisitId}
                  onCreateVisit={handleCreateRx}
                  onViewVisit={handleViewRx}
                  onEditVisit={(id) => {
                    setSelectedVisitId(id);
                    setActiveTab('visit');
                  }}
                  onDeleteVisit={handleDeleteVisit}
                  onCreateFollowUp={handleCreateFollowUp}
                  formatDate={formatDate}
                  getChiefComplaint={getChiefComplaint}
                />
              </div>
            </div>
            
            {/* Second Row - Invoices and Lab Orders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Invoices Section */}
              <div>
                <Card className="border-none shadow-md h-full">
                  <CardHeader className="pb-3 bg-gradient-to-r from-white to-green-50/30">
                    <div className="flex items-center">
                      <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                        <Receipt className="h-5 w-5 text-emerald-600" />
                      </div>
                      <CardTitle className="text-lg">Billing & Invoices</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center text-center p-4">
                      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                        <Receipt className="h-8 w-8 text-emerald-500" />
                      </div>
                      <h3 className="font-medium mb-2">Payment History</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {invoicesWithItems.length > 0 
                          ? `${invoicesWithItems.length} invoice${invoicesWithItems.length !== 1 ? 's' : ''} available` 
                          : "No invoices yet"}
                      </p>
                      <Button 
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md"
                        onClick={() => {
                          setSelectedVisitId(null);
                          setShowInvoice(true);
                        }}
                      >
                        <Receipt className="h-4 w-4 mr-2" /> View Invoices
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Lab Orders Section */}
              <div>
                <Card className="border-none shadow-md h-full">
                  <CardHeader className="pb-3 bg-gradient-to-r from-white to-purple-50/30">
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-2 rounded-lg mr-3">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <CardTitle className="text-lg">Lab Orders</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center text-center p-4">
                      <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                        <Activity className="h-8 w-8 text-purple-500" />
                      </div>
                      <h3 className="font-medium mb-2">Diagnostic Tests</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Track and manage lab work for this patient
                      </p>
                      <Button 
                        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-md"
                        onClick={() => {
                          // This will be connected to lab order functionality
                          navigate(`/lab-orders/${patientId}`);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" /> View Lab Orders
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Showing the prescription details when a visit is selected */}
            <div className={selectedVisitId ? "" : "hidden"}>
              {selectedVisitId ? (
                <Card className="border-none shadow-md">
                  <CardHeader className="bg-gradient-to-r from-white to-indigo-50/30">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                          <ClipboardList className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {getChiefComplaint(visits.find((v: any) => v.id === selectedVisitId) || {})}
                          </CardTitle>
                          <CardDescription>
                            {formatDate(visits.find((v: any) => v.id === selectedVisitId)?.date || '')}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                          onClick={() => handleCreateFollowUp(selectedVisitId)}
                        >
                          <CalendarDays className="h-3.5 w-3.5 mr-1" /> Add Follow-Up
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                          onClick={() => setShowInvoice(true)}
                        >
                          <Receipt className="h-3.5 w-3.5 mr-1" /> Invoice
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mt-2">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="rx">Rx</TabsTrigger>
                        <TabsTrigger value="visit">Visit Details</TabsTrigger>
                        <TabsTrigger value="files">Forms</TabsTrigger>
                        <TabsTrigger value="media">Media</TabsTrigger>
                      </TabsList>
                      <div className="mt-4">
                        {activeTab === 'rx' && (
                          <PrescriptionForm 
                            visitId={selectedVisitId}
                            patientId={patientId}
                            existingPrescriptions={prescriptions}
                            onAddPrescription={(data) => {
                              apiRequest("POST", `/api/visits/${selectedVisitId}/prescriptions`, data)
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: [`/api/visits/${selectedVisitId}/prescriptions`] });
                                  toast({
                                    title: "Success",
                                    description: "Prescription added successfully",
                                  });
                                })
                                .catch((error) => {
                                  console.error("Error adding prescription:", error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to add prescription",
                                    variant: "destructive",
                                  });
                                });
                            }}
                            onDeletePrescription={(id) => {
                              apiRequest("DELETE", `/api/prescriptions/${id}`)
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: [`/api/visits/${selectedVisitId}/prescriptions`] });
                                  toast({
                                    title: "Success",
                                    description: "Prescription deleted successfully",
                                  });
                                })
                                .catch((error) => {
                                  console.error("Error deleting prescription:", error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to delete prescription",
                                    variant: "destructive",
                                  });
                                });
                            }}
                            onUpdatePrescription={(id, data) => {
                              apiRequest("PUT", `/api/prescriptions/${id}`, data)
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: [`/api/visits/${selectedVisitId}/prescriptions`] });
                                  toast({
                                    title: "Success",
                                    description: "Prescription updated successfully",
                                  });
                                })
                                .catch((error) => {
                                  console.error("Error updating prescription:", error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to update prescription",
                                    variant: "destructive",
                                  });
                                });
                            }}
                          />
                        )}
                        {activeTab === 'visit' && (
                          <div className="space-y-4">
                            {visits.find((v: any) => v.id === selectedVisitId) && (
                              <form onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const formData = new FormData(form);
                                const data: any = {};
                                
                                formData.forEach((value, key) => {
                                  data[key] = value;
                                });
                                
                                updateVisitMutation.mutate({
                                  id: selectedVisitId,
                                  ...data
                                });
                              }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <Label htmlFor="chiefComplaint">Chief Complaint</Label>
                                    <Select 
                                      name="chiefComplaint" 
                                      defaultValue={visits.find((v: any) => v.id === selectedVisitId)?.chiefComplaint || ""}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select complaint" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Pain">Pain</SelectItem>
                                        <SelectItem value="Swelling">Swelling</SelectItem>
                                        <SelectItem value="Bleeding">Bleeding</SelectItem>
                                        <SelectItem value="Sensitivity">Sensitivity</SelectItem>
                                        <SelectItem value="Routine Check-up">Routine Check-up</SelectItem>
                                        <SelectItem value="Cleaning">Cleaning</SelectItem>
                                        <SelectItem value="Cosmetic">Cosmetic</SelectItem>
                                        <SelectItem value="Bad Breath">Bad Breath</SelectItem>
                                        <SelectItem value="Missing Tooth">Missing Tooth</SelectItem>
                                        <SelectItem value="Loose Tooth">Loose Tooth</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="areaOfComplaint">Area of Complaint</Label>
                                    <Select 
                                      name="areaOfComplaint" 
                                      defaultValue={visits.find((v: any) => v.id === selectedVisitId)?.areaOfComplaint || ""}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select area" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Upper right">Upper right</SelectItem>
                                        <SelectItem value="Upper left">Upper left</SelectItem>
                                        <SelectItem value="Lower right">Lower right</SelectItem>
                                        <SelectItem value="Lower left">Lower left</SelectItem>
                                        <SelectItem value="Front teeth">Front teeth</SelectItem>
                                        <SelectItem value="Back teeth">Back teeth</SelectItem>
                                        <SelectItem value="Gums">Gums</SelectItem>
                                        <SelectItem value="Jaw">Jaw</SelectItem>
                                        <SelectItem value="Entire mouth">Entire mouth</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="oralExamination">Oral Examination</Label>
                                    <Select 
                                      name="oralExamination" 
                                      defaultValue={visits.find((v: any) => v.id === selectedVisitId)?.oralExamination || ""}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select finding" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Caries">Caries</SelectItem>
                                        <SelectItem value="Pulpitis">Pulpitis</SelectItem>
                                        <SelectItem value="Periodontitis">Periodontitis</SelectItem>
                                        <SelectItem value="Gingivitis">Gingivitis</SelectItem>
                                        <SelectItem value="Dental Abscess">Dental Abscess</SelectItem>
                                        <SelectItem value="Impacted Tooth">Impacted Tooth</SelectItem>
                                        <SelectItem value="Malocclusion">Malocclusion</SelectItem>
                                        <SelectItem value="Missing Teeth">Missing Teeth</SelectItem>
                                        <SelectItem value="Fractured Tooth">Fractured Tooth</SelectItem>
                                        <SelectItem value="Normal">Normal</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="investigation">Investigation</Label>
                                    <Select 
                                      name="investigation" 
                                      defaultValue={visits.find((v: any) => v.id === selectedVisitId)?.investigation || ""}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select investigation" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="IOPA X-ray">IOPA X-ray</SelectItem>
                                        <SelectItem value="OPG">OPG</SelectItem>
                                        <SelectItem value="CBCT">CBCT</SelectItem>
                                        <SelectItem value="Vitality Test">Vitality Test</SelectItem>
                                        <SelectItem value="Blood Test">Blood Test</SelectItem>
                                        <SelectItem value="Biopsy">Biopsy</SelectItem>
                                        <SelectItem value="None">None</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="treatmentPlan">Treatment Plan</Label>
                                    <Select 
                                      name="treatmentPlan" 
                                      defaultValue={visits.find((v: any) => v.id === selectedVisitId)?.treatmentPlan || ""}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select treatment plan" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Restoration">Restoration</SelectItem>
                                        <SelectItem value="Root Canal Treatment">Root Canal Treatment</SelectItem>
                                        <SelectItem value="Extraction">Extraction</SelectItem>
                                        <SelectItem value="Scaling and Root Planing">Scaling and Root Planing</SelectItem>
                                        <SelectItem value="Dental Implant">Dental Implant</SelectItem>
                                        <SelectItem value="Crown">Crown</SelectItem>
                                        <SelectItem value="Bridge">Bridge</SelectItem>
                                        <SelectItem value="Orthodontic Treatment">Orthodontic Treatment</SelectItem>
                                        <SelectItem value="Medication only">Medication only</SelectItem>
                                        <SelectItem value="Observe">Observe</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="treatmentDone">Treatment Done</Label>
                                    <Select 
                                      name="treatmentDone" 
                                      defaultValue={visits.find((v: any) => v.id === selectedVisitId)?.treatmentDone || ""}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select treatment done" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Restoration">Restoration</SelectItem>
                                        <SelectItem value="Root Canal Treatment">Root Canal Treatment</SelectItem>
                                        <SelectItem value="Extraction">Extraction</SelectItem>
                                        <SelectItem value="Scaling and Root Planing">Scaling and Root Planing</SelectItem>
                                        <SelectItem value="Dental Implant">Dental Implant</SelectItem>
                                        <SelectItem value="Crown">Crown</SelectItem>
                                        <SelectItem value="Bridge">Bridge</SelectItem>
                                        <SelectItem value="Braces Adjustment">Braces Adjustment</SelectItem>
                                        <SelectItem value="Medication Prescribed">Medication Prescribed</SelectItem>
                                        <SelectItem value="None">None</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="advice">Advice</Label>
                                    <Select 
                                      name="advice" 
                                      defaultValue={visits.find((v: any) => v.id === selectedVisitId)?.advice || ""}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select advice" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Proper Brushing">Proper Brushing</SelectItem>
                                        <SelectItem value="Flossing">Flossing</SelectItem>
                                        <SelectItem value="Soft Diet">Soft Diet</SelectItem>
                                        <SelectItem value="Avoid Hot Food">Avoid Hot Food</SelectItem>
                                        <SelectItem value="Cold Compress">Cold Compress</SelectItem>
                                        <SelectItem value="Regular Check-up">Regular Check-up</SelectItem>
                                        <SelectItem value="Avoid Smoking">Avoid Smoking</SelectItem>
                                        <SelectItem value="Mouthwash">Mouthwash</SelectItem>
                                        <SelectItem value="None">None</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea 
                                      id="notes"
                                      name="notes"
                                      defaultValue={visits.find((v: any) => v.id === selectedVisitId)?.notes || ""}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="nextAppointment">Next Appointment</Label>
                                    <Input 
                                      id="nextAppointment"
                                      name="nextAppointment"
                                      type="date"
                                      defaultValue={visits.find((v: any) => v.id === selectedVisitId)?.nextAppointment || ""}
                                      className="mt-1"
                                    />
                                  </div>
                                </div>
                                <Button type="submit" className="mr-2 bg-gradient-to-r from-primary to-primary/90">
                                  <Save className="h-4 w-4 mr-1" /> Save Changes
                                </Button>
                              </form>
                            )}
                          </div>
                        )}
                        {activeTab === 'files' && (
                          <div className="space-y-6">
                            <div className="bg-muted/20 rounded-lg p-4 border border-dashed border-muted-foreground/50">
                              <h3 className="text-base font-medium mb-3">Upload Consent Form</h3>
                              <div className="flex space-x-4">
                                <div className="flex-1">
                                  <Input 
                                    type="file" 
                                    accept=".pdf,.jpg,.jpeg,.png" 
                                    id="consent-form-upload"
                                    className="cursor-pointer"
                                  />
                                  <p className="text-sm text-muted-foreground mt-2">
                                    Accepted formats: PDF, JPG, PNG (max 5MB)
                                  </p>
                                </div>
                                <Button 
                                  onClick={() => {
                                    const input = document.getElementById('consent-form-upload') as HTMLInputElement;
                                    if (input.files && input.files.length > 0) {
                                      const file = input.files[0];
                                      const formData = new FormData();
                                      formData.append('file', file);
                                      formData.append('visitId', selectedVisitId?.toString() || '');
                                      formData.append('type', 'consent');
                                      
                                      fetch('/api/upload/consent', {
                                        method: 'POST',
                                        body: formData
                                      })
                                      .then(response => response.json())
                                      .then(data => {
                                        toast({
                                          title: "Success",
                                          description: "Consent form uploaded successfully",
                                        });
                                        queryClient.invalidateQueries({ queryKey: [`/api/visits/${selectedVisitId}`] });
                                      })
                                      .catch(error => {
                                        console.error('Error uploading consent form:', error);
                                        toast({
                                          title: "Error",
                                          description: "Failed to upload consent form",
                                          variant: "destructive",
                                        });
                                      });
                                    }
                                  }}
                                  className="bg-primary"
                                >
                                  <FileText className="h-4 w-4 mr-2" /> Upload
                                </Button>
                              </div>
                            </div>
                            
                            <Separator className="my-4" />
                            
                            <ConsentForm 
                              visitId={selectedVisitId}
                              patientName={patient.name}
                              onClearSignature={() => {
                                // Add function to clear patient signature here
                                const sigCanvas = document.querySelector('.patient-signature-pad') as HTMLCanvasElement;
                                if (sigCanvas) {
                                  const context = sigCanvas.getContext('2d');
                                  if (context) {
                                    context.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
                                  }
                                }
                              }}
                            />
                          </div>
                        )}
                        
                        {activeTab === 'media' && (
                          <div className="space-y-6">
                            <div className="bg-muted/20 rounded-lg p-4 border border-dashed border-muted-foreground/50">
                              <h3 className="text-base font-medium mb-3">Upload Images & Videos</h3>
                              <div className="flex space-x-4">
                                <div className="flex-1">
                                  <Input 
                                    type="file" 
                                    accept=".jpg,.jpeg,.png,.mp4,.mov,.avi" 
                                    id="media-upload"
                                    className="cursor-pointer"
                                    multiple
                                  />
                                  <p className="text-sm text-muted-foreground mt-2">
                                    Accepted formats: JPG, PNG, MP4, MOV (max 50MB)
                                  </p>
                                </div>
                                <Button 
                                  onClick={() => {
                                    const input = document.getElementById('media-upload') as HTMLInputElement;
                                    if (input.files && input.files.length > 0) {
                                      const formData = new FormData();
                                      for (let i = 0; i < input.files.length; i++) {
                                        formData.append('files', input.files[i]);
                                      }
                                      formData.append('visitId', selectedVisitId?.toString() || '');
                                      formData.append('type', 'media');
                                      
                                      fetch('/api/upload/media', {
                                        method: 'POST',
                                        body: formData
                                      })
                                      .then(response => response.json())
                                      .then(data => {
                                        toast({
                                          title: "Success",
                                          description: `${input.files?.length} file(s) uploaded successfully`,
                                        });
                                        queryClient.invalidateQueries({ queryKey: [`/api/visits/${selectedVisitId}`] });
                                      })
                                      .catch(error => {
                                        console.error('Error uploading media:', error);
                                        toast({
                                          title: "Error",
                                          description: "Failed to upload media files",
                                          variant: "destructive",
                                        });
                                      });
                                    }
                                  }}
                                  className="bg-gradient-to-r from-purple-500 to-purple-600"
                                >
                                  <FileText className="h-4 w-4 mr-2" /> Upload
                                </Button>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <h3 className="text-base font-medium">Media Gallery</h3>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {/* This would be populated with actual media items from the API */}
                                <div className="rounded-lg border overflow-hidden aspect-square bg-muted/30 flex items-center justify-center">
                                  <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div className="rounded-lg border overflow-hidden aspect-square bg-muted/30 flex items-center justify-center">
                                  <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div className="rounded-lg border overflow-hidden aspect-square bg-muted/30 flex items-center justify-center">
                                  <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full flex items-center justify-center border rounded-lg p-8 bg-muted/10">
                  <div className="text-center">
                    <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Visit Selected</h3>
                    <p className="text-muted-foreground mb-4">
                      Select a visit from the list or create a new one.
                    </p>
                    <Button onClick={handleCreateRx}>
                      <Plus className="h-4 w-4 mr-2" /> Create New Visit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Edit Patient Details Dialog */}
          <Dialog open={showEditPatientDetails} onOpenChange={setShowEditPatientDetails}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Edit Patient Details</DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={patientForm.address}
                    onChange={(e) => handleFormChange('address', e.target.value)}
                    rows={2}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="medicalHistory">Medical History</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      value={patientForm.medicalHistory}
                      onValueChange={(value) => handleFormChange('medicalHistory', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select medical history" />
                      </SelectTrigger>
                      <SelectContent>
                        {medicalHistoryOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add new option"
                        value={newMedicalHistoryOption}
                        onChange={(e) => setNewMedicalHistoryOption(e.target.value)}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={handleAddMedicalHistoryOption}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="dentalHistory">Dental History</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      value={patientForm.dentalHistory}
                      onValueChange={(value) => handleFormChange('dentalHistory', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select dental history" />
                      </SelectTrigger>
                      <SelectContent>
                        {dentalHistoryOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add new option"
                        value={newDentalHistoryOption}
                        onChange={(e) => setNewDentalHistoryOption(e.target.value)}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={handleAddDentalHistoryOption}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="drugAllergy">Drug Allergy</Label>
                  <Textarea
                    id="drugAllergy"
                    value={patientForm.drugAllergy}
                    onChange={(e) => handleFormChange('drugAllergy', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditPatientDetails(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  onClick={handleSavePatientDetails}
                  disabled={updatePatientMutation.isPending}
                >
                  {updatePatientMutation.isPending ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save className="h-4 w-4 mr-1" /> Save Changes
                    </span>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Visit Dialog has been removed - visits are now edited directly in the visit log */}
        </>
      )}
    </Layout>
  );
}