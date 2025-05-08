import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import ToothFindingsSection from "@/components/ToothFindingsSection";
import GeneralizedFindingsSection from "@/components/GeneralizedFindingsSection";
import InvestigationSection from "@/components/InvestigationSection";
import FollowUpSection from "@/components/FollowUpSection";
import PrescriptionForm from "@/components/PrescriptionForm";
import Invoice from "@/components/Invoice";

import { PatientVisit, InsertPatientVisit } from "@shared/schema";

interface VisitLogProps {
  visitId: number;
  patientId: string;
  onBack?: () => void;
}

export default function VisitLog({ visitId, patientId, onBack }: VisitLogProps) {
  const { toast } = useToast();
  const [visitData, setVisitData] = useState<Partial<PatientVisit>>({});
  const [showInvoice, setShowInvoice] = useState(false);

  // Fetch visit data
  const { data: visit, isLoading } = useQuery<PatientVisit>({
    queryKey: [`/api/visits/${visitId}`],
    enabled: !!visitId,
  });

  // Fetch dropdown options from settings
  const { data: complaintOptions = [] } = useQuery<string[]>({
    queryKey: ['/api/settings/key/complaint_options'],
    select: (data: any) => data?.settingValue || [],
  });

  const { data: areaOptions = [] } = useQuery<string[]>({
    queryKey: ['/api/settings/key/area_options'],
    select: (data: any) => data?.settingValue || [],
  });

  const { data: treatmentDoneOptions = [] } = useQuery<string[]>({
    queryKey: ['/api/settings/key/treatment_done_options'],
    select: (data: any) => data?.settingValue || [],
  });

  const { data: treatmentPlanOptions = [] } = useQuery<string[]>({
    queryKey: ['/api/settings/key/treatment_plan_options'],
    select: (data: any) => data?.settingValue || [],
  });

  const { data: adviceOptions = [] } = useQuery<string[]>({
    queryKey: ['/api/settings/key/advice_options'],
    select: (data: any) => data?.settingValue || [],
  });

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
    setVisitData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle form submission
  const handleSave = (field: keyof PatientVisit) => {
    // Only update the specific field that was changed
    updateVisitMutation.mutate({ [field]: visitData[field] });
  };

  if (isLoading) {
    return <div className="p-4">Loading visit data...</div>;
  }

  if (showInvoice) {
    return (
      <Invoice 
        patientId={patientId} 
        visitId={visitId}
        onBack={() => setShowInvoice(false)}
      />
    );
  }

  return (
    <Card className="border-none shadow-none">
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
        {/* Chief Complaint Section */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Chief Complaint</Label>
          <Select 
            value={visitData.chiefComplaint || ''} 
            onValueChange={(value) => handleInputChange('chiefComplaint', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select chief complaint" />
            </SelectTrigger>
            <SelectContent>
              {complaintOptions.map((option, index) => (
                <SelectItem key={index} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => handleSave('chiefComplaint')}>
            Save
          </Button>
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
              {treatmentPlanOptions.map((option, index) => (
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
              {treatmentDoneOptions.map((option, index) => (
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
              {adviceOptions.map((option, index) => (
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
      </CardContent>
    </Card>
  );
}