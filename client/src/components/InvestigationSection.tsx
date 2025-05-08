import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Investigation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface InvestigationSectionProps {
  visitId: number;
}

export default function InvestigationSection({ visitId }: InvestigationSectionProps) {
  const [investigations, setInvestigations] = useState<Array<{
    id?: number;
    type: string;
    findings: string;
    visitId: number;
  }>>([]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch investigations for this visit
  const { data: fetchedInvestigations, isLoading } = useQuery<Investigation[]>({
    queryKey: [`/api/visits/${visitId}/investigations`],
    enabled: !!visitId,
  });

  // Fetch investigation type options from settings
  const { data: investigationOptions } = useQuery<any>({
    queryKey: ['/api/settings/key/investigation_types'],
  });

  useEffect(() => {
    if (fetchedInvestigations && fetchedInvestigations.length > 0) {
      setInvestigations(fetchedInvestigations);
    } else if (!isLoading && (!fetchedInvestigations || fetchedInvestigations.length === 0)) {
      // Initialize with one empty investigation if none exist
      setInvestigations([{
        type: '',
        findings: '',
        visitId,
      }]);
    }
  }, [fetchedInvestigations, isLoading, visitId]);

  // Create investigation mutation
  const createInvestigationMutation = useMutation({
    mutationFn: async (investigation: Omit<Investigation, 'id'>) => {
      const res = await apiRequest("POST", "/api/investigations", investigation);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/investigations`] });
      toast({
        title: "Investigation added",
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
        description: "Investigation has been deleted successfully."
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

  const handleAddInvestigation = () => {
    setInvestigations([...investigations, {
      type: '',
      findings: '',
      visitId,
    }]);
  };

  const handleRemoveInvestigation = (index: number) => {
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
    
    // Skip if empty type
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
      updateInvestigationMutation.mutate({
        id: investigation.id,
        type: investigation.type,
        findings: investigation.findings,
        visitId,
      });
    } else {
      // Create new investigation
      createInvestigationMutation.mutate({
        type: investigation.type,
        findings: investigation.findings,
        visitId,
      });
    }
  };

  // Get investigation type options from settings or use defaults
  const investigationTypeOptions = investigationOptions?.settingValue?.options || [
    "X-Ray", "CBCT", "IOPA", "OPG", "Blood Test", "Vitality Test", "Culture Sensitivity"
  ];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Investigations Done</CardTitle>
        <Button variant="outline" size="sm" onClick={handleAddInvestigation}>
          <Plus className="h-4 w-4 mr-2" />
          Add Investigation
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
          </div>
        ) : investigations.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No investigations recorded. Add an investigation to start.
          </div>
        ) : (
          <>
            {investigations.map((investigation, index) => (
              <div 
                key={investigation.id || `new-${index}`} 
                className="border rounded-md p-4 mb-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Investigation #{index + 1}</h4>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveInvestigation(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`investigation-type-${index}`}>Type</Label>
                    <Select
                      value={investigation.type}
                      onValueChange={(value) => handleInputChange(index, 'type', value)}
                    >
                      <SelectTrigger id={`investigation-type-${index}`}>
                        <SelectValue placeholder="Select investigation type" />
                      </SelectTrigger>
                      <SelectContent>
                        {investigationTypeOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {investigation.type && (
                    <div>
                      <Label htmlFor={`investigation-findings-${index}`}>Findings</Label>
                      <Textarea
                        id={`investigation-findings-${index}`}
                        placeholder="Enter investigation findings"
                        value={investigation.findings}
                        onChange={(e) => handleInputChange(index, 'findings', e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => handleSaveInvestigation(index)} 
                      disabled={!investigation.type}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}