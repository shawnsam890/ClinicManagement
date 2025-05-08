import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface GeneralizedFinding {
  id?: number;
  visitId: number;
  finding: string;
}

interface GeneralizedFindingsSectionProps {
  visitId: number;
  readOnly?: boolean;
}

export default function GeneralizedFindingsSection({ visitId, readOnly = false }: GeneralizedFindingsSectionProps) {
  const { toast } = useToast();
  const [findings, setFindings] = useState<GeneralizedFinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch settings for dropdown options
  const { data: settings = [] } = useQuery<any[]>({
    queryKey: ['/api/settings/category/dental_options'],
  });

  // Fetch existing generalized findings
  const { data: fetchedFindings = [], isLoading: isFetchingFindings } = useQuery<GeneralizedFinding[]>({
    queryKey: [`/api/visits/${visitId}/generalized-findings`],
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
          finding: ''
        }]);
      }
      setIsLoading(false);
    }
  }, [fetchedFindings, isFetchingFindings, visitId, readOnly]);

  // Create generalized finding mutation
  const createFindingMutation = useMutation({
    mutationFn: async (finding: Omit<GeneralizedFinding, 'id'>) => {
      const res = await apiRequest("POST", "/api/generalized-findings", finding);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/generalized-findings`] });
      toast({
        title: "Finding recorded",
        description: "Generalized finding has been saved successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save finding",
        description: error.message || "There was an error saving the generalized finding.",
        variant: "destructive",
      });
    },
  });

  // Delete generalized finding mutation
  const deleteFindingMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/generalized-findings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/generalized-findings`] });
      toast({
        title: "Finding deleted",
        description: "Generalized finding has been removed successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete finding",
        description: error.message || "There was an error deleting the generalized finding.",
        variant: "destructive",
      });
    },
  });

  const addFindingRow = () => {
    setFindings([
      ...findings,
      {
        visitId: visitId,
        finding: ''
      }
    ]);
  };

  const removeFindingRow = (index: number) => {
    const finding = findings[index];
    if (finding.id) {
      deleteFindingMutation.mutate(finding.id);
    } else {
      const newFindings = [...findings];
      newFindings.splice(index, 1);
      setFindings(newFindings);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    const updatedFindings = [...findings];
    updatedFindings[index] = {
      ...updatedFindings[index],
      finding: value
    };
    setFindings(updatedFindings);
  };

  const handleSaveFinding = (index: number) => {
    const finding = findings[index];
    
    // Skip if empty fields
    if (!finding.finding) {
      toast({
        title: "Validation Error",
        description: "Finding must be specified.",
        variant: "destructive",
      });
      return;
    }
    
    if (!finding.id) {
      // Create new finding
      createFindingMutation.mutate({
        visitId: finding.visitId,
        finding: finding.finding
      });
    }
  };

  // Get finding options from settings
  const getFindingOptions = (): string[] => {
    const setting = settings.find((s: any) => s.settingKey === "generalized_finding_options");
    if (setting && Array.isArray(setting.settingValue)) {
      return setting.settingValue;
    }
    return ["Gingivitis", "Periodontitis", "Malocclusion", "TMJ Disorder", "Xerostomia", "Halitosis"];
  };

  if (isLoading) {
    return <div className="py-4">Loading generalized findings...</div>;
  }

  return (
    <div className="space-y-4">
      {findings.length === 0 && readOnly ? (
        <div className="text-center py-4 text-muted-foreground">
          No generalized findings recorded.
        </div>
      ) : (
        <div className="space-y-4">
          {findings.map((finding, index) => (
            <div key={finding.id || `new-${index}`} className="flex items-center gap-2">
              <div className="flex-grow">
                <Select
                  value={finding.finding}
                  onValueChange={(value) => handleInputChange(index, value)}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select generalized finding" />
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
              
              {!readOnly && (
                <div className="flex-shrink-0 flex items-center">
                  {index === findings.length - 1 ? (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveFinding(index)}
                      disabled={!finding.finding}
                    >
                      Save
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFindingRow(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
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
          onClick={addFindingRow}
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Generalized Finding
        </Button>
      )}
    </div>
  );
}