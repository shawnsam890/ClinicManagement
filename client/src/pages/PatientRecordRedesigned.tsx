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
import VisitDetailsDisplay from "@/components/VisitDetailsDisplay";
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
  Edit, Save, X, PlusCircle, Trash2, Repeat, CheckCircle2, Activity, Pill, Stethoscope, FileEdit, Image, ExternalLink, Trash } from "lucide-react";
import "./VisitLog.css";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Patient, PatientVisit, Prescription, Invoice as InvoiceType } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
    contactNumber: '',
    email: '',
    gender: '',
    birthDate: '',
  });
  const [newMedicalHistoryOption, setNewMedicalHistoryOption] = useState('');
  const [newDentalHistoryOption, setNewDentalHistoryOption] = useState('');
  const [medicalHistoryOptions, setMedicalHistoryOptions] = useState<string[]>([]);
  const [dentalHistoryOptions, setDentalHistoryOptions] = useState<string[]>([]);
  
  // New state for delete media confirmation
  const [deleteMediaDialog, setDeleteMediaDialog] = useState<{
    isOpen: boolean;
    visitId: number | null;
    fileId: string | null;
    fileName: string | null;
  }>({
    isOpen: false,
    visitId: null,
    fileId: null,
    fileName: null
  });

  useEffect(() => {
    if (patientId) {
      setSelectedVisitId(null);
      setActiveTab("overview");
      setShowPrescriptionForm(false);
      setActiveConsentForm(null);
      setShowInvoice(false);
    }
  }, [patientId]);

  // Fetch all medicine options from settings on component mount
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await fetch('/api/settings/medicines');
        if (response.ok) {
          const data = await response.json();
          const options = data.map((med: any) => med.name);
          localStorage.setItem('medicineOptions', JSON.stringify(options));
        }
      } catch (error) {
        console.error('Error fetching medicines:', error);
      }
    };

    fetchMedicines();
  }, []);

  const [invoicesWithItems, setInvoicesWithItems] = useState<(InvoiceType & { items: any[] })[]>([]);

  // Patient query
  const { 
    data: patient,
    isLoading: isPatientLoading, 
    error: patientError,
  } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
  });

  // Patient Visits query
  const {
    data: visits,
    isLoading: isVisitsLoading,
    error: visitsError
  } = useQuery<PatientVisit[]>({
    queryKey: [`/api/patients/${patientId}/visits`],
    enabled: !!patientId,
  });

  // Prescriptions query
  const {
    data: prescriptions,
    isLoading: isPrescriptionsLoading,
    error: prescriptionsError
  } = useQuery<Prescription[]>({
    queryKey: [`/api/patients/${patientId}/prescriptions`],
    enabled: !!patientId,
  });

  // Invoices query
  const {
    data: invoices,
    isLoading: isInvoicesLoading,
    error: invoicesError
  } = useQuery<InvoiceType[]>({
    queryKey: [`/api/patients/${patientId}/invoices`],
    enabled: !!patientId,
  });

  // Settings for medical and dental history options
  useEffect(() => {
    const fetchHistoryOptions = async () => {
      try {
        const medResponse = await fetch('/api/settings/medical-history-options');
        const dentalResponse = await fetch('/api/settings/dental-history-options');
        
        if (medResponse.ok) {
          const medData = await medResponse.json();
          setMedicalHistoryOptions(medData.options || []);
        }
        
        if (dentalResponse.ok) {
          const dentalData = await dentalResponse.json();
          setDentalHistoryOptions(dentalData.options || []);
        }
      } catch (error) {
        console.error('Error fetching history options:', error);
      }
    };

    fetchHistoryOptions();
  }, []);

  // Fetch invoice items for each invoice
  useEffect(() => {
    const fetchAllInvoiceItems = async () => {
      if (!invoices) return;

      const invoicesWithItemsData = await Promise.all(
        invoices.map(async (invoice) => {
          try {
            const response = await fetch(`/api/invoices/${invoice.id}/items`);
            if (response.ok) {
              const items = await response.json();
              return { ...invoice, items };
            }
            return { ...invoice, items: [] };
          } catch (error) {
            console.error(`Error fetching items for invoice ${invoice.id}:`, error);
            return { ...invoice, items: [] };
          }
        })
      );

      setInvoicesWithItems(invoicesWithItemsData);
    };

    fetchAllInvoiceItems();
  }, [invoices]);

  // Update patient mutation
  const updatePatientMutation = useMutation({
    mutationFn: async (updatedPatient: any) => {
      const response = await apiRequest('PATCH', `/api/patients/${patientId}`, updatedPatient);
      if (!response.ok) {
        throw new Error('Failed to update patient');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}`] });
      toast({
        title: 'Patient Updated',
        description: 'Patient details have been successfully updated.',
      });
      setShowEditPatientDetails(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete media file mutation
  const deleteMediaMutation = useMutation({
    mutationFn: async ({ visitId, fileId }: { visitId: number, fileId: string }) => {
      const response = await apiRequest('DELETE', `/api/visits/${visitId}/media/${fileId}`);
      if (!response.ok) {
        throw new Error('Failed to delete the file');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/visits`] });
      toast({
        title: 'File Deleted',
        description: 'The file has been successfully deleted.',
      });
      // Close the delete confirmation dialog
      setDeleteMediaDialog({
        isOpen: false,
        visitId: null,
        fileId: null,
        fileName: null,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (patient) {
      setPatientForm({
        address: patient.address || '',
        medicalHistory: patient.medicalHistory || '',
        dentalHistory: patient.dentalHistory || '',
        contactNumber: patient.contactNumber || '',
        email: patient.email || '',
        gender: patient.gender || '',
        birthDate: patient.birthDate ? 
          // Format date to YYYY-MM-DD for input
          format(new Date(patient.birthDate), 'yyyy-MM-dd') : '',
      });
    }
  }, [patient]);

  const selectedVisit = visits?.find(visit => visit.id === selectedVisitId) || null;

  const handlePatientFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPatientForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePatientDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updatePatientMutation.mutate(patientForm);
  };

  // Function to handle the delete media confirmation dialog
  const handleDeleteMedia = (visitId: number, fileId: string, fileName: string) => {
    setDeleteMediaDialog({
      isOpen: true,
      visitId,
      fileId,
      fileName
    });
  };

  // Function to confirm and execute the media deletion
  const confirmDeleteMedia = () => {
    if (deleteMediaDialog.visitId && deleteMediaDialog.fileId) {
      deleteMediaMutation.mutate({
        visitId: deleteMediaDialog.visitId,
        fileId: deleteMediaDialog.fileId
      });
    }
  };

  // Function to close the delete confirmation dialog
  const cancelDeleteMedia = () => {
    setDeleteMediaDialog({
      isOpen: false,
      visitId: null,
      fileId: null,
      fileName: null
    });
  };

  if (isPatientLoading) {
    return (
      <Layout title="Patient Record">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-32 h-32 bg-gray-200 rounded-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-40"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (patientError) {
    return (
      <Layout title="Error">
        <div className="flex flex-col items-center justify-center h-screen">
          <h2 className="text-2xl font-semibold mb-2">Error Loading Patient</h2>
          <p className="text-red-500">{(patientError as Error).message}</p>
          <Button 
            className="mt-4"
            onClick={() => navigate('/patients')}
          >
            Return to Patient Database
          </Button>
        </div>
      </Layout>
    );
  }

  if (!patient) {
    return (
      <Layout title="Not Found">
        <div className="flex flex-col items-center justify-center h-screen">
          <h2 className="text-2xl font-semibold mb-2">Patient Not Found</h2>
          <p className="text-muted-foreground">The patient you are looking for does not exist.</p>
          <Button 
            className="mt-4"
            onClick={() => navigate('/patients')}
          >
            Return to Patient Database
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Patient Record">
      {patient && (
        <>
          <div className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-1.5">
                <span>{patient.name}</span>
                <Badge 
                  variant="outline" 
                  className="ml-2 text-xs"
                >
                  {patient.patientId}
                </Badge>
              </h1>
              <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 mt-1.5">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>{patient.gender && patient.age ? `${patient.gender}, ${patient.age} years` : `${patient.gender || patient.age || 'N/A'}`}</span>
                </div>
                {patient.contactNumber && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{patient.contactNumber}</span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{patient.email}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 self-end md:self-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowEditPatientDetails(true)}
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit Details
              </Button>
              <Button 
                size="sm" 
                onClick={() => navigate('/patients')}
              >
                Back to Patients
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 md:flex md:w-auto">
              <TabsTrigger value="overview">Patient Overview</TabsTrigger>
              <TabsTrigger value="visits">
                Visit Log
                {visits && visits.length > 0 && (
                  <Badge className="ml-2">{visits.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Address</h3>
                      <p>{patient.address || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Birth Date</h3>
                      <p>
                        {patient.birthDate 
                          ? format(new Date(patient.birthDate), 'PPP') 
                          : 'Not provided'}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Medical History</h3>
                      <p>{patient.medicalHistory || 'None recorded'}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Dental History</h3>
                      <p>{patient.dentalHistory || 'None recorded'}</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-xl">Prescriptions</CardTitle>
                      <Button
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowPrescriptionForm(true)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        New Prescription
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {prescriptionsError ? (
                        <div className="text-center py-4">
                          <p className="text-red-500">Error loading prescriptions</p>
                        </div>
                      ) : isPrescriptionsLoading ? (
                        <div className="animate-pulse space-y-2">
                          <div className="h-12 bg-muted rounded-md"></div>
                          <div className="h-12 bg-muted rounded-md"></div>
                        </div>
                      ) : prescriptions && prescriptions.length > 0 ? (
                        <div className="space-y-3">
                          {prescriptions.map(prescription => (
                            <div 
                              key={prescription.id} 
                              className="flex items-center justify-between border rounded-md p-3"
                            >
                              <div>
                                <p className="font-medium">
                                  {new Date(prescription.date).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {prescription.medicines?.length || 0} medicine(s)
                                </p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="ml-2"
                                onClick={() => {
                                  setShowPrescriptionForm(true);
                                  // This assumes you have a way to select a prescription for viewing
                                  // You might need additional state for this
                                }}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <Pill className="h-10 w-10 mx-auto mb-2 opacity-20" />
                          <p>No prescriptions yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-xl">Invoices</CardTitle>
                      <Button
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowInvoice(true)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        New Invoice
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {invoicesError ? (
                        <div className="text-center py-4">
                          <p className="text-red-500">Error loading invoices</p>
                        </div>
                      ) : isInvoicesLoading ? (
                        <div className="animate-pulse space-y-2">
                          <div className="h-12 bg-muted rounded-md"></div>
                          <div className="h-12 bg-muted rounded-md"></div>
                        </div>
                      ) : invoicesWithItems && invoicesWithItems.length > 0 ? (
                        <div className="space-y-3">
                          {invoicesWithItems.map(invoice => {
                            // Calculate total amount from invoice items
                            const total = invoice.items?.reduce((sum, item) => 
                              sum + (parseFloat(item.amount) || 0), 0) || 0;
                              
                            return (
                              <div 
                                key={invoice.id} 
                                className="flex items-center justify-between border rounded-md p-3"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">
                                      {new Date(invoice.date).toLocaleDateString()}
                                    </p>
                                    <Badge
                                      variant={invoice.status === 'Paid' ? 'default' : 'outline'}
                                      className="text-xs font-normal py-0"
                                    >
                                      {invoice.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    ₹{total.toFixed(2)} for {invoice.items?.length || 0} item(s)
                                  </p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="ml-2"
                                  onClick={() => {
                                    setShowInvoice(true);
                                    // Assuming you need to set the selected invoice
                                  }}
                                >
                                  <Receipt className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <Receipt className="h-10 w-10 mx-auto mb-2 opacity-20" />
                          <p>No invoices yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Consent Forms</CardTitle>
                  <CardDescription>
                    Digital consent forms signed by this patient
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => setActiveConsentForm("extraction")}>
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">Tooth Extraction</CardTitle>
                      </CardHeader>
                    </Card>
                    
                    <Card className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => setActiveConsentForm("implant")}>
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">Dental Implant</CardTitle>
                      </CardHeader>
                    </Card>
                    
                    <Card className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => setActiveConsentForm("rct")}>
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">Root Canal Treatment</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="visits">
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">Visit History</CardTitle>
                        <CardDescription>
                          Record of all patient visits and treatments
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {visitsError ? (
                      <div className="text-center py-4">
                        <p className="text-red-500">Error loading visits</p>
                      </div>
                    ) : isVisitsLoading ? (
                      <div className="animate-pulse space-y-3">
                        <div className="h-16 bg-muted rounded-md"></div>
                        <div className="h-16 bg-muted rounded-md"></div>
                        <div className="h-16 bg-muted rounded-md"></div>
                      </div>
                    ) : visits && visits.length > 0 ? (
                      <VisitLog 
                        patientId={parseInt(patientId!)}
                        visits={visits}
                        onSelectVisit={(visitId) => setSelectedVisitId(visitId)}
                        selectedVisitId={selectedVisitId}
                      />
                    ) : (
                      <div className="text-center py-12 border rounded-md border-dashed">
                        <CalendarDays className="h-12 w-12 mx-auto mb-3 text-muted-foreground/60" />
                        <h3 className="text-lg font-medium mb-1">No Visit Records Yet</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-4">
                          Create a new visit record to track treatments, findings, and patient progress.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedVisit && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>Visit Details</CardTitle>
                          <CardDescription>
                            {new Date(selectedVisit.date).toLocaleDateString()} - {selectedVisit.visitType}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <h3 className="text-base font-medium">Chief Complaint</h3>
                        <p className="text-sm leading-relaxed">
                          {selectedVisit.chiefComplaint || 'No chief complaint recorded'}
                        </p>
                      </div>

                      {selectedVisit.findings && (
                        <div className="space-y-3">
                          <Accordion type="single" collapsible defaultValue="tooth-findings">
                            <AccordionItem value="tooth-findings">
                              <AccordionTrigger className="text-base font-medium py-1.5">
                                Tooth-related Findings
                              </AccordionTrigger>
                              <AccordionContent>
                                <ToothFindingsSection selectedVisit={selectedVisit} />
                              </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="generalized-findings">
                              <AccordionTrigger className="text-base font-medium py-1.5">
                                Generalized Findings
                              </AccordionTrigger>
                              <AccordionContent>
                                <GeneralizedFindingsSection selectedVisit={selectedVisit} />
                              </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="investigation">
                              <AccordionTrigger className="text-base font-medium py-1.5">
                                Investigation
                              </AccordionTrigger>
                              <AccordionContent>
                                <InvestigationSection selectedVisit={selectedVisit} />
                              </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="follow-up">
                              <AccordionTrigger className="text-base font-medium py-1.5">
                                Follow-up
                              </AccordionTrigger>
                              <AccordionContent>
                                <FollowUpSection selectedVisit={selectedVisit} />
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        <h3 className="text-base font-medium">Treatment Done</h3>
                        <p className="text-sm leading-relaxed">
                          {selectedVisit.treatmentDone || 'No treatment recorded'}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="text-base font-medium">Visit Notes</h3>
                        <p className="text-sm leading-relaxed">
                          {selectedVisit.notes || 'No additional notes'}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="text-base font-medium">Media Gallery</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {(() => {
                            // Parse attachments which might be stored as JSON string
                            let attachmentsArray: any[] = [];
                            try {
                              if (selectedVisit.attachments) {
                                if (typeof selectedVisit.attachments === 'string') {
                                  attachmentsArray = JSON.parse(selectedVisit.attachments);
                                } else if (Array.isArray(selectedVisit.attachments)) {
                                  attachmentsArray = selectedVisit.attachments;
                                }
                              }
                            } catch (error) {
                              console.error("Error parsing attachments:", error);
                            }
                            
                            return attachmentsArray.length > 0 ? (
                              attachmentsArray.map((attachment: any, index: number) => {
                                const isImage = attachment.type?.startsWith('image/');
                                return (
                                  <div 
                                    key={attachment.id || index} 
                                    className="rounded-lg border overflow-hidden aspect-square bg-muted/30 flex items-center justify-center relative group"
                                  >
                                    {isImage ? (
                                      <img 
                                        src={attachment.url}
                                        alt={attachment.name}
                                        className="object-cover w-full h-full"
                                      />
                                    ) : (
                                      <div className="flex flex-col items-center justify-center p-2 text-center">
                                        <FileText className="h-8 w-8 text-muted-foreground mb-1" />
                                        <span className="text-xs text-muted-foreground line-clamp-2">
                                          {attachment.name}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Hover overlay with actions */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-white h-8 w-8"
                                        onClick={() => window.open(attachment.url, '_blank')}
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-white h-8 w-8 hover:text-red-400"
                                        onClick={() => handleDeleteMedia(
                                          selectedVisit.id, 
                                          attachment.id, 
                                          attachment.name
                                        )}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="col-span-full text-center py-8 text-muted-foreground">
                                No media files have been uploaded yet.
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Confirmation Dialog for Media Deletion */}
          <AlertDialog open={deleteMediaDialog.isOpen} onOpenChange={(isOpen) => {
            if (!isOpen) cancelDeleteMedia();
          }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Media File</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{deleteMediaDialog.fileName}"? This action cannot be undone and the file will be permanently removed from the server.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteMediaMutation.isPending}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={confirmDeleteMedia}
                  disabled={deleteMediaMutation.isPending}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {deleteMediaMutation.isPending ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Trash className="h-4 w-4 mr-2" /> Delete
                    </div>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Patient Edit Dialog */}
          <Dialog open={showEditPatientDetails} onOpenChange={setShowEditPatientDetails}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Patient Details</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSavePatientDetails}>
                <div className="grid grid-cols-1 gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="gender" className="text-right">
                      Gender
                    </Label>
                    <Select
                      name="gender"
                      value={patientForm.gender}
                      onValueChange={(value) => 
                        setPatientForm(prev => ({ ...prev, gender: value }))
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="birthDate" className="text-right">
                      Birth Date
                    </Label>
                    <Input
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      value={patientForm.birthDate}
                      onChange={handlePatientFormChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">
                      Address
                    </Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={patientForm.address}
                      onChange={handlePatientFormChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contactNumber" className="text-right">
                      Contact Number
                    </Label>
                    <Input
                      id="contactNumber"
                      name="contactNumber"
                      type="tel"
                      value={patientForm.contactNumber}
                      onChange={handlePatientFormChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={patientForm.email}
                      onChange={handlePatientFormChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="medicalHistory" className="text-right">
                      Medical History
                    </Label>
                    <Textarea
                      id="medicalHistory"
                      name="medicalHistory"
                      value={patientForm.medicalHistory}
                      onChange={handlePatientFormChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dentalHistory" className="text-right">
                      Dental History
                    </Label>
                    <Textarea
                      id="dentalHistory"
                      name="dentalHistory"
                      value={patientForm.dentalHistory}
                      onChange={handlePatientFormChange}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEditPatientDetails(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updatePatientMutation.isPending}>
                    {updatePatientMutation.isPending ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
              </form>
            </DialogContent>
          </Dialog>

          {/* Prescription Form Dialog */}
          {showPrescriptionForm && (
            <PrescriptionForm
              patientId={parseInt(patientId!)}
              onClose={() => setShowPrescriptionForm(false)}
            />
          )}

          {/* Consent Form Dialog */}
          {activeConsentForm && (
            <ConsentForm
              patientId={parseInt(patientId!)}
              patientName={patient.name}
              formType={activeConsentForm}
              onClose={() => setActiveConsentForm(null)}
            />
          )}

          {/* Invoice Form Dialog */}
          {showInvoice && (
            <Invoice
              patientId={parseInt(patientId!)}
              patientName={patient.name}
              onClose={() => setShowInvoice(false)}
            />
          )}

          {/* Edit Visit Dialog has been removed - visits are now edited directly in the visit log */}
        </>
      )}
    </Layout>
  );
}