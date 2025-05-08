import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { FollowUp } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isBefore, isToday } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface FollowUpSectionProps {
  visitId: number;
  patientId: string;
}

export default function FollowUpSection({ visitId, patientId }: FollowUpSectionProps) {
  const [followUps, setFollowUps] = useState<Array<{
    id?: number;
    date: string;
    reason: string;
    status: string;
    visitId: number;
  }>>([]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch follow-ups for this visit
  const { data: fetchedFollowUps, isLoading } = useQuery<FollowUp[]>({
    queryKey: [`/api/visits/${visitId}/follow-ups`],
    enabled: !!visitId,
  });

  useEffect(() => {
    if (fetchedFollowUps && fetchedFollowUps.length > 0) {
      // Map the database scheduledDate field to the component's date field
      const mappedFollowUps = fetchedFollowUps.map(followUp => ({
        id: followUp.id,
        date: followUp.scheduledDate, // Map scheduledDate to date
        reason: followUp.reason || '',
        status: followUp.status,
        visitId: followUp.visitId,
      }));
      setFollowUps(mappedFollowUps);
    } else if (!isLoading && (!fetchedFollowUps || fetchedFollowUps.length === 0)) {
      // Initialize with one empty follow-up if none exist
      setFollowUps([{
        date: new Date().toISOString().split('T')[0],
        reason: '',
        status: 'Scheduled',
        visitId,
      }]);
    }
  }, [fetchedFollowUps, isLoading, visitId]);

  // Create follow-up mutation
  const createFollowUpMutation = useMutation({
    mutationFn: async (followUp: { date: string, reason: string, status: string, visitId: number }) => {
      // Map component's date to database's scheduledDate
      const data = {
        scheduledDate: followUp.date,
        reason: followUp.reason,
        status: followUp.status,
        visitId: followUp.visitId
      };
      const res = await apiRequest("POST", "/api/follow-ups", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/follow-ups`] });
      toast({
        title: "Follow-up added",
        description: "Follow-up has been scheduled successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to schedule follow-up",
        description: error.message || "There was an error scheduling the follow-up.",
        variant: "destructive",
      });
    },
  });

  // Update follow-up mutation
  const updateFollowUpMutation = useMutation({
    mutationFn: async (followUp: { id: number, date: string, reason: string, status: string, visitId: number }) => {
      // Map component's date to database's scheduledDate
      const data = {
        id: followUp.id,
        scheduledDate: followUp.date,
        reason: followUp.reason,
        status: followUp.status,
        visitId: followUp.visitId
      };
      const res = await apiRequest("PUT", `/api/follow-ups/${followUp.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/follow-ups`] });
      toast({
        title: "Follow-up updated",
        description: "Follow-up has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update follow-up",
        description: error.message || "There was an error updating the follow-up.",
        variant: "destructive",
      });
    },
  });

  // Delete follow-up mutation
  const deleteFollowUpMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/follow-ups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/follow-ups`] });
      toast({
        title: "Follow-up deleted",
        description: "Follow-up has been removed successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete follow-up",
        description: error.message || "There was an error deleting the follow-up.",
        variant: "destructive",
      });
    },
  });

  // Create new visit from follow-up mutation
  const createVisitFromFollowUpMutation = useMutation({
    mutationFn: async ({ followUpId, followUpDate }: { followUpId: number, followUpDate: string }) => {
      // Create a new visit linked to the previous visit
      const res = await apiRequest("POST", `/api/visits/${visitId}/follow-up`, {
        date: followUpDate
      });
      
      // Mark the follow-up as completed
      await apiRequest("PUT", `/api/follow-ups/${followUpId}`, {
        id: followUpId,
        status: 'Completed',
        visitId
      });
      
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/follow-ups`] });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/visits`] });
      
      toast({
        title: "Visit created",
        description: "A new visit has been created from the follow-up."
      });
      
      // Optionally navigate to the new visit
      // history.push(`/patients/${patientId}/visits/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create visit",
        description: error.message || "There was an error creating a visit from the follow-up.",
        variant: "destructive",
      });
    },
  });

  const handleAddFollowUp = () => {
    // Add new follow-up with default date (1 week from now)
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    setFollowUps([...followUps, {
      date: oneWeekFromNow.toISOString().split('T')[0],
      reason: '',
      status: 'Scheduled',
      visitId,
    }]);
  };

  const handleRemoveFollowUp = (index: number) => {
    const followUp = followUps[index];
    if (followUp.id) {
      deleteFollowUpMutation.mutate(followUp.id);
    } else {
      const newFollowUps = [...followUps];
      newFollowUps.splice(index, 1);
      setFollowUps(newFollowUps);
    }
  };

  const handleInputChange = (index: number, field: 'date' | 'reason' | 'status', value: string) => {
    const updatedFollowUps = [...followUps];
    updatedFollowUps[index] = {
      ...updatedFollowUps[index],
      [field]: value
    };
    setFollowUps(updatedFollowUps);
  };

  const handleDateSelect = (index: number, date: Date) => {
    handleInputChange(index, 'date', date.toISOString().split('T')[0]);
  };

  const handleSaveFollowUp = (index: number) => {
    const followUp = followUps[index];
    
    // Skip if empty reason
    if (!followUp.reason) {
      toast({
        title: "Validation Error",
        description: "Follow-up reason must be specified.",
        variant: "destructive",
      });
      return;
    }
    
    if (followUp.id) {
      // Update existing follow-up
      updateFollowUpMutation.mutate({
        id: followUp.id,
        date: followUp.date,
        reason: followUp.reason,
        status: followUp.status,
        visitId,
      });
    } else {
      // Create new follow-up
      createFollowUpMutation.mutate({
        date: followUp.date,
        reason: followUp.reason,
        status: followUp.status,
        visitId,
      });
    }
  };

  const handleCreateVisit = (followUp: { id?: number, date: string }) => {
    if (!followUp.id) {
      toast({
        title: "Save required",
        description: "Please save the follow-up before creating a visit.",
        variant: "destructive",
      });
      return;
    }
    
    createVisitFromFollowUpMutation.mutate({
      followUpId: followUp.id,
      followUpDate: followUp.date
    });
  };

  const getStatusColor = (status: string, date: string) => {
    const today = new Date();
    const followUpDate = parseISO(date);
    
    if (status === 'Completed') {
      return "bg-green-100 text-green-800 hover:bg-green-200";
    } else if (status === 'Cancelled') {
      return "bg-red-100 text-red-800 hover:bg-red-200";
    } else if (isBefore(followUpDate, today) && !isToday(followUpDate)) {
      return "bg-red-100 text-red-800 hover:bg-red-200"; // Overdue
    } else if (isToday(followUpDate)) {
      return "bg-blue-100 text-blue-800 hover:bg-blue-200"; // Today
    } else {
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"; // Upcoming
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Follow-Ups</CardTitle>
        <Button variant="outline" size="sm" onClick={handleAddFollowUp}>
          <Plus className="h-4 w-4 mr-2" />
          Add Follow-Up
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
          </div>
        ) : followUps.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No follow-ups scheduled. Add a follow-up to start.
          </div>
        ) : (
          <>
            {followUps.map((followUp, index) => (
              <div 
                key={followUp.id || `new-${index}`} 
                className="border rounded-md p-4 mb-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Follow-up #{index + 1}</h4>
                    <Badge className={getStatusColor(followUp.status, followUp.date)}>
                      {followUp.status === 'Scheduled' && isBefore(parseISO(followUp.date), new Date()) && !isToday(parseISO(followUp.date))
                        ? 'Overdue'
                        : followUp.status}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveFollowUp(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`follow-up-date-${index}`}>Date</Label>
                    <div className="flex">
                      <Input
                        id={`follow-up-date-${index}`}
                        type="date"
                        value={followUp.date}
                        onChange={(e) => handleInputChange(index, 'date', e.target.value)}
                        className="w-full"
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="ml-2">
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={parseISO(followUp.date)}
                            onSelect={(date) => date && handleDateSelect(index, date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`follow-up-reason-${index}`}>Reason</Label>
                    <Textarea
                      id={`follow-up-reason-${index}`}
                      placeholder="Enter reason for follow-up"
                      value={followUp.reason}
                      onChange={(e) => handleInputChange(index, 'reason', e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  {followUp.id && (
                    <div>
                      <Label htmlFor={`follow-up-status-${index}`}>Status</Label>
                      <select
                        id={`follow-up-status-${index}`}
                        value={followUp.status}
                        onChange={(e) => handleInputChange(index, 'status', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      onClick={() => handleSaveFollowUp(index)} 
                      disabled={!followUp.reason}
                    >
                      Save
                    </Button>
                    
                    {followUp.id && followUp.status === 'Scheduled' && (
                      <Button 
                        variant="secondary"
                        onClick={() => handleCreateVisit(followUp)}
                      >
                        Create Visit
                      </Button>
                    )}
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