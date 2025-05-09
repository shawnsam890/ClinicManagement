import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

import { ToothFinding } from "@shared/schema";

interface ToothFindingsSectionProps {
  visitId: number;
}

export default function ToothFindingsSection({ visitId }: ToothFindingsSectionProps) {
  const { toast } = useToast();
  const [newFinding, setNewFinding] = useState<Partial<ToothFinding>>({
    toothNumber: "",
    finding: "",
    visitId
  });

  // Fetch tooth findings for the visit
  const { data: toothFindings = [], isLoading } = useQuery<ToothFinding[]>({
    queryKey: [`/api/visits/${visitId}/tooth-findings`],
    enabled: !!visitId,
  });

  // Fetch dropdown options from central settings
  const { data: dropdownOptions = {} } = useQuery({
    queryKey: ['/api/settings/key/dropdown_options'],
    select: (data: any) => data?.settingValue || {},
  });
  
  // Extract tooth finding options from dropdown options
  const findingOptions = dropdownOptions.oralExamination || [];

  // Create tooth finding mutation
  const createToothFindingMutation = useMutation({
    mutationFn: async (finding: Partial<ToothFinding>) => {
      const res = await apiRequest("POST", "/api/tooth-findings", finding);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/tooth-findings`] });
      // Reset form
      setNewFinding({
        toothNumber: "",
        finding: "",
        visitId
      });
      toast({
        title: "Success",
        description: "Tooth finding added",
      });
    },
    onError: (error) => {
      console.error("Error adding tooth finding:", error);
      toast({
        title: "Error",
        description: "Failed to add tooth finding",
        variant: "destructive",
      });
    },
  });

  // Delete tooth finding mutation
  const deleteToothFindingMutation = useMutation({
    mutationFn: async (findingId: number) => {
      await apiRequest("DELETE", `/api/tooth-findings/${findingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/tooth-findings`] });
      toast({
        title: "Success",
        description: "Tooth finding removed",
      });
    },
    onError: (error) => {
      console.error("Error deleting tooth finding:", error);
      toast({
        title: "Error",
        description: "Failed to remove tooth finding",
        variant: "destructive",
      });
    },
  });

  // Handle input changes
  const handleInputChange = (field: keyof ToothFinding, value: string) => {
    setNewFinding((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle add finding
  const handleAddFinding = () => {
    if (!newFinding.toothNumber || !newFinding.finding) {
      toast({
        title: "Error",
        description: "Please enter both tooth number and finding",
        variant: "destructive",
      });
      return;
    }

    createToothFindingMutation.mutate(newFinding);
  };

  // Handle delete finding
  const handleDeleteFinding = (findingId: number) => {
    if (window.confirm("Are you sure you want to delete this finding?")) {
      deleteToothFindingMutation.mutate(findingId);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Tooth Number"
              value={newFinding.toothNumber || ""}
              onChange={(e) => handleInputChange("toothNumber", e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Select
              value={newFinding.finding || ""}
              onValueChange={(value) => handleInputChange("finding", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a finding" />
              </SelectTrigger>
              <SelectContent>
                {findingOptions.map((option: string, index: number) => (
                  <SelectItem key={index} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddFinding} disabled={!newFinding.toothNumber || !newFinding.finding}>
            Add
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : toothFindings.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tooth Number</TableHead>
                <TableHead>Finding</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {toothFindings.map((finding) => (
                <TableRow key={finding.id}>
                  <TableCell>{finding.toothNumber}</TableCell>
                  <TableCell>{finding.finding}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteFinding(finding.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No tooth findings recorded
          </div>
        )}
      </CardContent>
    </Card>
  );
}