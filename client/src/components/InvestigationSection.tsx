import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

import { Investigation } from "@shared/schema";

interface InvestigationSectionProps {
  visitId: number;
}

export default function InvestigationSection({ visitId }: InvestigationSectionProps) {
  const { toast } = useToast();
  const [newInvestigation, setNewInvestigation] = useState<Partial<Investigation>>({
    type: "",
    findings: "",
    visitId
  });
  const [showFindings, setShowFindings] = useState(false);

  // Fetch investigations for the visit
  const { data: investigations = [], isLoading } = useQuery<Investigation[]>({
    queryKey: [`/api/visits/${visitId}/investigations`],
    enabled: !!visitId,
  });

  // Fetch investigation type options from central dropdown settings
  const { data: dropdownOptions = {} } = useQuery({
    queryKey: ['/api/settings/key/dropdown_options'],
    select: (data: any) => data?.settingValue || {},
  });
  
  // Extract investigation types from dropdown options
  const investigationTypes = dropdownOptions.investigation || [];

  // Create investigation mutation
  const createInvestigationMutation = useMutation({
    mutationFn: async (investigation: Partial<Investigation>) => {
      const res = await apiRequest("POST", "/api/investigations", investigation);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/investigations`] });
      // Reset form
      setNewInvestigation({
        type: "",
        findings: "",
        visitId
      });
      setShowFindings(false);
      toast({
        title: "Success",
        description: "Investigation added",
      });
    },
    onError: (error) => {
      console.error("Error adding investigation:", error);
      toast({
        title: "Error",
        description: "Failed to add investigation",
        variant: "destructive",
      });
    },
  });

  // Delete investigation mutation
  const deleteInvestigationMutation = useMutation({
    mutationFn: async (investigationId: number) => {
      await apiRequest("DELETE", `/api/investigations/${investigationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/investigations`] });
      toast({
        title: "Success",
        description: "Investigation removed",
      });
    },
    onError: (error) => {
      console.error("Error deleting investigation:", error);
      toast({
        title: "Error",
        description: "Failed to remove investigation",
        variant: "destructive",
      });
    },
  });

  // Handle input changes
  const handleInputChange = (field: keyof Investigation, value: string) => {
    setNewInvestigation((prev) => ({
      ...prev,
      [field]: value
    }));

    // Show findings field when type is selected
    if (field === 'type' && value) {
      setShowFindings(true);
    }
  };

  // Handle add investigation
  const handleAddInvestigation = () => {
    if (!newInvestigation.type) {
      toast({
        title: "Error",
        description: "Please select an investigation type",
        variant: "destructive",
      });
      return;
    }

    createInvestigationMutation.mutate(newInvestigation);
  };

  // Handle delete investigation
  const handleDeleteInvestigation = (investigationId: number) => {
    if (window.confirm("Are you sure you want to delete this investigation?")) {
      deleteInvestigationMutation.mutate(investigationId);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-4">
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <Select
                value={newInvestigation.type || ""}
                onValueChange={(value) => handleInputChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select investigation type" />
                </SelectTrigger>
                <SelectContent>
                  {investigationTypes.map((type, index) => (
                    <SelectItem key={index} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleAddInvestigation}
              disabled={!newInvestigation.type}
            >
              Add
            </Button>
          </div>

          {/* Conditional findings field - only shown when a type is selected */}
          {showFindings && (
            <div className="space-y-2">
              <Textarea
                placeholder="Enter findings for this investigation..."
                value={newInvestigation.findings || ""}
                onChange={(e) => handleInputChange("findings", e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : investigations.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Findings</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investigations.map((investigation) => (
                <TableRow key={investigation.id}>
                  <TableCell>{investigation.type}</TableCell>
                  <TableCell>{investigation.findings || "Not specified"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteInvestigation(investigation.id)}
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
            No investigations recorded
          </div>
        )}
      </CardContent>
    </Card>
  );
}