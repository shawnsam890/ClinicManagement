import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { GeneralizedFinding } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface GeneralizedFindingsProps {
  visitId: number;
}

export default function GeneralizedFindingsSection({ visitId }: GeneralizedFindingsProps) {
  const [findings, setFindings] = useState("");
  const [currentFindingId, setCurrentFindingId] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch generalized findings for this visit
  const { data: fetchedFindings, isLoading } = useQuery<GeneralizedFinding[]>({
    queryKey: [`/api/visits/${visitId}/generalized-findings`],
    enabled: !!visitId,
  });

  useEffect(() => {
    if (fetchedFindings && fetchedFindings.length > 0) {
      // Use the first finding since there should only be one per visit
      setFindings(fetchedFindings[0].finding);
      setCurrentFindingId(fetchedFindings[0].id);
      setIsDirty(false);
    } else {
      setFindings("");
      setCurrentFindingId(null);
      setIsDirty(false);
    }
  }, [fetchedFindings]);

  // Create generalized finding mutation
  const createFindingMutation = useMutation({
    mutationFn: async (finding: Omit<GeneralizedFinding, 'id'>) => {
      const res = await apiRequest("POST", "/api/generalized-findings", finding);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/generalized-findings`] });
      setCurrentFindingId(data.id);
      setIsDirty(false);
      toast({
        title: "Findings saved",
        description: "Generalized findings have been saved successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save findings",
        description: error.message || "There was an error saving the generalized findings.",
        variant: "destructive",
      });
    },
  });

  // Update generalized finding mutation
  const updateFindingMutation = useMutation({
    mutationFn: async ({ id, finding }: { id: number, finding: string }) => {
      const res = await apiRequest("PUT", `/api/generalized-findings/${id}`, {
        finding,
        visitId
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/generalized-findings`] });
      setIsDirty(false);
      toast({
        title: "Findings updated",
        description: "Generalized findings have been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update findings",
        description: error.message || "There was an error updating the generalized findings.",
        variant: "destructive",
      });
    },
  });

  const handleSaveFindings = () => {
    if (!findings.trim()) {
      return;
    }

    if (currentFindingId) {
      // Update existing findings
      updateFindingMutation.mutate({
        id: currentFindingId,
        finding: findings
      });
    } else {
      // Create new findings
      createFindingMutation.mutate({
        finding: findings,
        visitId
      });
    }
  };

  const handleInputChange = (value: string) => {
    setFindings(value);
    setIsDirty(true);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Generalized Findings</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <Label htmlFor="generalized-findings">Findings</Label>
              <Textarea
                id="generalized-findings"
                placeholder="Enter generalized findings (e.g., gingival health, occlusion, etc.)"
                value={findings}
                onChange={(e) => handleInputChange(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveFindings} 
                disabled={!isDirty || !findings.trim()}
              >
                Save Findings
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}