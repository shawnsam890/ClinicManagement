import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, parse } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

import { FollowUp } from "@shared/schema";

interface FollowUpSectionProps {
  visitId: number;
  patientId: string;
}

export default function FollowUpSection({ visitId, patientId }: FollowUpSectionProps) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 7));
  const [reason, setReason] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch follow-ups for the visit
  const { data: followUps = [], isLoading } = useQuery<FollowUp[]>({
    queryKey: [`/api/visits/${visitId}/follow-ups`],
    enabled: !!visitId,
  });

  // Create follow-up mutation
  const createFollowUpMutation = useMutation({
    mutationFn: async () => {
      if (!date) return null;
      
      const res = await apiRequest("POST", "/api/follow-ups", {
        visitId,
        patientId,
        date: format(date, 'yyyy-MM-dd'),
        reason: reason || "Regular follow-up",
        status: "Scheduled"
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/follow-ups`] });
      // Reset form
      setReason("");
      setShowCreateForm(false);
      toast({
        title: "Success",
        description: "Follow-up scheduled",
      });
    },
    onError: (error) => {
      console.error("Error scheduling follow-up:", error);
      toast({
        title: "Error",
        description: "Failed to schedule follow-up",
        variant: "destructive",
      });
    },
  });

  // Handle schedule follow-up
  const handleScheduleFollowUp = () => {
    if (!date) {
      toast({
        title: "Error",
        description: "Please select a date for the follow-up",
        variant: "destructive",
      });
      return;
    }

    createFollowUpMutation.mutate();
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = parse(dateString, 'yyyy-MM-dd', new Date());
      return format(date, 'PPP');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-lg font-medium">Schedule a Follow-up</Label>
          {!showCreateForm && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowCreateForm(true)}
              className="mb-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Schedule
            </Button>
          )}
        </div>
        
        {showCreateForm && (
          <div className="space-y-4 p-4 bg-muted/30 rounded-md">
            <div className="space-y-2">
              <Label>Follow-up Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {date ? format(date, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                placeholder="Reason for follow-up"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="flex space-x-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleScheduleFollowUp}>
                Schedule
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : followUps.length > 0 ? (
          <div className="space-y-4">
            <Label>Scheduled Follow-ups</Label>
            <div className="space-y-2">
              {followUps.map((followUp) => (
                <div key={followUp.id} className="p-3 border rounded-md flex justify-between items-center">
                  <div>
                    <p className="font-medium">{formatDate(followUp.date)}</p>
                    <p className="text-sm text-muted-foreground">{followUp.reason}</p>
                  </div>
                  <div>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs",
                      followUp.status === "Completed" ? "bg-green-100 text-green-800" : 
                      followUp.status === "Cancelled" ? "bg-red-100 text-red-800" : 
                      "bg-blue-100 text-blue-800"
                    )}>
                      {followUp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No follow-ups scheduled
          </div>
        )}
      </CardContent>
    </Card>
  );
}