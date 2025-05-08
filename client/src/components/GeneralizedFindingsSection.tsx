import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { GeneralizedFinding } from "@shared/schema";

interface GeneralizedFindingsSectionProps {
  visitId: number;
}

export default function GeneralizedFindingsSection({ visitId }: GeneralizedFindingsSectionProps) {
  const { toast } = useToast();
  const [finding, setFinding] = useState<string>("");

  // Fetch generalized findings for the visit
  const { data: generalizedFindings = [], isLoading } = useQuery<GeneralizedFinding[]>({
    queryKey: [`/api/visits/${visitId}/generalized-findings`],
    enabled: !!visitId,
  });

  // Set initial form data when findings are loaded
  useEffect(() => {
    if (generalizedFindings.length > 0) {
      setFinding(generalizedFindings[0].finding || "");
    }
  }, [generalizedFindings]);

  // Create generalized finding mutation
  const createFindingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/generalized-findings", {
        visitId,
        finding
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/generalized-findings`] });
      toast({
        title: "Success",
        description: "Generalized finding saved",
      });
    },
    onError: (error) => {
      console.error("Error saving generalized finding:", error);
      toast({
        title: "Error",
        description: "Failed to save generalized finding",
        variant: "destructive",
      });
    },
  });

  // Update generalized finding mutation
  const updateFindingMutation = useMutation({
    mutationFn: async () => {
      if (generalizedFindings.length === 0) return null;
      
      const findingId = generalizedFindings[0].id;
      const res = await apiRequest("PUT", `/api/generalized-findings/${findingId}`, {
        finding
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/generalized-findings`] });
      toast({
        title: "Success",
        description: "Generalized finding updated",
      });
    },
    onError: (error) => {
      console.error("Error updating generalized finding:", error);
      toast({
        title: "Error",
        description: "Failed to update generalized finding",
        variant: "destructive",
      });
    },
  });

  // Handle save
  const handleSave = () => {
    if (!finding.trim()) {
      toast({
        title: "Error",
        description: "Please enter a generalized finding",
        variant: "destructive",
      });
      return;
    }

    if (generalizedFindings.length === 0) {
      createFindingMutation.mutate();
    } else {
      updateFindingMutation.mutate();
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="mb-2">Generalized Finding</Badge>
          </div>
          <Textarea
            placeholder="Enter generalized oral findings here..."
            value={finding}
            onChange={(e) => setFinding(e.target.value)}
            className="min-h-[100px]"
          />
          <Button 
            onClick={handleSave}
            disabled={!finding.trim()}
            className="mt-2"
          >
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}