import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface PrescriptionItem {
  id?: number;
  serialNumber: number;
  medicationId: number;
  medicationName: string;
  timing: string;
  notes?: string;
}

interface PrescriptionFormProps {
  visitId: number;
  existingPrescriptions?: PrescriptionItem[];
  onSave?: (prescriptions: PrescriptionItem[]) => void;
  readOnly?: boolean;
}

export default function PrescriptionForm({
  visitId,
  existingPrescriptions = [],
  onSave,
  readOnly = false,
}: PrescriptionFormProps) {
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  
  // Fetch available medications
  const { data: medications, isLoading: isLoadingMedications } = useQuery({
    queryKey: ["/api/medications"],
  });
  
  // Fetch existing prescriptions if any
  const { data: savedPrescriptions, isLoading: isLoadingPrescriptions } = useQuery({
    queryKey: ["/api/visits", visitId, "prescriptions"],
    enabled: visitId > 0,
  });
  
  // Mutations
  const createPrescriptionMutation = useMutation({
    mutationFn: async (data: { visitId: number; prescriptions: PrescriptionItem[] }) => {
      return apiRequest("POST", "/api/prescriptions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visits", visitId, "prescriptions"] });
      toast({
        title: "Success",
        description: "Prescriptions saved successfully",
      });
      if (onSave) {
        onSave(prescriptions);
      }
    },
    onError: (error) => {
      console.error("Error saving prescriptions:", error);
      toast({
        title: "Error",
        description: "Failed to save prescriptions",
        variant: "destructive",
      });
    },
  });
  
  // Initialize with existing prescriptions or an empty one
  useEffect(() => {
    if (existingPrescriptions && existingPrescriptions.length > 0) {
      setPrescriptions(existingPrescriptions);
    } else if (savedPrescriptions && savedPrescriptions.length > 0) {
      setPrescriptions(
        savedPrescriptions.map((prescription: any, index: number) => ({
          id: prescription.id,
          serialNumber: index + 1,
          medicationId: prescription.medicationId,
          medicationName: medications?.find((m: any) => m.id === prescription.medicationId)?.name || "",
          timing: prescription.timing,
          notes: prescription.notes,
        }))
      );
    } else if (prescriptions.length === 0) {
      setPrescriptions([
        {
          serialNumber: 1,
          medicationId: 0,
          medicationName: "",
          timing: "0-0-0",
          notes: "",
        },
      ]);
    }
  }, [existingPrescriptions, savedPrescriptions, medications]);
  
  const handleAddPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      {
        serialNumber: prescriptions.length + 1,
        medicationId: 0,
        medicationName: "",
        timing: "0-0-0",
        notes: "",
      },
    ]);
  };
  
  const handleRemovePrescription = (index: number) => {
    const updatedPrescriptions = [...prescriptions];
    updatedPrescriptions.splice(index, 1);
    
    // Update serial numbers
    updatedPrescriptions.forEach((prescription, idx) => {
      prescription.serialNumber = idx + 1;
    });
    
    setPrescriptions(updatedPrescriptions);
  };
  
  const handleMedicationChange = (index: number, medicationId: number) => {
    const updatedPrescriptions = [...prescriptions];
    const selectedMedication = medications?.find((m: any) => m.id === Number(medicationId));
    
    updatedPrescriptions[index] = {
      ...updatedPrescriptions[index],
      medicationId: Number(medicationId),
      medicationName: selectedMedication?.name || "",
    };
    
    setPrescriptions(updatedPrescriptions);
  };
  
  const handleTimingChange = (index: number, value: string) => {
    // Format as X-X-X
    const digits = value.replace(/[^0-9]/g, "").slice(0, 3);
    const formattedTiming = digits.split("").join("-");
    
    const updatedPrescriptions = [...prescriptions];
    updatedPrescriptions[index] = {
      ...updatedPrescriptions[index],
      timing: formattedTiming,
    };
    
    setPrescriptions(updatedPrescriptions);
  };
  
  const handleNotesChange = (index: number, value: string) => {
    const updatedPrescriptions = [...prescriptions];
    updatedPrescriptions[index] = {
      ...updatedPrescriptions[index],
      notes: value,
    };
    
    setPrescriptions(updatedPrescriptions);
  };
  
  const handleSave = () => {
    if (prescriptions.some(p => !p.medicationId || p.medicationId === 0)) {
      toast({
        title: "Error",
        description: "Please select a medication for all prescription items",
        variant: "destructive",
      });
      return;
    }
    
    createPrescriptionMutation.mutate({
      visitId,
      prescriptions: prescriptions.map(p => ({
        ...p,
        visitId,
      })),
    });
  };
  
  const formatTimingInput = (timing: string) => {
    const parts = timing.split("-");
    const formatted = parts.map(p => p || "0").join("-");
    return formatted.length === 3 ? `${formatted[0]}-${formatted[1]}-${formatted[2]}` : formatted;
  };
  
  if (isLoadingMedications || isLoadingPrescriptions) {
    return <div className="text-center py-4">Loading prescription data...</div>;
  }
  
  return (
    <Card className="mt-4">
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 font-semibold text-sm">
            <div className="col-span-1">Sl. No.</div>
            <div className="col-span-5">Medication</div>
            <div className="col-span-3">Timing</div>
            <div className="col-span-2">Notes</div>
            <div className="col-span-1"></div>
          </div>
          
          {prescriptions.map((prescription, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-1 text-center">
                {prescription.serialNumber}
              </div>
              
              <div className="col-span-5">
                {readOnly ? (
                  <div>{prescription.medicationName}</div>
                ) : (
                  <Select
                    value={prescription.medicationId.toString()}
                    onValueChange={(value) => handleMedicationChange(index, Number(value))}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select medication" />
                    </SelectTrigger>
                    <SelectContent>
                      {medications?.map((medication: any) => (
                        <SelectItem key={medication.id} value={medication.id.toString()}>
                          {medication.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="col-span-3">
                {readOnly ? (
                  <div>{prescription.timing}</div>
                ) : (
                  <Input
                    value={formatTimingInput(prescription.timing)}
                    onChange={(e) => handleTimingChange(index, e.target.value)}
                    placeholder="0-0-0"
                    maxLength={5}
                    className="font-mono"
                    disabled={readOnly}
                  />
                )}
              </div>
              
              <div className="col-span-2">
                {readOnly ? (
                  <div>{prescription.notes}</div>
                ) : (
                  <Input
                    value={prescription.notes || ""}
                    onChange={(e) => handleNotesChange(index, e.target.value)}
                    placeholder="SOS, After meals, etc."
                    disabled={readOnly}
                  />
                )}
              </div>
              
              <div className="col-span-1 text-right">
                {!readOnly && prescriptions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePrescription(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {!readOnly && (
            <div className="flex flex-col gap-4 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddPrescription}
                className="w-full"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Another Medication
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={createPrescriptionMutation.isPending}
                className="w-full"
              >
                {createPrescriptionMutation.isPending
                  ? "Saving Prescription..."
                  : "Save Prescription"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}