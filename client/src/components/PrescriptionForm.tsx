import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PrescriptionItem {
  id?: number;
  visitId: number;
  medicationId: number;
  medicationName?: string;
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
  existingPrescriptions,
  onSave,
  readOnly = false,
}: PrescriptionFormProps) {
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Define types for medications and prescriptions
  interface Medication {
    id: number;
    name: string;
    quantity: number;
    threshold?: number;
    notes?: string;
  }

  // Fetch medications for dropdown
  const { data: medications = [] } = useQuery<Medication[]>({
    queryKey: ['/api/medications'],
  });

  // Fetch existing prescriptions for this visit
  const { data: fetchedPrescriptions = [], isLoading: isFetchingPrescriptions } = useQuery<PrescriptionItem[]>({
    queryKey: [`/api/visits/${visitId}/prescriptions`],
    enabled: !!visitId,
    retry: (failureCount, error) => {
      // Don't retry if we're getting a 500 error
      if (error instanceof Error && error.message.includes('500')) {
        return false;
      }
      return failureCount < 3;
    },
    onError: (error) => {
      console.error("Error fetching prescriptions:", error);
    }
  });

  // Initialize prescriptions state when data is loaded
  useEffect(() => {
    if (existingPrescriptions && existingPrescriptions.length > 0) {
      setPrescriptions(existingPrescriptions);
      setIsLoading(false);
    } else if (fetchedPrescriptions && fetchedPrescriptions.length > 0) {
      // Map fetched prescriptions with medication names from medications data
      const mappedPrescriptions = fetchedPrescriptions.map((prescription: PrescriptionItem) => {
        const medication = medications?.find((med: any) => med.id === prescription.medicationId);
        return {
          ...prescription,
          medicationName: medication?.name || 'Unknown'
        };
      });
      setPrescriptions(mappedPrescriptions);
      setIsLoading(false);
    } else if (!isFetchingPrescriptions) {
      // If no prescriptions, start with an empty row
      if (!readOnly) {
        setPrescriptions([{
          visitId: visitId,
          medicationId: 0,
          timing: "0-0-0",
          notes: ""
        }]);
      }
      setIsLoading(false);
    }
  }, [existingPrescriptions, fetchedPrescriptions, medications, visitId, isFetchingPrescriptions, readOnly]);

  // Add new prescription row
  const addPrescriptionRow = () => {
    setPrescriptions([
      ...prescriptions,
      {
        visitId: visitId,
        medicationId: 0,
        timing: "0-0-0",
        notes: ""
      }
    ]);
  };

  // Remove prescription row
  const removePrescriptionRow = (index: number) => {
    const updatedPrescriptions = [...prescriptions];
    const removedItem = updatedPrescriptions.splice(index, 1)[0];
    
    // If item has an ID, call API to delete it
    if (removedItem.id) {
      deletePrescription(removedItem.id);
    } else {
      setPrescriptions(updatedPrescriptions);
    }
  };

  // Update prescription field
  const updatePrescription = (index: number, field: keyof PrescriptionItem, value: any) => {
    const updatedPrescriptions = [...prescriptions];
    updatedPrescriptions[index] = {
      ...updatedPrescriptions[index],
      [field]: value
    };

    // If medication ID is updated, also update name
    if (field === 'medicationId' && medications) {
      const medication = medications.find((med: any) => med.id === value);
      updatedPrescriptions[index].medicationName = medication?.name || 'Unknown';
    }

    setPrescriptions(updatedPrescriptions);
    
    // If onSave callback is provided, invoke it
    if (onSave) {
      onSave(updatedPrescriptions);
    }
  };

  // Update timing digit
  const updateTimingDigit = (index: number, position: number, value: string) => {
    const updatedPrescriptions = [...prescriptions];
    const timingParts = updatedPrescriptions[index].timing.split('-');
    
    // Validate input to only allow digits, S, or empty
    if (!/^[0-9Ss]?$/.test(value)) {
      return;
    }
    
    // Convert to uppercase if 's' is entered
    if (value.toLowerCase() === 's') {
      value = 'S';
    }
    
    timingParts[position] = value || '0';
    updatedPrescriptions[index].timing = timingParts.join('-');
    
    setPrescriptions(updatedPrescriptions);
    
    // If onSave callback is provided, invoke it
    if (onSave) {
      onSave(updatedPrescriptions);
    }
  };

  // Save prescription mutation
  const savePrescription = useMutation({
    mutationFn: async (prescription: PrescriptionItem) => {
      if (prescription.id) {
        const response = await apiRequest('PUT', `/api/prescriptions/${prescription.id}`, prescription);
        return response.json();
      } else {
        const response = await apiRequest('POST', '/api/prescriptions', prescription);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/prescriptions`] });
      toast({
        title: "Success",
        description: "Prescription saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save prescription",
        variant: "destructive",
      });
      console.error("Error saving prescription:", error);
    }
  });

  // Delete prescription mutation
  const deletePrescription = async (id: number) => {
    try {
      await apiRequest('DELETE', `/api/prescriptions/${id}`);
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/prescriptions`] });
      toast({
        title: "Success",
        description: "Prescription deleted successfully",
      });
      // Refresh prescriptions list
      const updatedPrescriptions = prescriptions.filter(p => p.id !== id);
      setPrescriptions(updatedPrescriptions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete prescription",
        variant: "destructive",
      });
      console.error("Error deleting prescription:", error);
    }
  };

  // Save all prescriptions
  const saveAllPrescriptions = async () => {
    // Validate that medications are selected
    const invalidPrescriptions = prescriptions.filter(p => !p.medication_id || p.medication_id === 0);
    if (invalidPrescriptions.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please select a medication for all prescriptions",
        variant: "destructive",
      });
      return;
    }

    // Save all prescriptions
    for (const prescription of prescriptions) {
      await savePrescription.mutateAsync(prescription);
    }
  };

  if (isLoading) {
    return <div className="py-4">Loading prescriptions...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-16 text-center">Sl No</TableHead>
              <TableHead>Medication</TableHead>
              <TableHead className="w-48 text-center">Timing</TableHead>
              <TableHead className="w-48">Notes</TableHead>
              {!readOnly && <TableHead className="w-16"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {prescriptions.map((prescription, index) => (
              <TableRow key={index}>
                <TableCell className="text-center">{index + 1}</TableCell>
                <TableCell>
                  {readOnly ? (
                    prescription.medicationName || 'Unknown'
                  ) : (
                    <Select
                      value={prescription.medication_id.toString()}
                      onValueChange={(value) => updatePrescription(index, 'medication_id', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select medication" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0" disabled>Select medication</SelectItem>
                        {medications && medications.map((med: any) => (
                          <SelectItem key={med.id} value={med.id.toString()}>
                            {med.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center space-x-1">
                    {readOnly ? (
                      <div className="text-center">{prescription.timing}</div>
                    ) : (
                      <>
                        <Input
                          type="text"
                          value={prescription.timing.split('-')[0]}
                          onChange={(e) => updateTimingDigit(index, 0, e.target.value)}
                          className="w-8 h-8 text-center p-0"
                          maxLength={1}
                        />
                        <span>-</span>
                        <Input
                          type="text"
                          value={prescription.timing.split('-')[1]}
                          onChange={(e) => updateTimingDigit(index, 1, e.target.value)}
                          className="w-8 h-8 text-center p-0"
                          maxLength={1}
                        />
                        <span>-</span>
                        <Input
                          type="text"
                          value={prescription.timing.split('-')[2]}
                          onChange={(e) => updateTimingDigit(index, 2, e.target.value)}
                          className="w-8 h-8 text-center p-0"
                          maxLength={1}
                        />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="ml-2">
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Enter 0-5 for number of tablets or S for SOS</p>
                              <p>Format: Morning-Afternoon-Night</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    prescription.notes || ''
                  ) : (
                    <Select
                      value={prescription.notes || ''}
                      onValueChange={(value) => updatePrescription(index, 'notes', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Before/After food" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Before food">Before food</SelectItem>
                        <SelectItem value="After food">After food</SelectItem>
                        <SelectItem value="With food">With food</SelectItem>
                        <SelectItem value="Any time">Any time</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePrescriptionRow(index)}
                      disabled={prescriptions.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!readOnly && (
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPrescriptionRow}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Medication
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={saveAllPrescriptions}
            disabled={prescriptions.some(p => !p.medication_id || p.medication_id === 0)}
          >
            Save Prescriptions
          </Button>
        </div>
      )}
    </div>
  );
}