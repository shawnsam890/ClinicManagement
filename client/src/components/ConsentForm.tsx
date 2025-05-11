import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, File, Calendar, Trash, X, Eraser, CheckCircle2, PenTool } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { DoctorSignature } from "@shared/schema";
import { mergeRefs } from "@/lib/utils";
import html2canvas from 'html2canvas';

// Import consent form images
import rootCanalConsentFormImg from "@assets/root canal consent form.jpg";
import dentalExtractionFormImg from "@assets/Dental Extraction.jpg";

interface ConsentFormProps {
  visitId: number;
  patientName?: string;
  formType?: string;
  onComplete?: () => void;
  onClearSignature?: () => void;
}

interface PatientFormInfo {
  name: string;
  address: string;
  phone: string;
  date: Date;
}

export default function ConsentForm({
  visitId,
  patientName,
  formType = "dental",
  onComplete = () => {},
  onClearSignature,
}: ConsentFormProps) {
  const { toast } = useToast();
  const [patientSignature, setPatientSignature] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [signatureMode, setSignatureMode] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [formImage, setFormImage] = useState<string | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientFormInfo>({
    name: '',
    address: '',
    phone: '',
    date: new Date(),
  });
  
  // Refs
  const patientSignatureRef = useRef<SignatureCanvas | null>(null);
  const doctorSignatureRef = useRef<SignatureCanvas | null>(null);
  
  // Function to clear patient signature
  const clearPatientSignature = () => {
    if (patientSignatureRef.current) {
      patientSignatureRef.current.clear();
      setPatientSignature(null);
    }
    if (onClearSignature) {
      onClearSignature();
    }
  };
  const signatureCanvasRef = useRef<SignatureCanvas | null>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);
  // No longer needed: const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch doctor signatures
  const { data: doctorSignatures = [] } = useQuery<DoctorSignature[]>({
    queryKey: ['/api/doctor-signatures'],
  });

  // Fetch patient info for pre-filling form
  const { data: patientData } = useQuery<any>({
    queryKey: [`/api/visits/${visitId}`],
    enabled: !!visitId,
  });

  // Fill patient info when data is loaded
  useEffect(() => {
    if (patientData && patientData.patientId) {
      // Fetch patient details
      fetch(`/api/patients/patientId/${patientData.patientId}`)
        .then(res => res.json())
        .then(patient => {
          setPatientInfo(prev => ({
            ...prev,
            name: patient.name || '',
            address: patient.address || '',
            phone: patient.phoneNumber || ''
          }));
        })
        .catch(err => console.error('Error fetching patient data:', err));
    }
  }, [patientData]);

  const getFormTemplate = () => {
    switch (formType) {
      case "extraction":
        return {
          title: "Extraction Consent Form",
          content: `
            I hereby consent to the extraction of tooth/teeth as deemed necessary by my dental provider.
            
            I understand the risks associated with extraction, including pain, swelling, bleeding, infection, dry socket, damage to adjacent teeth, incomplete removal of tooth or roots, jaw fracture, and sinus exposure.
            
            I have been informed about alternative treatments and potential consequences of non-treatment.
            
            I acknowledge that no guarantees have been made regarding the outcome of this procedure.
          `
        };
      case "root_canal":
        return {
          title: "Root Canal Consent Form",
          content: `
            I hereby consent to root canal treatment as deemed necessary by my dental provider.
            
            I understand the risks associated with root canal treatment, including pain, infection, instrument breakage, perforations, and the possibility of needing additional procedures.
            
            I acknowledge that root canal treatment may not relieve all symptoms and that further treatment, including extraction, may be necessary.
            
            I have been informed about alternative treatments and potential consequences of non-treatment.
          `
        };
      case "implant":
        return {
          title: "Implant Consent Form",
          content: `
            I hereby consent to dental implant treatment as deemed necessary by my dental provider.
            
            I understand the risks associated with dental implants, including infection, implant failure, nerve damage, and the possibility of needing additional procedures.
            
            I acknowledge that dental implant treatment requires proper care and maintenance, and that success depends on various factors including bone quality and oral hygiene.
            
            I have been informed about alternative treatments and potential consequences of non-treatment.
          `
        };
      default:
        return {
          title: "Dental Procedure Consent Form",
          content: "Standard dental procedure consent form"
        };
    }
  };

  const formTemplate = getFormTemplate();

  // New form and signature handling methods
  useEffect(() => {
    // Initialize with the appropriate form based on the form type
    switch (formType) {
      case 'root_canal':
        setFormImage(rootCanalConsentFormImg);
        break;
      case 'extraction':
        // Use the extraction consent form image
        setFormImage(dentalExtractionFormImg);
        break;
      case 'implant':
        // Since this is a PDF, we would convert it to an image
        // For now, let's use the root canal form as placeholder  
        setFormImage(rootCanalConsentFormImg);
        break;
      default:
        setFormImage(null);
    }
  }, [formType]);

  const clearSignature = () => {
    // Clear the main signature canvas
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
      setPatientSignature(null);
      setSignatureMode(false);
    }
    
    // Also clear the patient signature if available
    clearPatientSignature();
    
    toast({
      title: "Signature Cleared",
      description: "Your signature has been cleared."
    });
  };

  const captureFormWithSignatures = async () => {
    if (!formContainerRef.current) return null;
    
    try {
      const canvas = await html2canvas(formContainerRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing form:', error);
      toast({
        title: "Error",
        description: "Failed to capture signed form",
        variant: "destructive"
      });
      return null;
    }
  };

  const startSignature = () => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
    }
    setSignatureMode(true);
  };

  const finishDrawing = async () => {
    if (!signatureCanvasRef.current || signatureCanvasRef.current.isEmpty()) {
      toast({
        title: "Empty Signature",
        description: "Please provide a signature before finishing.",
        variant: "destructive",
      });
      return;
    }

    // Capture the current state of the form with the signature
    const signedFormImage = await captureFormWithSignatures();
    
    if (signedFormImage) {
      setFormImage(signedFormImage);
      setPatientSignature(signedFormImage); // Store the signed form
      setSignatureMode(false);
      
      toast({
        title: "Signature Completed",
        description: "Signature has been added to the form.",
      });
    }
  };

  const handlePatientInfoChange = (field: keyof PatientFormInfo, value: string | Date) => {
    setPatientInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const submitConsentForm = async (patientSigData: string, type: 'signature' | 'uploaded') => {
    try {
      // For signature type, validate patient info and doctor selection
      if (type === 'signature') {
        if (!patientInfo.name || !patientInfo.address || !patientInfo.phone) {
          toast({
            title: "Missing Information",
            description: "Please fill in all patient information fields.",
            variant: "destructive",
          });
          return;
        }

        // Only check for doctor selection if there are doctors available to select
        if (doctorSignatures.length > 0 && !selectedDoctorId) {
          toast({
            title: "Doctor Selection Required",
            description: "Please select a doctor for the consent form.",
            variant: "destructive",
          });
          return;
        }
      }

      // Get doctor signature if selected
      let doctorSignatureImage = null;
      if (selectedDoctorId) {
        const selectedDoctor = doctorSignatures.find(doc => doc.id === selectedDoctorId);
        if (selectedDoctor) {
          doctorSignatureImage = selectedDoctor.signatureImage;
        }
      }

      const payload = {
        visitId,
        formType,
        patientSignature: patientSigData,
        doctorSignature: doctorSignatureImage,
        patientInfo: type === 'signature' ? patientInfo : undefined,
        type,
        timestamp: new Date().toISOString(),
      };

      // Get the current visit
      const visitResponse = await fetch(`/api/visits/${visitId}`);
      const visit = await visitResponse.json();
      
      // Update consent forms array
      const consentForms = visit.consentForms || [];
      consentForms.push(payload);
      
      // Update the visit with the new consent form
      await apiRequest('PUT', `/api/visits/${visitId}`, {
        consentForms
      });

      toast({
        title: "Form Submitted",
        description: "Consent form has been successfully submitted.",
      });
      
      onComplete();
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit the consent form.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = () => {
    if (patientSignature) {
      submitConsentForm(patientSignature, 'signature');
    } else {
      toast({
        title: "Missing Signature",
        description: "Please sign the form before submitting.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-heading text-primary">{formTemplate.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {(formType === 'root_canal' || formType === 'extraction' || formType === 'implant' || true) ? (
          <>
            {/* Form with direct drawing functionality */}
            <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="relative" ref={formContainerRef}>
                {/* Base image or previously captured image with signatures */}
                {formImage ? (
                  <img 
                    src={formImage} 
                    alt={`${formTemplate.title} in Malayalam`} 
                    className="max-w-full rounded-md border border-gray-200 shadow-sm"
                  />
                ) : (
                  <div className="flex items-center justify-center h-96 bg-neutral-100 rounded-md border border-gray-200">
                    <span className="text-neutral-400">Loading form...</span>
                  </div>
                )}
                
                {/* Overlay for signature drawing - only shown when in signature mode */}
                {signatureMode && (
                  <div className="absolute inset-0 z-10 pointer-events-auto">
                    <SignatureCanvas
                      ref={signatureCanvasRef}
                      canvasProps={{
                        className: "w-full h-full absolute inset-0 z-20",
                        style: { 
                          // Highlight the signature area
                          border: "3px solid rgba(59, 130, 246, 0.5)"
                        }
                      }}
                      backgroundColor="transparent"
                    />
                  </div>
                )}
              </div>
              
              {/* Signature controls */}
              <div className="mt-4 flex flex-wrap gap-2 justify-between items-center">
                <div className="flex space-x-2">
                  {!signatureMode ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={startSignature}
                      disabled={!!patientSignature}
                      className="flex items-center text-blue-600 border-blue-300"
                    >
                      <PenTool className="mr-2 h-4 w-4" />
                      Sign Form
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={clearSignature}
                        className="flex items-center"
                      >
                        <Eraser className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                      <Button 
                        size="sm"
                        onClick={finishDrawing}
                        className="flex items-center"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Done
                      </Button>
                    </>
                  )}
                </div>
                
                {signatureMode && (
                  <div className="text-sm font-medium text-neutral-700">
                    Adding Signature
                  </div>
                )}
              </div>
            </div>
            
            {/* Patient Information Fields */}
            <div className="mb-6 space-y-4">
              <h3 className="text-base font-medium text-neutral-800">Patient Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patientName">Name</Label>
                  <Input 
                    id="patientName"
                    value={patientInfo.name}
                    onChange={(e) => handlePatientInfoChange('name', e.target.value)}
                    placeholder="Patient Name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="patientPhone">Phone Number</Label>
                  <Input 
                    id="patientPhone"
                    value={patientInfo.phone}
                    onChange={(e) => handlePatientInfoChange('phone', e.target.value)}
                    placeholder="Phone Number"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="patientAddress">Address</Label>
                <Input 
                  id="patientAddress"
                  value={patientInfo.address}
                  onChange={(e) => handlePatientInfoChange('address', e.target.value)}
                  placeholder="Address"
                />
              </div>
              
              <div className="w-full md:w-1/2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {patientInfo.date ? format(patientInfo.date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={patientInfo.date}
                      onSelect={(date) => date && handlePatientInfoChange('date', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Doctor Selection */}
            {!patientSignature && (
              <div className="mb-6">
                <Label htmlFor="doctorSelect">Select Doctor (Optional Pre-set Signature)</Label>
                <Select
                  value={selectedDoctorId?.toString() || ''}
                  onValueChange={(value) => setSelectedDoctorId(parseInt(value))}
                >
                  <SelectTrigger id="doctorSelect">
                    <SelectValue placeholder="Select Doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctorSignatures.length > 0 ? (
                      doctorSignatures.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id.toString()}>
                          {doctor.doctorName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No doctors available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {selectedDoctorId && (
                  <div className="mt-2">
                    <Label>Doctor's Signature Preview</Label>
                    <div className="mt-1 p-2 border rounded-lg bg-white">
                      <img 
                        src={doctorSignatures.find(d => d.id === selectedDoctorId)?.signatureImage || ''}
                        alt="Doctor's Signature"
                        className="max-h-16 object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <p className="text-neutral-700 whitespace-pre-line">{formTemplate.content}</p>
            </div>
            
            {/* Patient Information Fields */}
            <div className="mb-6 space-y-4">
              <h3 className="text-base font-medium text-neutral-800">Patient Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patientName">Name</Label>
                  <Input 
                    id="patientName"
                    value={patientInfo.name}
                    onChange={(e) => handlePatientInfoChange('name', e.target.value)}
                    placeholder="Patient Name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="patientPhone">Phone Number</Label>
                  <Input 
                    id="patientPhone"
                    value={patientInfo.phone}
                    onChange={(e) => handlePatientInfoChange('phone', e.target.value)}
                    placeholder="Phone Number"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="patientAddress">Address</Label>
                <Input 
                  id="patientAddress"
                  value={patientInfo.address}
                  onChange={(e) => handlePatientInfoChange('address', e.target.value)}
                  placeholder="Address"
                />
              </div>
              
              <div className="w-full md:w-1/2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {patientInfo.date ? format(patientInfo.date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={patientInfo.date}
                      onSelect={(date) => date && handlePatientInfoChange('date', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Doctor Selection */}
            <div className="mb-6">
              <Label htmlFor="doctorSelect">Select Doctor</Label>
              <Select
                value={selectedDoctorId?.toString() || ''}
                onValueChange={(value) => setSelectedDoctorId(parseInt(value))}
              >
                <SelectTrigger id="doctorSelect">
                  <SelectValue placeholder="Select Doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctorSignatures.length > 0 ? (
                    doctorSignatures.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        {doctor.doctorName}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No doctors available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {selectedDoctorId && (
                <div className="mt-2">
                  <Label>Doctor's Signature Preview</Label>
                  <div className="mt-1 p-2 border rounded-lg bg-white">
                    <img 
                      src={doctorSignatures.find(d => d.id === selectedDoctorId)?.signatureImage || ''}
                      alt="Doctor's Signature"
                      className="max-h-16 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Patient Signature */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Patient Signature
              </label>
              <div className="border border-neutral-300 rounded-lg bg-white">
                <SignatureCanvas
                  ref={patientSignatureRef}
                  canvasProps={{
                    className: "w-full h-40 rounded-lg"
                  }}
                  backgroundColor="white"
                />
              </div>
              <div className="flex mt-2 space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearSignature}
                  className="flex items-center"
                >
                  <Eraser className="mr-1.5 h-3.5 w-3.5" /> Clear
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (patientSignatureRef.current && !patientSignatureRef.current.isEmpty()) {
                      const dataURL = patientSignatureRef.current.toDataURL("image/png");
                      setPatientSignature(dataURL);
                      toast({
                        title: "Signature Captured",
                        description: "Your signature has been successfully captured.",
                      });
                    } else {
                      toast({
                        title: "Empty Signature",
                        description: "Please provide your signature before saving.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Capture Signature
                </Button>
              </div>
            </div>
          </>
        )}
        
        <div className="flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={onComplete}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!patientSignature}
          >
            Submit Form
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}