import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, AlertCircle, Calendar as CalendarIcon, Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PrescriptionItem {
  id?: number;
  visitId: number;
  medicationId: number;
  medicationName?: string;
  prescriptionDate: string;
  timing: string | null;
  days?: number | null;
  notes?: string | null;
}

interface PrescriptionFormProps {
  visitId: number;
  patientId?: string;
  existingPrescriptions?: PrescriptionItem[];
  onSave?: (prescriptions: PrescriptionItem[]) => void;
  onAddPrescription?: (prescription: PrescriptionItem) => void;
  onDeletePrescription?: (id: number) => void;
  readOnly?: boolean;
}

export default function PrescriptionForm({
  visitId,
  patientId,
  existingPrescriptions,
  onSave,
  onAddPrescription,
  onDeletePrescription,
  readOnly = false,
}: PrescriptionFormProps) {
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // We've removed the Quick Add Medication feature

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
    queryFn: async () => {
      try {
        const res = await fetch(`/api/visits/${visitId}/prescriptions`);
        if (!res.ok) throw new Error("Failed to load prescriptions");
        return await res.json();
      } catch (error) {
        console.error("Error fetching prescriptions:", error);
        return [];
      }
    }
  });

  // Initialize prescriptions state when data is loaded
  useEffect(() => {
    console.log("PrescriptionForm - VisitID:", visitId);
    console.log("PrescriptionForm - Fetched Prescriptions:", fetchedPrescriptions);
    console.log("PrescriptionForm - Available Medications:", medications);
    
    if (existingPrescriptions && existingPrescriptions.length > 0) {
      console.log("PrescriptionForm - Using existing prescriptions");
      setPrescriptions(existingPrescriptions);
      setIsLoading(false);
    } else if (fetchedPrescriptions && fetchedPrescriptions.length > 0) {
      console.log("PrescriptionForm - Using fetched prescriptions");
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
      console.log("PrescriptionForm - Creating default prescription row");
      // If no prescriptions, start with an empty row
      if (!readOnly) {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        
        setPrescriptions([{
          visitId: visitId,
          medicationId: 0,
          prescriptionDate: dateStr,
          timing: "0-0-0",
          days: 7, // Default to 7 days
          notes: ""
        }]);
      }
      setIsLoading(false);
    }
  }, [existingPrescriptions, fetchedPrescriptions, medications, visitId, isFetchingPrescriptions, readOnly]);

  // Add new prescription row
  const addPrescriptionRow = () => {
    // Use the same prescription date as the first prescription if available, or today's date
    let dateStr = prescriptions[0]?.prescriptionDate;
    
    // If no date is available, generate today's date as a string
    if (!dateStr) {
      const today = new Date();
      dateStr = today.toISOString().split('T')[0];
    }
    
    setPrescriptions([
      ...prescriptions,
      {
        visitId: visitId,
        medicationId: 0,
        prescriptionDate: dateStr,
        timing: "0-0-0",
        days: 7, // Default to 7 days
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
    // Allow only digits 0-9 and 'S' character
    if (value !== "" && !/^[0-9Ss]?$/.test(value)) {
      return;
    }
    
    // Convert to uppercase if 's' is entered
    if (value.toLowerCase() === 's') {
      value = 'S';
    }

    // Handle backspace (empty value) - set to 0
    const finalValue = value === "" ? "0" : value;
    
    const updatedPrescriptions = [...prescriptions];
    const prescription = {...updatedPrescriptions[index]};
    
    // Initialize timing if it's null
    if (!prescription.timing) {
      prescription.timing = "0-0-0";
    }
    
    const timingParts = prescription.timing.split('-');
    timingParts[position] = finalValue;
    
    // Create the new timing value
    const newTiming = timingParts.join('-');
    console.log("Updated timing:", newTiming);
    
    // Create a new prescription object with the updated timing
    updatedPrescriptions[index] = {
      ...prescription,
      timing: newTiming
    };
    
    console.log("Updated prescription:", updatedPrescriptions[index]);
    
    // Update the state with the new prescriptions array
    setPrescriptions(updatedPrescriptions);
    
    // If onSave callback is provided, invoke it with entire updated array
    if (onSave) {
      onSave(updatedPrescriptions);
    }
    
    // If this is a new unsaved prescription, just update the state
    if (!prescription.id) {
      return;
    }
    
    // Auto-save this prescription after timing update if it already exists
    savePrescription.mutate({
      ...prescription,
      timing: timingParts.join('-')
    });
    
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
    onSuccess: (savedPrescription) => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/prescriptions`] });
      
      // Update the local prescriptions state to include the newly saved prescription
      // This ensures immediate UI update without waiting for the query to refresh
      if (!savedPrescription.id) return; // Safety check
      
      const updatedPrescriptions = [...prescriptions];
      const existingIndex = updatedPrescriptions.findIndex(p => 
        p.id === savedPrescription.id || 
        (p.medicationId === savedPrescription.medicationId && !p.id)
      );
      
      if (existingIndex >= 0) {
        updatedPrescriptions[existingIndex] = {
          ...savedPrescription,
          medicationName: medications.find(m => m.id === savedPrescription.medicationId)?.name || 'Unknown'
        };
      } else {
        // Add to the prescriptions array if it's new
        updatedPrescriptions.push({
          ...savedPrescription,
          medicationName: medications.find(m => m.id === savedPrescription.medicationId)?.name || 'Unknown'
        });
      }
      
      setPrescriptions(updatedPrescriptions);
      
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
      // If we have a custom delete handler, use that
      if (onDeletePrescription) {
        await onDeletePrescription(id);
      } else {
        // Otherwise use the default API request
        await apiRequest('DELETE', `/api/prescriptions/${id}`);
      }
      
      // Always refresh the query cache
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
    console.log("Save All Prescriptions clicked - prescriptions:", prescriptions);
    
    // Check that we have at least one prescription
    if (prescriptions.length === 0) {
      toast({
        title: "No prescriptions",
        description: "There are no prescriptions to save",
        variant: "destructive",
      });
      return;
    }
    
    // Validate that medications are selected
    const invalidPrescriptions = prescriptions.filter(p => !p.medicationId || p.medicationId === 0);
    if (invalidPrescriptions.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please select a medication for all prescriptions",
        variant: "destructive",
      });
      return;
    }

    try {
      // Show loading toast
      toast({
        title: "Saving...",
        description: "Saving all prescriptions"
      });

      let savedCount = 0;
      
      // Process each prescription
      for (const prescription of prescriptions) {
        try {
          // Make a copy to avoid mutating the original
          const prescriptionToSave = { 
            id: prescription.id,
            visitId: visitId,
            medicationId: prescription.medicationId,
            medicationName: prescription.medicationName,
            prescriptionDate: prescription.prescriptionDate,
            timing: prescription.timing || "0-0-0",
            days: prescription.days || 7,
            notes: prescription.notes || null
          };
          
          // If prescription date is not already set, use today's date
          if (!prescriptionToSave.prescriptionDate) {
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0];
            prescriptionToSave.prescriptionDate = dateStr;
          }
          
          console.log("About to save prescription:", prescriptionToSave);
          
          if (prescriptionToSave.id) {
            // Update existing prescription
            console.log("Updating prescription:", prescriptionToSave.id);
            const response = await fetch(`/api/prescriptions/${prescriptionToSave.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(prescriptionToSave)
            });
            
            if (!response.ok) {
              throw new Error(`Failed to update prescription: ${response.status}`);
            }
          } else {
            // Create new prescription
            console.log("Creating new prescription");
            if (onAddPrescription) {
              await onAddPrescription(prescriptionToSave);
            } else {
              const response = await fetch(`/api/visits/${visitId}/prescriptions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prescriptionToSave)
              });
              
              if (!response.ok) {
                throw new Error(`Failed to create prescription: ${response.status}`);
              }
            }
          }
          savedCount++;
        } catch (err) {
          console.error("Error saving prescription:", err);
        }
      }

      // Show success toast after all prescriptions are saved
      if (savedCount > 0) {
        toast({
          title: "Success",
          description: `${savedCount} prescription${savedCount !== 1 ? 's' : ''} saved successfully`
        });
        
        // Refresh the prescriptions list
        queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/prescriptions`] });
        
        // Trigger the onSave callback if provided
        if (onSave) {
          onSave(prescriptions);
        }
      } else {
        toast({
          title: "Warning",
          description: "No prescriptions were saved",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error saving prescriptions:", error);
      toast({
        title: "Error",
        description: "Failed to save prescriptions",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="py-4">Loading prescriptions...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-sm font-medium">Prescription Details</h2>
          {!readOnly && (
            <div className="flex items-center">
              <span className="text-xs text-muted-foreground mr-2">Date:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-[130px] justify-start text-left font-normal",
                      !prescriptions[0]?.prescriptionDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {prescriptions[0]?.prescriptionDate ? (
                      format(new Date(prescriptions[0].prescriptionDate), "dd MMM yyyy")
                    ) : (
                      "Select date"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={prescriptions[0]?.prescriptionDate ? new Date(prescriptions[0].prescriptionDate) : undefined}
                    onSelect={(date) => {
                      // Update prescription date for all prescriptions in this visit
                      if (date) {
                        const dateStr = date.toISOString().split('T')[0];
                        const updatedPrescriptions = prescriptions.map(p => ({
                          ...p,
                          prescriptionDate: dateStr
                        }));
                        setPrescriptions(updatedPrescriptions);
                      }
                      
                      // If onSave callback is provided, invoke it
                      if (onSave && date) {
                        const dateStr = date.toISOString().split('T')[0];
                        const updatedPrescriptions = prescriptions.map(p => ({
                          ...p,
                          prescriptionDate: dateStr
                        }));
                        onSave(updatedPrescriptions);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
          {readOnly && prescriptions[0]?.prescriptionDate && (
            <div className="text-xs text-muted-foreground">
              Date: {format(new Date(prescriptions[0].prescriptionDate), "dd MMM yyyy")}
            </div>
          )}
        </div>
        {!readOnly && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={addPrescriptionRow}
            type="button"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Medication
          </Button>
        )}
      </div>
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-16 text-center">Sl No</TableHead>
              <TableHead>Medication</TableHead>
              <TableHead className="w-48 text-center">Timing</TableHead>
              <TableHead className="w-24 text-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center">
                        Days
                        <AlertCircle className="ml-1 h-3 w-3 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of days the patient should take this medication</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
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
                      value={prescription.medicationId.toString()}
                      onValueChange={(value) => updatePrescription(index, 'medicationId', parseInt(value))}
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
                        <input
                          type="text"
                          value={prescription.timing ? prescription.timing.split('-')[0] : '0'}
                          onChange={(e) => updateTimingDigit(index, 0, e.target.value)}
                          className="w-8 h-8 text-center p-0 border rounded"
                          maxLength={1}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace') {
                              updateTimingDigit(index, 0, '0');
                              e.preventDefault();
                            } else if (e.key >= '0' && e.key <= '9') {
                              updateTimingDigit(index, 0, e.key);
                              e.preventDefault();
                            } else if (e.key.toLowerCase() === 's') {
                              updateTimingDigit(index, 0, 'S');
                              e.preventDefault();
                            }
                          }}
                        />
                        <span>-</span>
                        <input
                          type="text"
                          value={prescription.timing ? prescription.timing.split('-')[1] : '0'}
                          onChange={(e) => updateTimingDigit(index, 1, e.target.value)}
                          className="w-8 h-8 text-center p-0 border rounded"
                          maxLength={1}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace') {
                              updateTimingDigit(index, 1, '0');
                              e.preventDefault();
                            } else if (e.key >= '0' && e.key <= '9') {
                              updateTimingDigit(index, 1, e.key);
                              e.preventDefault();
                            } else if (e.key.toLowerCase() === 's') {
                              updateTimingDigit(index, 1, 'S');
                              e.preventDefault();
                            }
                          }}
                        />
                        <span>-</span>
                        <input
                          type="text"
                          value={prescription.timing ? prescription.timing.split('-')[2] : '0'}
                          onChange={(e) => updateTimingDigit(index, 2, e.target.value)}
                          className="w-8 h-8 text-center p-0 border rounded"
                          maxLength={1}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace') {
                              updateTimingDigit(index, 2, '0');
                              e.preventDefault();
                            } else if (e.key >= '0' && e.key <= '9') {
                              updateTimingDigit(index, 2, e.key);
                              e.preventDefault();
                            } else if (e.key.toLowerCase() === 's') {
                              updateTimingDigit(index, 2, 'S');
                              e.preventDefault();
                            }
                          }}
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
                <TableCell className="text-center">
                  {readOnly ? (
                    <div>{prescription.days || 0}</div>
                  ) : (
                    <Input
                      type="number"
                      min="0"
                      max="90"
                      value={prescription.days?.toString() || "0"}
                      onChange={(e) => updatePrescription(index, 'days', parseInt(e.target.value) || 0)}
                      className="w-16 h-8 text-center mx-auto"
                    />
                  )}
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
        <>
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPrescriptionRow}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={saveAllPrescriptions}
              disabled={prescriptions.some(p => !p.medicationId || p.medicationId === 0)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Save All Prescriptions
            </Button>
          </div>
        </>
      )}
    </div>
  );
}