import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { ToothFinding } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ToothFindingsProps {
  visitId: number;
}

export default function ToothFindingsSection({ visitId }: ToothFindingsProps) {
  const [toothFindings, setToothFindings] = useState<Array<{
    id?: number;
    toothNumber: string;
    finding: string;
    visitId: number;
  }>>([]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch tooth findings for this visit
  const { data: fetchedFindings, isLoading } = useQuery<ToothFinding[]>({
    queryKey: [`/api/visits/${visitId}/tooth-findings`],
    enabled: !!visitId,
  });

  // Fetch finding options
  const { data: findingOptions } = useQuery<any>({
    queryKey: ['/api/settings/key/tooth_finding_options'],
  });

  useEffect(() => {
    if (fetchedFindings && fetchedFindings.length > 0) {
      setToothFindings(fetchedFindings);
    } else if (!isLoading && (!fetchedFindings || fetchedFindings.length === 0)) {
      // Initialize with one empty finding if none exist
      setToothFindings([{
        toothNumber: '',
        finding: '',
        visitId,
      }]);
    }
  }, [fetchedFindings, isLoading, visitId]);

  // Create tooth finding mutation
  const createFindingMutation = useMutation({
    mutationFn: async (finding: Omit<ToothFinding, 'id'>) => {
      const res = await apiRequest("POST", "/api/tooth-findings", finding);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/tooth-findings`] });
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
  const updateFindingMutation = useMutation({
    mutationFn: async (finding: ToothFinding) => {
      const res = await apiRequest("PUT", `/api/tooth-findings/${finding.id}`, finding);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/tooth-findings`] });
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
  const deleteFindingMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tooth-findings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/tooth-findings`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete finding",
        description: error.message || "There was an error deleting the tooth finding.",
        variant: "destructive",
      });
    },
  });

  const handleAddFinding = () => {
    setToothFindings([...toothFindings, {
      toothNumber: '',
      finding: '',
      visitId,
    }]);
  };

  const handleRemoveFinding = (index: number) => {
    const finding = toothFindings[index];
    if (finding.id) {
      deleteFindingMutation.mutate(finding.id);
    } else {
      const newFindings = [...toothFindings];
      newFindings.splice(index, 1);
      setToothFindings(newFindings);
    }
  };

  const handleInputChange = (index: number, field: 'toothNumber' | 'finding', value: string) => {
    const updatedFindings = [...toothFindings];
    updatedFindings[index] = {
      ...updatedFindings[index],
      [field]: value
    };
    setToothFindings(updatedFindings);
  };

  const handleSaveFinding = (index: number) => {
    const finding = toothFindings[index];
    
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
      updateFindingMutation.mutate({
        id: finding.id,
        toothNumber: finding.toothNumber,
        finding: finding.finding,
        visitId,
      });
    } else {
      // Create new finding
      createFindingMutation.mutate({
        toothNumber: finding.toothNumber,
        finding: finding.finding,
        visitId,
      });
    }
  };

  // Automatically save when field loses focus
  const handleBlur = (index: number) => {
    const finding = toothFindings[index];
    if (finding.toothNumber && finding.finding) {
      handleSaveFinding(index);
    }
  };

  // Generate tooth number options (Universal Numbering System: 1-32)
  const toothNumbers = Array.from({ length: 32 }, (_, i) => (i + 1).toString());

  // Get finding options from settings or use default options
  const findingsList = findingOptions?.settingValue?.options || [
    "Caries", "Filling", "Root Canal", "Extraction", "Crown", "Bridge", "Implant", 
    "Mobility", "Sensitivity", "Abscess", "Missing"
  ];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tooth Findings</CardTitle>
        <Button variant="outline" size="sm" onClick={handleAddFinding}>
          <Plus className="h-4 w-4 mr-2" />
          Add Finding
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
          </div>
        ) : toothFindings.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No findings recorded. Add a finding to start.
          </div>
        ) : (
          <>
            {toothFindings.map((finding, index) => (
              <div 
                key={finding.id || `new-${index}`} 
                className="flex flex-wrap md:flex-nowrap gap-2 items-center mb-2"
              >
                <div className="w-full md:w-1/3">
                  <Label htmlFor={`tooth-number-${index}`}>Tooth Number</Label>
                  <Select
                    value={finding.toothNumber}
                    onValueChange={(value) => handleInputChange(index, 'toothNumber', value)}
                    onOpenChange={() => handleBlur(index)}
                  >
                    <SelectTrigger id={`tooth-number-${index}`}>
                      <SelectValue placeholder="Select tooth" />
                    </SelectTrigger>
                    <SelectContent>
                      {toothNumbers.map((num) => (
                        <SelectItem key={num} value={num}>
                          #{num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full md:w-2/3">
                  <Label htmlFor={`finding-${index}`}>Finding</Label>
                  <Select
                    value={finding.finding}
                    onValueChange={(value) => handleInputChange(index, 'finding', value)}
                    onOpenChange={() => handleBlur(index)}
                  >
                    <SelectTrigger id={`finding-${index}`}>
                      <SelectValue placeholder="Select finding" />
                    </SelectTrigger>
                    <SelectContent>
                      {findingsList.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="mt-6"
                  onClick={() => handleRemoveFinding(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}