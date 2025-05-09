import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, File } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
// Import root canal consent form image
import rootCanalConsentFormImg from "../assets/root_canal_consent.jpg";

interface ConsentFormProps {
  visitId: number;
  formType: string;
  onComplete: () => void;
}

export default function ConsentForm({
  visitId,
  formType,
  onComplete,
}: ConsentFormProps) {
  const { toast } = useToast();
  const [signature, setSignature] = useState<string | null>(null);
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      default:
        return {
          title: "Custom Consent Form",
          content: "Please upload a custom consent form document."
        };
    }
  };

  const formTemplate = getFormTemplate();

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setSignature(null);
    }
  };

  const saveSignature = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const dataURL = signatureRef.current.toDataURL("image/png");
      setSignature(dataURL);
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
  };

  const uploadCustomForm = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        submitConsentForm(dataUrl, 'uploaded');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload the consent form.",
        variant: "destructive",
      });
    }
  };

  const submitConsentForm = async (data: string, type: 'signature' | 'uploaded') => {
    try {
      const payload = {
        visitId,
        formType,
        data,
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
    if (formType === 'custom') {
      uploadCustomForm();
    } else if (signature) {
      submitConsentForm(signature, 'signature');
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
        {formType === 'custom' ? (
          <div className="mb-6 flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-300 rounded-lg bg-neutral-50">
            <File className="h-12 w-12 text-neutral-400 mb-3" />
            <p className="text-neutral-600 mb-4">Upload a custom consent form document</p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
            />
            <Button 
              onClick={uploadCustomForm}
              className="flex items-center"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Form
            </Button>
          </div>
        ) : formType === 'root_canal' ? (
          <>
            <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              {/* Malayalam Root Canal Consent Form */}
              <div className="flex justify-center">
                <img 
                  src={rootCanalConsentFormImg} 
                  alt="Root Canal Consent Form in Malayalam" 
                  className="max-w-full rounded-md border border-gray-200 shadow-sm"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Patient Signature
              </label>
              <div className="border border-neutral-300 rounded-lg bg-white">
                <SignatureCanvas
                  ref={signatureRef}
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
                >
                  Clear
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={saveSignature}
                >
                  Capture Signature
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <p className="text-neutral-700 whitespace-pre-line">{formTemplate.content}</p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Patient Signature
              </label>
              <div className="border border-neutral-300 rounded-lg bg-white">
                <SignatureCanvas
                  ref={signatureRef}
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
                >
                  Clear
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={saveSignature}
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
          >
            Submit Form
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
