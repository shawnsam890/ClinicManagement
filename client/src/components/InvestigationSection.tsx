import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface Investigation {
  id?: number;
  type: string;
  findings: string;
  visitId: number;
}

interface InvestigationSectionProps {
  visitId: number;
  readOnly?: boolean;
}

export default function InvestigationSection({ visitId, readOnly = false }: InvestigationSectionProps) {
  const { toast } = useToast();
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch settings for dropdown options
  const { data: settings = [] } = useQuery<any[]>({
    queryKey: ['/api/settings/category/dental_options'],
  });

  // Fetch existing investigations
  const { data: fetchedInvestigations = [], isLoading: isFetchingInvestigations } = useQuery<Investigation[]>({
    queryKey: [`/api/visits/${visitId}/investigations`],
    enabled: !!visitId,
  });

  // Initialize investigations state when data is loaded
  useEffect(() => {
    if (fetchedInvestigations.length > 0) {
      setInvestigations(fetchedInvestigations);
      setIsLoading(false);
    } else if (!isFetchingInvestigations) {
      // If no investigations, start with an empty row if not readOnly
      if (!readOnly) {
        setInvestigations([{
          visitId: visitId,
          type: '',
          findings: ''
        }]);
      }
      setIsLoading(false);
    }
  }, [fetchedInvestigations, isFetchingInvestigations, visitId, readOnly]);

  // Create investigation mutation
  const createInvestigationMutation = useMutation({
    mutationFn: async (investigation: Omit<Investigation, 'id'>) => {
      const res = await apiRequest("POST", "/api/investigations", investigation);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/investigations`] });
      toast({
        title: "Investigation recorded",
        description: "Investigation has been saved successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save investigation",
        description: error.message || "There was an error saving the investigation.",
        variant: "destructive",
      });
    },
  });

  // Update investigation mutation
  const updateInvestigationMutation = useMutation({
    mutationFn: async (investigation: Investigation) => {
      const res = await apiRequest("PUT", `/api/investigations/${investigation.id}`, investigation);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/investigations`] });
      toast({
        title: "Investigation updated",
        description: "Investigation has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update investigation",
        description: error.message || "There was an error updating the investigation.",
        variant: "destructive",
      });
    },
  });

  // Delete investigation mutation
  const deleteInvestigationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/investigations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/investigations`] });
      toast({
        title: "Investigation deleted",
        description: "Investigation has been removed successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete investigation",
        description: error.message || "There was an error deleting the investigation.",
        variant: "destructive",
      });
    },
  });

  const addInvestigationRow = () => {
    setInvestigations([
      ...investigations,
      {
        visitId: visitId,
        type: '',
        findings: ''
      }
    ]);
  };

  const removeInvestigationRow = (index: number) => {
    const investigation = investigations[index];
    if (investigation.id) {
      deleteInvestigationMutation.mutate(investigation.id);
    } else {
      const newInvestigations = [...investigations];
      newInvestigations.splice(index, 1);
      setInvestigations(newInvestigations);
    }
  };

  const handleInputChange = (index: number, field: 'type' | 'findings', value: string) => {
    const updatedInvestigations = [...investigations];
    updatedInvestigations[index] = {
      ...updatedInvestigations[index],
      [field]: value
    };
    setInvestigations(updatedInvestigations);
  };

  const handleSaveInvestigation = (index: number) => {
    const investigation = investigations[index];
    
    // Skip if required fields are empty
    if (!investigation.type) {
      toast({
        title: "Validation Error",
        description: "Investigation type must be specified.",
        variant: "destructive",
      });
      return;
    }
    
    if (investigation.id) {
      // Update existing investigation
      updateInvestigationMutation.mutate(investigation);
    } else {
      // Create new investigation
      createInvestigationMutation.mutate({
        visitId: investigation.visitId,
        type: investigation.type,
        findings: investigation.findings
      });
    }
  };

  // Get investigation type options from settings
  const getInvestigationTypes = (): string[] => {
    const setting = settings.find((s: any) => s.settingKey === "investigation_type_options");
    if (setting && Array.isArray(setting.settingValue)) {
      return setting.settingValue;
    }
    return ["X-ray", "CBCT", "Blood Test", "Biopsy", "Pulp Testing", "Culture & Sensitivity"];
  };

  if (isLoading) {
    return <div className="py-4">Loading investigations...</div>;
  }

  return (
    <div className="space-y-4">
      {investigations.length === 0 && readOnly ? (
        <div className="text-center py-4 text-muted-foreground">
          No investigations recorded.
        </div>
      ) : (
        <div className="space-y-6">
          {investigations.map((investigation, index) => (
            <div key={investigation.id || `new-${index}`} className="space-y-3 pb-4 border-b border-muted last:border-0">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-8">
                  <Label htmlFor={`type-${index}`} className="text-xs mb-1 block">
                    Investigation Type
                  </Label>
                  <Select
                    value={investigation.type}
                    onValueChange={(value) => handleInputChange(index, 'type', value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger id={`type-${index}`}>
                      <SelectValue placeholder="Select investigation type" />
                    </SelectTrigger>
                    <SelectContent>
                      {getInvestigationTypes().map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {!readOnly && (
                  <div className="col-span-4 flex items-end justify-end">
                    {index === investigations.length - 1 ? (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handleSaveInvestigation(index)}
                        disabled={!investigation.type}
                      >
                        Save
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeInvestigationRow(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Findings field - only displayed when investigation type is selected */}
              {investigation.type && (
                <div>
                  <Label htmlFor={`findings-${index}`} className="text-xs mb-1 block">
                    Findings
                  </Label>
                  <Textarea
                    id={`findings-${index}`}
                    value={investigation.findings}
                    onChange={(e) => handleInputChange(index, 'findings', e.target.value)}
                    placeholder="Enter investigation findings"
                    disabled={readOnly}
                    className="min-h-[80px]"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addInvestigationRow}
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Investigation
        </Button>
      )}
    </div>
  );
}