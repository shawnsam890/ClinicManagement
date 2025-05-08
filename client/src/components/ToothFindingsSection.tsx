import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface ToothFinding {
  id?: number;
  visitId: number;
  toothNumber: string;
  finding: string;
}

interface ToothFindingsSectionProps {
  visitId: number;
  readOnly?: boolean;
}

export default function ToothFindingsSection({ visitId, readOnly = false }: ToothFindingsSectionProps) {
  const { toast } = useToast();
  const [findings, setFindings] = useState<ToothFinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch settings for dropdown options
  const { data: settings = [] } = useQuery<any[]>({
    queryKey: ['/api/settings/category/dental_options'],
  });

  // Fetch existing tooth findings
  const { data: fetchedFindings = [], isLoading: isFetchingFindings } = useQuery<ToothFinding[]>({
    queryKey: [`/api/visits/${visitId}/tooth-findings`],
    enabled: !!visitId,
  });

  // Initialize findings state when data is loaded
  useEffect(() => {
    if (fetchedFindings.length > 0) {
      setFindings(fetchedFindings);
      setIsLoading(false);
    } else if (!isFetchingFindings) {
      // If no findings, start with an empty row if not readOnly
      if (!readOnly) {
        setFindings([{
          visitId: visitId,
          toothNumber: '',
          finding: ''
        }]);
      }
      setIsLoading(false);
    }
  }, [fetchedFindings, isFetchingFindings, visitId, readOnly]);

  // Create tooth finding mutation
  const createToothFindingMutation = useMutation({
    mutationFn: async (finding: Omit<ToothFinding, 'id'>) => {
      const res = await apiRequest("POST", "/api/tooth-findings", finding);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/tooth-findings`] });
      toast({
        title: "Finding recorded",
        description: "Tooth finding has been saved successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save finding",
        description: error.message || "There was an error saving the tooth finding.",
        variant: "destructive",
      });
    },
  });

  // Update tooth finding mutation
  const updateToothFindingMutation = useMutation({
    mutationFn: async (finding: ToothFinding) => {
      const res = await apiRequest("PUT", `/api/tooth-findings/${finding.id}`, finding);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/tooth-findings`] });
      toast({
        title: "Finding updated",
        description: "Tooth finding has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update finding",
        description: error.message || "There was an error updating the tooth finding.",
        variant: "destructive",
      });
    },
  });

  // Delete tooth finding mutation
  const deleteToothFindingMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tooth-findings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/tooth-findings`] });
      toast({
        title: "Finding deleted",
        description: "Tooth finding has been removed successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete finding",
        description: error.message || "There was an error deleting the tooth finding.",
        variant: "destructive",
      });
    },
  });

  const addFindingRow = () => {
    setFindings([
      ...findings,
      {
        visitId: visitId,
        toothNumber: '',
        finding: ''
      }
    ]);
  };

  const removeFindingRow = (index: number) => {
    const finding = findings[index];
    if (finding.id) {
      deleteToothFindingMutation.mutate(finding.id);
    } else {
      const newFindings = [...findings];
      newFindings.splice(index, 1);
      setFindings(newFindings);
    }
  };

  const handleInputChange = (index: number, field: 'toothNumber' | 'finding', value: string) => {
    const updatedFindings = [...findings];
    updatedFindings[index] = {
      ...updatedFindings[index],
      [field]: value
    };
    setFindings(updatedFindings);
  };

  const handleSaveFinding = (index: number) => {
    const finding = findings[index];
    
    // Skip if empty fields
    if (!finding.toothNumber || !finding.finding) {
      toast({
        title: "Validation Error",
        description: "Both tooth number and finding must be specified.",
        variant: "destructive",
      });
      return;
    }
    
    if (finding.id) {
      // Update existing finding
      updateToothFindingMutation.mutate(finding);
    } else {
      // Create new finding
      createToothFindingMutation.mutate({
        visitId: finding.visitId,
        toothNumber: finding.toothNumber,
        finding: finding.finding
      });
    }
  };

  // Get finding options from settings
  const getFindingOptions = (): string[] => {
    const setting = settings.find((s: any) => s.settingKey === "tooth_finding_options");
    if (setting && Array.isArray(setting.settingValue)) {
      return setting.settingValue;
    }
    return ["Caries", "Missing", "Filled", "Root Canal Treated", "Mobility", "Sensitivity"];
  };

  if (isLoading) {
    return <div className="py-4">Loading tooth findings...</div>;
  }

  return (
    <div className="space-y-4">
      {findings.length === 0 && readOnly ? (
        <div className="text-center py-4 text-muted-foreground">
          No tooth findings recorded.
        </div>
      ) : (
        <div className="space-y-4">
          {findings.map((finding, index) => (
            <div key={finding.id || `new-${index}`} className="grid grid-cols-12 gap-4">
              <div className="col-span-4">
                <Label htmlFor={`tooth-number-${index}`} className="text-xs mb-1 block">
                  Tooth Number
                </Label>
                <Input
                  id={`tooth-number-${index}`}
                  value={finding.toothNumber}
                  onChange={(e) => handleInputChange(index, 'toothNumber', e.target.value)}
                  placeholder="e.g., 16, 27"
                  disabled={readOnly}
                  className="h-9"
                />
              </div>
              
              <div className="col-span-6">
                <Label htmlFor={`finding-${index}`} className="text-xs mb-1 block">
                  Finding
                </Label>
                <Select
                  value={finding.finding}
                  onValueChange={(value) => handleInputChange(index, 'finding', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger id={`finding-${index}`} className="h-9">
                    <SelectValue placeholder="Select finding" />
                  </SelectTrigger>
                  <SelectContent>
                    {getFindingOptions().map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2 flex items-end">
                {!readOnly && (
                  <>
                    {index === findings.length - 1 ? (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handleSaveFinding(index)}
                        disabled={!finding.toothNumber || !finding.finding}
                        className="h-9 w-full"
                      >
                        Save
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFindingRow(index)}
                        className="h-9"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addFindingRow}
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Tooth Finding
        </Button>
      )}
    </div>
  );
}