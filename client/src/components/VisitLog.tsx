import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PatientVisit } from "@shared/schema";

// Import required UI components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

// Import specialized section components
import ToothFindingsSection from "@/components/ToothFindingsSection";
import GeneralizedFindingsSection from "@/components/GeneralizedFindingsSection";
import InvestigationSection from "@/components/InvestigationSection";
import PrescriptionForm from "@/components/PrescriptionForm";
import FollowUpSection from "@/components/FollowUpSection";
import InvoiceForm from "@/components/InvoiceForm";

interface VisitLogProps {
  visitId: number;
  patientId: string;
  visit?: PatientVisit;
  onBack?: () => void;
}

export default function VisitLog({ visitId, patientId, visit, onBack }: VisitLogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    chiefComplaint: visit?.chiefComplaint || "",
    treatmentPlan: visit?.treatmentPlan || "",
    treatmentDone: visit?.treatmentDone || "",
    advice: visit?.advice || "",
    notes: visit?.notes || ""
  });

  // Fetch settings for dropdown options
  const { data: settings = [] } = useQuery<any[]>({
    queryKey: ['/api/settings/category/patient_options'],
  });

  // Update visit mutation
  const updateVisitMutation = useMutation({
    mutationFn: async (data: Partial<PatientVisit>) => {
      const res = await apiRequest("PUT", `/api/visits/${visitId}`, {
        id: visitId,
        ...data
      });
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
        description: "Failed to update visit details",
        variant: "destructive",
      });
    }
  });

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-save after a short delay
    updateVisitMutation.mutate({
      [field]: value
    });
  };

  // Get dropdown options from settings
  const getDropdownOptions = (settingKey: string): string[] => {
    const setting = settings.find((s: any) => s.settingKey === `${settingKey}_options`);
    if (setting && Array.isArray(setting.settingValue)) {
      return setting.settingValue;
    }
    return [];
  };

  // Render dropdown options
  const renderDropdownOptions = (options: string[]) => {
    return options.map((option, index) => (
      <SelectItem key={index} value={option}>
        {option}
      </SelectItem>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Chief Complaint Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chief Complaint</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.chiefComplaint}
            onValueChange={(value) => handleInputChange("chiefComplaint", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select chief complaint" />
            </SelectTrigger>
            <SelectContent>
              {renderDropdownOptions(getDropdownOptions("chiefComplaint"))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Oral Examination Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Oral Examination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Tooth Findings</h3>
            <ToothFindingsSection visitId={visitId} />
          </div>

          <Separator className="my-4" />

          <div>
            <h3 className="text-sm font-medium mb-2">Generalized Findings</h3>
            <GeneralizedFindingsSection visitId={visitId} />
          </div>
        </CardContent>
      </Card>

      {/* Investigation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Investigation Done</CardTitle>
        </CardHeader>
        <CardContent>
          <InvestigationSection visitId={visitId} />
        </CardContent>
      </Card>

      {/* Treatment Plan Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Treatment Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.treatmentPlan}
            onValueChange={(value) => handleInputChange("treatmentPlan", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select treatment plan" />
            </SelectTrigger>
            <SelectContent>
              {renderDropdownOptions(getDropdownOptions("treatmentPlan"))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Treatment Done Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Treatment Done</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.treatmentDone}
            onValueChange={(value) => handleInputChange("treatmentDone", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select treatment done" />
            </SelectTrigger>
            <SelectContent>
              {renderDropdownOptions(getDropdownOptions("treatmentDone"))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Rx (Prescription) Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rx (Prescription)</CardTitle>
        </CardHeader>
        <CardContent>
          <PrescriptionForm 
            visitId={visitId}
            patientId={patientId}
          />
        </CardContent>
      </Card>

      {/* Advice Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Advice</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.advice}
            onValueChange={(value) => handleInputChange("advice", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select advice" />
            </SelectTrigger>
            <SelectContent>
              {renderDropdownOptions(getDropdownOptions("advice"))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any additional notes here..."
            value={formData.notes || ""}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Invoice Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceForm 
            visitId={visitId}
            patientId={patientId}
          />
        </CardContent>
      </Card>

      {/* Follow-up Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Follow-up</CardTitle>
        </CardHeader>
        <CardContent>
          <FollowUpSection 
            visitId={visitId}
            patientId={patientId}
          />
        </CardContent>
      </Card>

      {/* Back button */}
      {onBack && (
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onBack}>
            Go Back
          </Button>
        </div>
      )}
    </div>
  );
}