import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Check, Edit, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FollowUp {
  id?: number;
  visitId: number;
  patientId: string;
  scheduledDate: string;
  reason: string;
  status: string;
  notes?: string;
}

interface FollowUpSectionProps {
  visitId: number;
  patientId: string;
  readOnly?: boolean;
}

export default function FollowUpSection({ visitId, patientId, readOnly = false }: FollowUpSectionProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState<Omit<FollowUp, 'id'>>({
    visitId,
    patientId,
    scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
    status: 'Scheduled',
    notes: ''
  });

  // Fetch existing follow-ups
  const { 
    data: followUps = [], 
    isLoading,
    refetch 
  } = useQuery<FollowUp[]>({
    queryKey: [`/api/visits/${visitId}/follow-ups`],
    enabled: !!visitId,
  });

  // Mutation to create follow-up
  const createFollowUpMutation = useMutation({
    mutationFn: async (data: Omit<FollowUp, 'id'>) => {
      const res = await apiRequest("POST", "/api/follow-ups", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/follow-ups`] });
      toast({
        title: "Follow-up scheduled",
        description: "Follow-up appointment has been scheduled successfully."
      });
      setIsCreating(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to schedule follow-up appointment.",
        variant: "destructive",
      });
    }
  });

  // Mutation to update follow-up
  const updateFollowUpMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<FollowUp> }) => {
      const res = await apiRequest("PUT", `/api/follow-ups/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/follow-ups`] });
      toast({
        title: "Follow-up updated",
        description: "Follow-up appointment has been updated successfully."
      });
      setIsEditing(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update follow-up appointment.",
        variant: "destructive",
      });
    }
  });

  // Mutation to delete follow-up
  const deleteFollowUpMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/follow-ups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visits/${visitId}/follow-ups`] });
      toast({
        title: "Follow-up cancelled",
        description: "Follow-up appointment has been cancelled successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to cancel follow-up appointment.",
        variant: "destructive",
      });
    }
  });

  // Reset form after submission
  const resetForm = () => {
    setFormData({
      visitId,
      patientId,
      scheduledDate: format(new Date(), 'yyyy-MM-dd'),
      reason: '',
      status: 'Scheduled',
      notes: ''
    });
  };

  // Cancel create mode
  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(null);
    resetForm();
  };

  // Handle input change
  const handleInputChange = (field: keyof FollowUp, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Start editing a follow-up
  const startEditing = (followUp: FollowUp) => {
    setIsEditing(followUp.id!);
    setFormData({
      visitId: followUp.visitId,
      patientId: followUp.patientId,
      scheduledDate: followUp.scheduledDate,
      reason: followUp.reason,
      status: followUp.status,
      notes: followUp.notes || ''
    });
  };

  // Handle submit
  const handleSubmit = () => {
    if (!formData.reason) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for the follow-up.",
        variant: "destructive",
      });
      return;
    }

    if (isEditing) {
      updateFollowUpMutation.mutate({ 
        id: isEditing, 
        data: formData 
      });
    } else {
      createFollowUpMutation.mutate(formData);
    }
  };

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="py-4">Loading follow-up information...</div>;
  }

  return (
    <div className="space-y-4">
      {followUps.length === 0 && !isCreating ? (
        <div className="text-center py-6">
          <p className="text-muted-foreground mb-4">No follow-up appointments scheduled.</p>
          {!readOnly && (
            <Button 
              variant="outline" 
              onClick={() => setIsCreating(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Schedule Follow-up
            </Button>
          )}
        </div>
      ) : (
        <>
          {!isCreating && !isEditing && (
            <div className="space-y-4">
              {followUps.map((followUp) => (
                <div 
                  key={followUp.id} 
                  className="border rounded-md p-4 relative"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm font-medium mb-1">
                        Follow-up on {format(new Date(followUp.scheduledDate), 'PPP')}
                      </div>
                      <Badge className={cn("font-normal", getStatusColor(followUp.status))}>
                        {followUp.status}
                      </Badge>
                    </div>
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(followUp)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold">Reason: </span>
                      <span>{followUp.reason}</span>
                    </div>
                    {followUp.notes && (
                      <div>
                        <span className="font-semibold">Notes: </span>
                        <span>{followUp.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {!readOnly && !isCreating && !isEditing && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setIsCreating(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Follow-up
                </Button>
              )}
            </div>
          )}

          {(isCreating || isEditing) && !readOnly && (
            <div className="border rounded-md p-4 space-y-4">
              <h3 className="text-sm font-medium">
                {isEditing ? "Edit Follow-up" : "Schedule Follow-up"}
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="date">
                    Scheduled Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !formData.scheduledDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.scheduledDate ? (
                          format(new Date(formData.scheduledDate), "PPP")
                        ) : (
                          <span>Select date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.scheduledDate ? new Date(formData.scheduledDate) : undefined}
                        onSelect={(date) => 
                          handleInputChange('scheduledDate', date ? format(date, 'yyyy-MM-dd') : '')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="reason">
                    Reason
                  </Label>
                  <Select
                    value={formData.reason}
                    onValueChange={(value) => handleInputChange('reason', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select reason for follow-up" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Check-up">Check-up</SelectItem>
                      <SelectItem value="Treatment Continuation">Treatment Continuation</SelectItem>
                      <SelectItem value="Post-op Review">Post-op Review</SelectItem>
                      <SelectItem value="Cleaning">Cleaning</SelectItem>
                      <SelectItem value="Crown Placement">Crown Placement</SelectItem>
                      <SelectItem value="Filling">Filling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isEditing && (
                  <div>
                    <Label htmlFor="status">
                      Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                        <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">
                    Additional Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any specific instructions or notes"
                    className="mt-1"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                  >
                    {isEditing ? "Update" : "Schedule"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}