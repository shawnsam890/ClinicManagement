import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckSquare,
  XSquare,
  Edit,
  Save,
  X,
} from "lucide-react";

interface AttendanceTableProps {
  staffMembers: any[];
  singleStaffView?: boolean;
}

export default function AttendanceTable({ staffMembers, singleStaffView = false }: AttendanceTableProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
  const [editingAttendance, setEditingAttendance] = useState<{
    staffId: number;
    date: string;
    data: any;
  } | null>(null);
  const [remarks, setRemarks] = useState("");

  // Reset selected staff when staff members change
  useEffect(() => {
    if (staffMembers.length > 0) {
      if (singleStaffView) {
        setSelectedStaff(staffMembers[0].id);
      } else {
        setSelectedStaff(null);
      }
    }
  }, [staffMembers, singleStaffView]);

  // Calculate date range for the month
  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

  // Get attendance data for selected staff
  const { data: staffAttendance, isLoading: isLoadingAttendance } = useQuery({
    queryKey: [
      `/api/staff/${selectedStaff}/attendance`,
      format(currentDate, "yyyy-MM"),
    ],
    enabled: !!selectedStaff,
  });

  // Mutation for marking attendance
  const markAttendanceMutation = useMutation({
    mutationFn: async ({
      staffId,
      date,
      present,
      remarks,
    }: {
      staffId: number;
      date: string;
      present: boolean;
      remarks?: string;
    }) => {
      return apiRequest("POST", "/api/attendance", {
        staffId,
        date,
        present,
        remarks: remarks || "",
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/staff/${variables.staffId}/attendance`],
      });
      toast({
        title: "Success",
        description: "Attendance recorded successfully",
      });
    },
    onError: (error) => {
      console.error("Error marking attendance:", error);
      toast({
        title: "Error",
        description: "Failed to record attendance",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating attendance
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({
      id,
      staffId,
      present,
      remarks,
    }: {
      id: number;
      staffId: number;
      present: boolean;
      remarks?: string;
    }) => {
      return apiRequest("PUT", `/api/attendance/${id}`, {
        staffId,
        present,
        remarks,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/staff/${variables.staffId}/attendance`],
      });
      setEditingAttendance(null);
      toast({
        title: "Success",
        description: "Attendance updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating attendance:", error);
      toast({
        title: "Error",
        description: "Failed to update attendance",
        variant: "destructive",
      });
    },
  });

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleMarkAttendance = (staffId: number, date: string, present: boolean) => {
    markAttendanceMutation.mutate({
      staffId,
      date,
      present,
      remarks: "",
    });
  };

  const handleEditAttendance = (staffId: number, date: string, data: any) => {
    setEditingAttendance({ staffId, date, data });
    setRemarks(data.remarks || "");
  };

  const handleUpdateAttendance = () => {
    if (!editingAttendance) return;

    updateAttendanceMutation.mutate({
      id: editingAttendance.data.id,
      staffId: editingAttendance.staffId,
      present: editingAttendance.data.present,
      remarks,
    });
  };

  const cancelEdit = () => {
    setEditingAttendance(null);
    setRemarks("");
  };

  const toggleAttendanceStatus = () => {
    if (!editingAttendance) return;

    setEditingAttendance({
      ...editingAttendance,
      data: {
        ...editingAttendance.data,
        present: !editingAttendance.data.present,
      },
    });
  };

  const getAttendanceForDay = (staffId: number, date: string) => {
    if (!staffAttendance || !Array.isArray(staffAttendance)) return null;
    
    return staffAttendance.find(
      (a: any) => a.staffId === staffId && a.date === date
    );
  };

  const renderAttendanceMarker = (staffId: number, date: string) => {
    const attendance = getAttendanceForDay(staffId, date);
    const formattedDate = format(new Date(date), "yyyy-MM-dd");
    const isEditing =
      editingAttendance?.staffId === staffId &&
      editingAttendance?.date === formattedDate;

    if (isEditing) {
      return (
        <div className="flex flex-col items-center">
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full w-8 h-8 p-0 ${
              editingAttendance.data.present
                ? "bg-green-100 text-green-600 hover:bg-green-200"
                : "bg-red-100 text-red-600 hover:bg-red-200"
            }`}
            onClick={toggleAttendanceStatus}
          >
            {editingAttendance.data.present ? (
              <CheckSquare className="h-5 w-5" />
            ) : (
              <XSquare className="h-5 w-5" />
            )}
          </Button>
          {attendance?.remarks && !singleStaffView && (
            <span className="text-xs text-neutral-500 mt-1">Note</span>
          )}
        </div>
      );
    }

    if (attendance) {
      return (
        <div className="flex flex-col items-center">
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full w-8 h-8 p-0 ${
              attendance.present
                ? "bg-green-100 text-green-600 hover:bg-green-200"
                : "bg-red-100 text-red-600 hover:bg-red-200"
            }`}
            onClick={() => handleEditAttendance(staffId, formattedDate, attendance)}
          >
            {attendance.present ? (
              <CheckSquare className="h-5 w-5" />
            ) : (
              <XSquare className="h-5 w-5" />
            )}
          </Button>
          {attendance.remarks && !singleStaffView && (
            <span className="text-xs text-neutral-500 mt-1">Note</span>
          )}
        </div>
      );
    }

    return (
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full w-8 h-8 p-0 hover:bg-green-100 hover:text-green-600"
          onClick={() => handleMarkAttendance(staffId, formattedDate, true)}
        >
          <CheckSquare className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full w-8 h-8 p-0 hover:bg-red-100 hover:text-red-600"
          onClick={() => handleMarkAttendance(staffId, formattedDate, false)}
        >
          <XSquare className="h-5 w-5" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateMonth("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="font-medium">
              {format(currentDate, "MMMM yyyy")}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateMonth("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {!singleStaffView && staffMembers.length > 0 && (
          <Select
            value={selectedStaff ? selectedStaff.toString() : "none"}
            onValueChange={(value) => setSelectedStaff(value === "none" ? null : parseInt(value))}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select staff member to view attendance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">All Staff</SelectItem>
              {staffMembers.map((staff) => (
                <SelectItem key={staff.id} value={staff.id.toString()}>
                  {staff.name} - {staff.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Attendance edit form */}
      {editingAttendance && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">
                  Edit Attendance: {format(new Date(editingAttendance.date), "dd MMM, yyyy")}
                </h3>
                <p className="text-sm text-neutral-500">
                  {staffMembers.find((s) => s.id === editingAttendance.staffId)?.name}
                </p>
              </div>
              <Badge variant="outline" className={editingAttendance.data.present ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                {editingAttendance.data.present ? "Present" : "Absent"}
              </Badge>
            </div>
            
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add remarks or notes (optional)"
                  className="h-20"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={cancelEdit}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateAttendance}
                  disabled={updateAttendanceMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateAttendanceMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-sm rounded-lg">
          <thead>
            <tr>
              {!selectedStaff && <th className="py-2 px-3 bg-neutral-50 text-left font-medium text-neutral-700 border-b">Staff</th>}
              {daysInMonth.map((day) => (
                <th
                  key={day.toISOString()}
                  className={`py-2 px-3 text-center font-medium text-sm border-b ${
                    isToday(day) ? "bg-blue-50" : "bg-neutral-50"
                  } ${day.getDay() === 0 || day.getDay() === 6 ? "text-red-500" : "text-neutral-700"}`}
                >
                  <div>{format(day, "d")}</div>
                  <div className="text-xs">{format(day, "E")}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {selectedStaff ? (
              // Single staff view
              <tr>
                {daysInMonth.map((day) => (
                  <td
                    key={day.toISOString()}
                    className={`py-3 px-2 text-center border-b ${
                      isToday(day) ? "bg-blue-50" : ""
                    }`}
                  >
                    {renderAttendanceMarker(selectedStaff, format(day, "yyyy-MM-dd"))}
                  </td>
                ))}
              </tr>
            ) : (
              // All staff view
              staffMembers.map((staff) => (
                <tr key={staff.id}>
                  <td className="py-3 px-3 border-b">
                    <div className="font-medium">{staff.name}</div>
                    <div className="text-xs text-neutral-500">{staff.role}</div>
                  </td>
                  {daysInMonth.map((day) => (
                    <td
                      key={`${staff.id}-${day.toISOString()}`}
                      className={`py-3 px-2 text-center border-b ${
                        isToday(day) ? "bg-blue-50" : ""
                      }`}
                    >
                      {renderAttendanceMarker(staff.id, format(day, "yyyy-MM-dd"))}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Display remarks for single staff view */}
      {singleStaffView && selectedStaff && staffAttendance && staffAttendance.some((a: any) => a.remarks) && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Remarks</h3>
          <div className="space-y-2">
            {staffAttendance
              .filter((a: any) => a.remarks)
              .map((attendance: any) => (
                <div key={attendance.id} className="flex items-start bg-neutral-50 p-3 rounded-md">
                  <div className="mr-3">
                    <Badge variant="outline" className={attendance.present ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                      {attendance.present ? "Present" : "Absent"}
                    </Badge>
                  </div>
                  <div>
                    <div className="font-medium">{format(new Date(attendance.date), "dd MMM, yyyy")}</div>
                    <div className="text-sm text-neutral-600 mt-1">{attendance.remarks}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => handleEditAttendance(selectedStaff, attendance.date, attendance)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
