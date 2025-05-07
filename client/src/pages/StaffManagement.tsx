import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertStaffSchema } from "@shared/schema";
import Layout from "@/components/Layout";
import AttendanceTable from "@/components/AttendanceTable";
import SalaryForm from "@/components/SalaryForm";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useStaff } from "@/hooks/useStaff";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  UserPlus,
  UserCog,
  Calendar,
  DollarSign,
  Search,
  Edit,
  Trash2,
  ChevronsUpDown,
  Check,
} from "lucide-react";

// Extend the staff schema for the form
const staffFormSchema = insertStaffSchema.extend({
  joinDate: z.string().min(1, "Join date is required"),
  salary: z.coerce.number().min(0, "Salary must be a positive number"),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

export default function StaffManagement() {
  const { toast } = useToast();
  const { addAttendance } = useStaff();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [currentTab, setCurrentTab] = useState("staff");
  const [showAttendance, setShowAttendance] = useState(false);
  const [showSalary, setShowSalary] = useState(false);

  // Fetch all staff
  const { data: staffMembers, isLoading: isLoadingStaff } = useQuery({
    queryKey: ["/api/staff"],
  });

  // Form for staff
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: "",
      role: "",
      contactInfo: "",
      address: "",
      joinDate: format(new Date(), "yyyy-MM-dd"),
      salary: 0,
      isActive: true,
    },
  });

  // Create/Update staff mutation
  const staffMutation = useMutation({
    mutationFn: async (values: StaffFormValues) => {
      if (selectedStaff) {
        // Update existing staff
        return apiRequest("PUT", `/api/staff/${selectedStaff.id}`, values);
      } else {
        // Create new staff
        return apiRequest("POST", "/api/staff", values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setIsDialogOpen(false);
      setSelectedStaff(null);
      toast({
        title: "Success",
        description: selectedStaff ? "Staff updated successfully" : "Staff added successfully",
      });
    },
    onError: (error) => {
      console.error("Error saving staff:", error);
      toast({
        title: "Error",
        description: "Failed to save staff information",
        variant: "destructive",
      });
    },
  });

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/staff/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "Success",
        description: "Staff deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting staff:", error);
      toast({
        title: "Error",
        description: "Failed to delete staff",
        variant: "destructive",
      });
    },
  });

  const handleCreateStaff = () => {
    form.reset({
      name: "",
      role: "",
      contactInfo: "",
      address: "",
      joinDate: format(new Date(), "yyyy-MM-dd"),
      salary: 0,
      isActive: true,
    });
    setSelectedStaff(null);
    setIsDialogOpen(true);
  };

  const handleEditStaff = (staff: any) => {
    form.reset({
      ...staff,
      joinDate: staff.joinDate || format(new Date(), "yyyy-MM-dd"),
    });
    setSelectedStaff(staff);
    setIsDialogOpen(true);
  };

  const handleDeleteStaff = (id: number) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      deleteStaffMutation.mutate(id);
    }
  };

  const onStaffSubmit = (values: StaffFormValues) => {
    staffMutation.mutate(values);
  };

  const handleViewAttendance = (staff: any) => {
    setSelectedStaff(staff);
    setShowAttendance(true);
  };

  const handleManageSalary = (staff: any) => {
    setSelectedStaff(staff);
    setShowSalary(true);
  };

  // Filter staff based on search query
  const filteredStaff = staffMembers
    ? staffMembers.filter((staff: any) => {
        const query = searchQuery.toLowerCase();
        return (
          staff.name.toLowerCase().includes(query) ||
          staff.role.toLowerCase().includes(query) ||
          staff.contactInfo.toLowerCase().includes(query)
        );
      })
    : [];

  return (
    <Layout title="Staff Management" showBackButton={true} backTo="/dashboard">
      <Tabs defaultValue="staff" value={currentTab} onValueChange={setCurrentTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="staff" className="flex gap-2 items-center">
              <UserCog className="h-4 w-4" />
              Staff List
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex gap-2 items-center">
              <Calendar className="h-4 w-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="salary" className="flex gap-2 items-center">
              <DollarSign className="h-4 w-4" />
              Salary
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
              <Input
                type="search"
                placeholder="Search staff..."
                className="pl-8 w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={handleCreateStaff}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </div>
        </div>

        <TabsContent value="staff" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Staff Directory</CardTitle>
              <CardDescription>
                Manage clinic staff details and roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStaff ? (
                <div className="flex justify-center py-10">
                  <p>Loading staff data...</p>
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-neutral-600 mb-4">No staff members found</p>
                  <Button onClick={handleCreateStaff}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Staff Member
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Join Date</TableHead>
                        <TableHead className="text-right">Salary</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStaff.map((staff: any) => (
                        <TableRow key={staff.id}>
                          <TableCell className="font-medium">{staff.name}</TableCell>
                          <TableCell>{staff.role}</TableCell>
                          <TableCell>{staff.contactInfo}</TableCell>
                          <TableCell>{staff.joinDate}</TableCell>
                          <TableCell className="text-right">₹{staff.salary.toLocaleString()}</TableCell>
                          <TableCell>
                            {staff.isActive ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewAttendance(staff)}
                              >
                                <Calendar className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleManageSalary(staff)}
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditStaff(staff)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteStaff(staff.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Staff Attendance</CardTitle>
              <CardDescription>
                Track and manage staff attendance records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStaff ? (
                <div className="flex justify-center py-10">
                  <p>Loading staff data...</p>
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-neutral-600 mb-4">No staff members found</p>
                  <Button onClick={handleCreateStaff}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Staff Member
                  </Button>
                </div>
              ) : (
                <AttendanceTable staffMembers={filteredStaff} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Salary Management</CardTitle>
              <CardDescription>
                Process and track staff salaries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStaff ? (
                <div className="flex justify-center py-10">
                  <p>Loading staff data...</p>
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-neutral-600 mb-4">No staff members found</p>
                  <Button onClick={handleCreateStaff}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Staff Member
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Base Salary</TableHead>
                        <TableHead className="text-center">Last Payment</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStaff.map((staff: any) => (
                        <TableRow key={staff.id}>
                          <TableCell className="font-medium">{staff.name}</TableCell>
                          <TableCell>{staff.role}</TableCell>
                          <TableCell className="text-right">₹{staff.salary.toLocaleString()}</TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleManageSalary(staff)}
                            >
                              Process Salary
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for creating/editing staff */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedStaff ? "Edit Staff Member" : "Add Staff Member"}
            </DialogTitle>
            <DialogDescription>
              {selectedStaff
                ? "Update the details of the staff member"
                : "Add a new staff member to your clinic"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onStaffSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter full name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Role */}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dentist">Dentist</SelectItem>
                          <SelectItem value="assistant">Dental Assistant</SelectItem>
                          <SelectItem value="hygienist">Dental Hygienist</SelectItem>
                          <SelectItem value="receptionist">Receptionist</SelectItem>
                          <SelectItem value="lab_technician">Lab Technician</SelectItem>
                          <SelectItem value="administrator">Administrator</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contact Info */}
                <FormField
                  control={form.control}
                  name="contactInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Information</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Phone number or email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Join Date */}
                <FormField
                  control={form.control}
                  name="joinDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Join Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Salary */}
                <FormField
                  control={form.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Salary (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Is Active */}
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "true")}
                        defaultValue={field.value ? "true" : "false"}
                        value={field.value ? "true" : "false"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={staffMutation.isPending}>
                  {staffMutation.isPending
                    ? "Saving..."
                    : selectedStaff
                    ? "Update Staff"
                    : "Add Staff"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Attendance Dialog */}
      <Dialog open={showAttendance} onOpenChange={setShowAttendance}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Attendance Record: {selectedStaff?.name}</DialogTitle>
            <DialogDescription>
              View and manage attendance for this staff member
            </DialogDescription>
          </DialogHeader>
          
          {selectedStaff && (
            <AttendanceTable staffMembers={[selectedStaff]} singleStaffView />
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowAttendance(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Salary Dialog */}
      <Dialog open={showSalary} onOpenChange={setShowSalary}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Salary Management: {selectedStaff?.name}</DialogTitle>
            <DialogDescription>
              Process and track salary payments
            </DialogDescription>
          </DialogHeader>
          
          {selectedStaff && (
            <SalaryForm staff={selectedStaff} onComplete={() => setShowSalary(false)} />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
