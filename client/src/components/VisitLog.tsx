import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import ToothFindingsSection from "@/components/ToothFindingsSection";
import GeneralizedFindingsSection from "@/components/GeneralizedFindingsSection";
import InvestigationSection from "@/components/InvestigationSection";
import FollowUpSection from "@/components/FollowUpSection";
import PrescriptionForm from "@/components/PrescriptionForm";
import Invoice from "@/components/Invoice";
import ConsentForm from "@/components/ConsentForm";

import { Image, Video, Upload, FileCheck, X, FileText, Camera, File, Trash, Eye, Printer } from "lucide-react";
import { PatientVisit, InsertPatientVisit } from "@shared/schema";

interface VisitLogProps {
  visitId: number;
  patientId: string;
  onBack?: () => void;
}

// Interface for the consent form preview data
interface ConsentFormPreview {
  image: string;
  title: string;
  timestamp: string;
  doctorSignature?: string;
  doctorName?: string;
  patientInfo?: {
    name: string;
    address: string;
    phone: string;
    date?: string;
  };
}

export default function VisitLog({ visitId, patientId, onBack }: VisitLogProps) {
  const { toast } = useToast();
  const [visitData, setVisitData] = useState<Partial<PatientVisit>>({});
  const [showInvoice, setShowInvoice] = useState(false);
  const [showConsentForm, setShowConsentForm] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  // State for the consent form preview dialog
  const [previewForm, setPreviewForm] = useState<ConsentFormPreview | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  // Fetch visit data
  const { data: visit, isLoading } = useQuery<PatientVisit>({
    queryKey: [`/api/visits/${visitId}`],
    enabled: !!visitId,
  });

  // Fetch all dropdown options from central settings
  const { data: dropdownOptions = {} } = useQuery({
    queryKey: ['/api/settings/key/dropdown_options'],
    select: (data: any) => data?.settingValue || {},
  });

  // Fetch area options from dedicated setting
  const { data: areaOptionsData = [] } = useQuery<string[]>({
    queryKey: ['/api/settings/key/area_options'],
    select: (data: any) => data?.settingValue || [],
  });

  // Extract specific option arrays
  const complaintOptions = dropdownOptions.chiefComplaint || [];
  const areaOptions = areaOptionsData;
  const treatmentDoneOptions = dropdownOptions.treatmentDone || [];
  const treatmentPlanOptions = dropdownOptions.treatmentPlan || [];
  const adviceOptions = dropdownOptions.advice || [];

  // Set initial form data when visit is loaded
  useEffect(() => {
    if (visit) {
      setVisitData({
        chiefComplaint: visit.chiefComplaint || '',
        areaOfComplaint: visit.areaOfComplaint || '',
        treatmentDone: visit.treatmentDone || '',
        treatmentPlan: visit.treatmentPlan || '',
        advice: visit.advice || '',
        notes: visit.notes || '',
      });
    }
  }, [visit]);

  // Initialize attachments from visit data
  useEffect(() => {
    if (visit && visit.attachments) {
      setAttachments(Array.isArray(visit.attachments) ? visit.attachments : []);
    }
  }, [visit]);

  // Update visit mutation
  const updateVisitMutation = useMutation({
    mutationFn: async (updatedData: Partial<PatientVisit>) => {
      const res = await apiRequest("PUT", `/api/visits/${visitId}`, updatedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}`] });
      toast({
        title: "Success",
        description: "Visit information updated",
      });
    },
    onError: (error) => {
      console.error("Error updating visit:", error);
      toast({
        title: "Error",
        description: "Failed to update visit information",
        variant: "destructive",
      });
    },
  });

  // Handle form input changes
  const handleInputChange = (field: keyof PatientVisit, value: string) => {
    setVisitData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle form submission
  const handleSave = (field: keyof PatientVisit) => {
    // Only update the specific field that was changed
    updateVisitMutation.mutate({ [field]: visitData[field] });
  };

  // Handle consent form completion
  const handleConsentFormComplete = () => {
    setShowConsentForm(null);
    queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}`] });
    toast({
      title: "Success",
      description: "Consent form added successfully."
    });
  };
  
  // Function to handle printing the consent form
  const handlePrintConsentForm = () => {
    // Create a new window with just the image
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Could not open print preview. Please check your popup blocker settings.",
        variant: "destructive"
      });
      return;
    }
    
    // Write the HTML content to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${previewForm?.title || 'Consent Form'}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .info-container {
              width: 100%;
              max-width: 800px;
              margin-bottom: 20px;
              border: 1px solid #ddd;
              border-radius: 8px;
              overflow: hidden;
            }
            .info-header {
              background-color: #f5f5f5;
              padding: 10px 15px;
              border-bottom: 1px solid #ddd;
              font-weight: bold;
            }
            .info-content {
              padding: 15px;
              font-size: 14px;
            }
            .grid-container {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            .image-container {
              max-width: 800px;
              width: 100%;
              margin: 20px 0;
              border: 1px solid #ddd;
              border-radius: 8px;
              overflow: hidden;
            }
            img.form-image {
              width: 100%;
              height: auto;
            }
            .signature-container {
              display: flex;
              justify-content: space-between;
              width: 100%;
              max-width: 800px;
              margin-top: 20px;
            }
            .signature-box {
              width: 48%;
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 10px;
              text-align: center;
            }
            .signature-img {
              max-width: 200px;
              max-height: 100px;
              margin: 10px auto;
              display: block;
            }
            .timestamp {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${previewForm?.title || 'Consent Form'}</h2>
          </div>
          
          <div class="info-container">
            <div class="info-header">Patient Information</div>
            <div class="info-content grid-container">
              <p><strong>Patient Name:</strong> ${previewForm?.patientInfo?.name || 'Not provided'}</p>
              <p><strong>Phone:</strong> ${previewForm?.patientInfo?.phone || 'Not provided'}</p>
              <p><strong>Address:</strong> ${previewForm?.patientInfo?.address || 'Not provided'}</p>
              <p><strong>Date:</strong> ${previewForm?.patientInfo?.date ? new Date(previewForm.patientInfo.date).toLocaleDateString() : new Date(previewForm?.timestamp || '').toLocaleDateString()}</p>
            </div>
          </div>
          
          <div class="image-container">
            <img class="form-image" src="${previewForm?.image || ''}" alt="Consent Form" />
          </div>
          
          <div class="signature-container">
            <div class="signature-box">
              <p><strong>Patient's Signature</strong></p>
              ${previewForm?.patientInfo?.name ? `<p>${previewForm.patientInfo.name}</p>` : ''}
            </div>
            <div class="signature-box">
              <p><strong>Doctor's Signature</strong></p>
              ${previewForm?.doctorName ? `<p>${previewForm.doctorName}</p>` : ''}
              ${previewForm?.doctorSignature ? `<img class="signature-img" src="${previewForm.doctorSignature}" alt="Doctor's Signature">` : ''}
            </div>
          </div>
          
          <div class="timestamp">
            <p>Form signed on: ${new Date(previewForm?.timestamp || '').toLocaleString()}</p>
          </div>
          
          <button style="margin-top: 20px; padding: 10px; background: #0077cc; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.print(); return false;">
            Print
          </button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    if (!event.target.files || !event.target.files[0]) {
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

      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}`] });
      toast({
        title: "Success",
        description: `${fileType} uploaded successfully.`,
      });

      // Re-fetch the visit data to get updated attachments
      const visitResponse = await fetch(`/api/visits/${visitId}`);
      const visitData = await visitResponse.json();
      if (visitData.attachments) {
        setAttachments(Array.isArray(visitData.attachments) ? visitData.attachments : []);
      }
    } catch (error) {
      console.error(`Error uploading ${fileType}:`, error);
      toast({
        title: "Error",
        description: `Failed to upload ${fileType}.`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading visit data...</div>;
  }

  // Fetch patient info
  const { data: patientData } = useQuery<{ id: number; name: string; patientId: string }>({
    queryKey: [`/api/patients/patientId/${patientId}`],
    enabled: !!patientId && showInvoice,
  });

  if (showInvoice) {
    return (
      <Invoice 
        patientId={patientId} 
        visitId={visitId}
        patientName={patientData?.name || "Patient"}
        onBack={() => setShowInvoice(false)}
      />
    );
  }

  // Render consent form if active
  if (showConsentForm) {
    return (
      <ConsentForm
        visitId={visitId}
        formType={showConsentForm}
        onComplete={handleConsentFormComplete}
      />
    );
  }

  return (
    <Card className="border-none shadow-none">
      {/* Consent Form Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewForm?.title || 'Consent Form'}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-4">
            {/* Patient Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="font-semibold mb-2">Patient Information:</p>
              <div className="text-sm grid grid-cols-2 gap-2">
                <p><span className="font-medium">Name:</span> {previewForm?.patientInfo?.name || 'Not provided'}</p>
                <p><span className="font-medium">Phone:</span> {previewForm?.patientInfo?.phone || 'Not provided'}</p>
                <p><span className="font-medium">Address:</span> {previewForm?.patientInfo?.address || 'Not provided'}</p>
                <p><span className="font-medium">Date:</span> {previewForm?.patientInfo?.date ? new Date(previewForm.patientInfo.date).toLocaleDateString() : new Date(previewForm?.timestamp || '').toLocaleDateString()}</p>
              </div>
            </div>
            
            {/* Image Container */}
            <div className="bg-white border rounded-md overflow-hidden">
              {previewForm?.image && (
                <img 
                  src={previewForm.image} 
                  alt="Consent Form" 
                  className="w-full h-auto object-contain" 
                />
              )}
            </div>
            
            {/* Signatures Section */}
            <div className="mt-4 flex flex-wrap gap-4">
              {/* Doctor Signature */}
              {previewForm?.doctorSignature && (
                <div className="flex-1 min-w-[200px] border rounded-md p-3 bg-white">
                  <p className="text-xs font-medium mb-2">Doctor's Signature:</p>
                  <div className="flex items-center">
                    <img 
                      src={previewForm.doctorSignature} 
                      alt="Doctor Signature" 
                      className="h-16 object-contain border p-1 rounded"
                    />
                    {previewForm.doctorName && (
                      <p className="ml-2 text-xs">{previewForm.doctorName}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-3 text-xs text-gray-500 text-right">
              Signed on: {previewForm?.timestamp ? new Date(previewForm.timestamp).toLocaleString() : ''}
            </div>
          </div>
          
          <DialogFooter className="flex justify-end space-x-2">
            <Button 
              onClick={handlePrintConsentForm}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Form
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowPreviewDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-xl font-semibold">Visit Log</CardTitle>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back to Visits
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        {/* Chief Complaint Section - Two Columns */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Chief Complaint</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Complaint</Label>
              <Select 
                value={visitData.chiefComplaint || ''} 
                onValueChange={(value) => handleInputChange('chiefComplaint', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select complaint" />
                </SelectTrigger>
                <SelectContent>
                  {complaintOptions.map((option: string, index: number) => (
                    <SelectItem key={index} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location/Area</Label>
              <Select 
                value={visitData.areaOfComplaint || ''} 
                onValueChange={(value) => handleInputChange('areaOfComplaint', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {areaOptions.map((option: string, index: number) => (
                    <SelectItem key={index} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              size="sm" 
              onClick={() => {
                // Save both fields at once
                updateVisitMutation.mutate({
                  chiefComplaint: visitData.chiefComplaint,
                  areaOfComplaint: visitData.areaOfComplaint
                });
              }}
            >
              Save
            </Button>
          </div>
        </div>

        <Separator />

        {/* Oral Examination Section */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Oral Examination</Label>
          
          {/* Tooth Findings Component */}
          <ToothFindingsSection visitId={visitId} />
          
          {/* Generalized Findings Component */}
          <GeneralizedFindingsSection visitId={visitId} />
        </div>

        <Separator />

        {/* Investigation Section */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Investigation Done</Label>
          <InvestigationSection visitId={visitId} />
        </div>

        <Separator />

        {/* Treatment Plan Section */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Treatment Plan</Label>
          <Select 
            value={visitData.treatmentPlan || ''} 
            onValueChange={(value) => handleInputChange('treatmentPlan', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select treatment plan" />
            </SelectTrigger>
            <SelectContent>
              {treatmentPlanOptions.map((option: string, index: number) => (
                <SelectItem key={index} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => handleSave('treatmentPlan')}>
            Save
          </Button>
        </div>

        <Separator />

        {/* Treatment Done Section */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Treatment Done</Label>
          <Select 
            value={visitData.treatmentDone || ''} 
            onValueChange={(value) => handleInputChange('treatmentDone', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select treatment done" />
            </SelectTrigger>
            <SelectContent>
              {treatmentDoneOptions.map((option: string, index: number) => (
                <SelectItem key={index} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => handleSave('treatmentDone')}>
            Save
          </Button>
        </div>

        <Separator />

        {/* Prescription Section */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Rx (Prescription)</Label>
          <PrescriptionForm 
            visitId={visitId} 
            patientId={patientId}
          />
        </div>

        <Separator />

        {/* Advice Section */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Advice</Label>
          <Select 
            value={visitData.advice || ''} 
            onValueChange={(value) => handleInputChange('advice', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select advice" />
            </SelectTrigger>
            <SelectContent>
              {adviceOptions.map((option: string, index: number) => (
                <SelectItem key={index} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => handleSave('advice')}>
            Save
          </Button>
        </div>

        <Separator />

        {/* Notes Section */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Notes</Label>
          <Textarea 
            value={visitData.notes || ''} 
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="min-h-[100px]"
            placeholder="Enter any additional notes"
          />
          <Button size="sm" onClick={() => handleSave('notes')}>
            Save
          </Button>
        </div>

        <Separator />

        {/* Invoice Section */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Invoice</Label>
          <Button onClick={() => setShowInvoice(true)}>
            Manage Invoice
          </Button>
        </div>

        <Separator />

        {/* Follow-up Section */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Follow-up</Label>
          <FollowUpSection visitId={visitId} patientId={patientId} />
        </div>

        <Separator />

        {/* Attachments Section */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Attachments</Label>
          <div className="flex flex-wrap gap-4 mb-4">
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
              />
            </label>
          </div>

          {/* Display existing attachments */}
          {attachments && attachments.length > 0 ? (
            <div className="space-y-4">
              <Label>Uploaded Files</Label>
              <ScrollArea className="h-60 w-full rounded-md border p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center p-2 rounded-lg border bg-neutral-50">
                      <div className="mr-3">
                        {attachment.type?.includes('image') ? (
                          <Image className="h-6 w-6 text-primary" />
                        ) : attachment.type?.includes('video') ? (
                          <Video className="h-6 w-6 text-primary" />
                        ) : (
                          <File className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">{attachment.name}</p>
                        <p className="text-xs text-neutral-500">
                          {new Date(attachment.dateAdded).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a 
                          href={attachment.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-dark text-sm px-2 py-1 rounded hover:bg-neutral-200 transition-colors"
                        >
                          View
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/visits/${visitId}/attachments/${index}`, {
                                method: 'DELETE',
                              });
                              
                              if (response.ok) {
                                // Remove the attachment from the local state
                                const updatedAttachments = [...attachments];
                                updatedAttachments.splice(index, 1);
                                setAttachments(updatedAttachments);
                                
                                toast({
                                  title: "Success",
                                  description: "Attachment deleted successfully.",
                                });
                              } else {
                                throw new Error("Failed to delete attachment");
                              }
                            } catch (error) {
                              console.error("Error deleting attachment:", error);
                              toast({
                                title: "Error",
                                description: "Failed to delete attachment.",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No attachments yet. Add photos or videos using the buttons above.</p>
          )}
        </div>

        <Separator />

        {/* Consent Forms Section */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Consent Forms</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Button
              type="button"
              variant="outline"
              className="flex items-center justify-between"
              onClick={() => setShowConsentForm("extraction")}
            >
              <span>Extraction Consent</span>
              <FileCheck className="h-4 w-4 text-primary" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex items-center justify-between"
              onClick={() => setShowConsentForm("root_canal")}
            >
              <span>Root Canal Consent</span>
              <FileCheck className="h-4 w-4 text-primary" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex items-center justify-between"
              onClick={() => setShowConsentForm("custom")}
            >
              <span>Upload Custom Form</span>
              <Upload className="h-4 w-4 text-primary" />
            </Button>
          </div>

          {/* Display existing consent forms */}
          {visit?.consentForms && Array.isArray(visit.consentForms) && visit.consentForms.length > 0 ? (
            <div className="space-y-4">
              <Label>Signed Consent Forms</Label>
              <ScrollArea className="h-60 w-full rounded-md border p-4">
                <div className="space-y-3">
                  {visit.consentForms.map((form: any, index: number) => (
                    <div key={index} className="flex items-center p-3 rounded-lg border bg-neutral-50">
                      <div className="mr-3">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-neutral-900">
                            {form.formType === 'extraction' 
                              ? 'Extraction Consent' 
                              : form.formType === 'root_canal'
                                ? 'Root Canal Consent'
                                : 'Custom Consent Form'}
                          </p>
                          <Badge variant="outline" className="ml-2">
                            {form.type === 'signature' ? 'Signed' : 'Uploaded'}
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-500">
                          {new Date(form.timestamp).toLocaleString()}
                        </p>
                        {form.patientInfo && (
                          <div className="mt-1 text-xs text-neutral-600">
                            <p>Name: {form.patientInfo.name}</p>
                            <p>Phone: {form.patientInfo.phone}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* View button for detailed view */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // For signature type, show the details
                            const consentDetails = form.type === 'signature' 
                              ? {
                                  ...form,
                                  patientInfo: form.patientInfo || { 
                                    name: 'Not provided', 
                                    address: 'Not provided',
                                    phone: 'Not provided',
                                    date: new Date(form.timestamp)
                                  },
                                  title: form.formType === 'extraction' 
                                    ? 'Extraction Consent' 
                                    : form.formType === 'root_canal'
                                      ? 'Root Canal Consent'
                                      : 'Custom Consent Form'
                                }
                              : { 
                                  ...form,
                                  title: 'Uploaded Consent Form' 
                                };
                                
                            // Open a dialog to show the full consent form
                            if (form.type === 'signature') {
                              // Show modal with the signed form image
                              if (form.patientSignature) {
                                const formTitle = form.formType === 'extraction' 
                                  ? 'Extraction Consent Form' 
                                  : form.formType === 'root_canal'
                                    ? 'Root Canal Consent Form'
                                    : 'Custom Consent Form';
                                    
                                // Set the preview form data for the dialog
                                setPreviewForm({
                                  image: form.patientSignature,
                                  title: formTitle,
                                  timestamp: form.timestamp,
                                  doctorSignature: form.doctorSignature,
                                  doctorName: form.doctorName || "Doctor",
                                  patientInfo: form.patientInfo || {
                                    name: 'Not provided',
                                    address: 'Not provided',
                                    phone: 'Not provided',
                                    date: form.timestamp
                                  }
                                });
                                // Open the dialog
                                setShowPreviewDialog(true);
                              } else {
                                // Fallback if no image
                                toast({
                                  title: "Error",
                                  description: "Signed form image not found.",
                                  variant: "destructive",
                                });
                              }
                            } else {
                              // For uploaded forms, show in dialog or open in new tab
                              if (form.data) {
                                window.open(form.data, '_blank');
                              } else {
                                toast({
                                  title: "Error",
                                  description: "Form not found or was not properly uploaded.",
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/visits/${visitId}/consent-forms/${index}`, {
                                method: 'DELETE',
                              });
                              
                              if (response.ok) {
                                // Refresh data through invalidation
                                queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}`] });
                                
                                toast({
                                  title: "Success",
                                  description: "Consent form deleted successfully.",
                                });
                              } else {
                                throw new Error("Failed to delete consent form");
                              }
                            } catch (error) {
                              console.error("Error deleting consent form:", error);
                              toast({
                                title: "Error",
                                description: "Failed to delete consent form.",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Show form thumbnail preview */}
                      {form.patientSignature && (
                        <div className="w-full mt-2">
                          <p className="text-xs font-medium mb-1">Preview:</p>
                          <div className="border rounded bg-white p-1 max-w-[150px]">
                            <img 
                              src={form.patientSignature} 
                              alt="Consent Form" 
                              className="h-14 w-auto object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No consent forms yet. Use the buttons above to add patient consent forms.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}