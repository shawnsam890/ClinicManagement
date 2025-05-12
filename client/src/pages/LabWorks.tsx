import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertLabWorkSchema } from "@shared/schema";
import Layout from "@/components/Layout";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Define types for better TypeScript support
type LabWork = {
  id: number;
  patientId: string;
  workType: string;
  status: string;
  description: string;
  startDate: string;
  dueDate: string;
  completedDate: string | null;
  technician: string | null;
  shade: string | null;
  units: number;
  labCost: number | null;
  clinicCost: number | null;
  totalLabCost: number | null;
  totalClinicCost: number | null;
  paymentStatus: string;
  paymentDate: string | null;
  notes: string | null;
};

type Patient = {
  id: number;
  patientId: string;
  name: string;
};

type InventoryItem = {
  id: number;
  itemName: string;
  quantity: number;
  threshold: number | null;
  unitCost: number;
  supplier: string | null;
  lastRestock: string | null;
};

type DropdownOptions = {
  settingValue: {
    labTechnicians?: string[];
    crownShades?: string[];
    workTypes?: string[];
  };
};

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import {
  Plus,
  Filter,
  Search,
  FlaskRound,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
} from "lucide-react";

// Modify the lab work schema for the form
const labWorkFormSchema = insertLabWorkSchema.extend({
  startDate: z.string().min(1, "Start date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  completedDate: z.string().nullable().optional(),
  shade: z.string().optional(),
  units: z.coerce.number().min(1, "Units must be at least 1"),
  labName: z.string().optional(),
  labCost: z.coerce.number().min(0, "Lab cost must be a positive number").optional().nullable(),
  clinicCost: z.coerce.number().min(0, "Clinic cost must be a positive number").optional().nullable(),
  totalLabCost: z.coerce.number().min(0).optional().nullable(),
  totalClinicCost: z.coerce.number().min(0).optional().nullable(),
  paymentStatus: z.string().default("pending"),
  paymentDate: z.string().nullable().optional(),
});

type LabWorkFormValues = z.infer<typeof labWorkFormSchema>;

export default function LabWorks() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLabWork, setSelectedLabWork] = useState<any | null>(null);
  const [currentTab, setCurrentTab] = useState("works");
  
  // Get patientId from URL query parameter if it exists
  const [location] = useLocation();
  // Extract query params from location
  const queryParamsStr = location.split('?')[1] || '';
  const searchParams = new URLSearchParams(queryParamsStr);
  const patientIdFromUrl = searchParams.get('patientId');

  // Fetch all lab works
  const { data: labWorks = [], isLoading: isLoadingLabWorks } = useQuery<LabWork[]>({
    queryKey: ["/api/lab-works"],
  });

  // Fetch all patients for the dropdown
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Fetch lab inventory
  const { data: inventory = [], isLoading: isLoadingInventory } = useQuery<InventoryItem[]>({
    queryKey: ["/api/lab-inventory"],
  });

  // Fetch dropdown options from settings
  const { data: dropdownOptions = { settingValue: {} } } = useQuery<DropdownOptions>({
    queryKey: ["/api/settings/key/dropdown_options"],
  });

  // Query to fetch lab costs
  const { data: labCosts = [] } = useQuery<any[]>({
    queryKey: ["/api/lab-work-costs"],
  });

  // Form for lab work
  const form = useForm<LabWorkFormValues>({
    resolver: zodResolver(labWorkFormSchema),
    defaultValues: {
      patientId: patientIdFromUrl || "",
      workType: "",
      status: "pending",
      description: "",
      startDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      completedDate: null,
      technician: "",
      shade: "",
      units: 1,
      labName: "",
      labCost: null,
      clinicCost: null,
      totalLabCost: null,
      totalClinicCost: null,
      paymentStatus: "pending",
      paymentDate: null,
      notes: "",
    },
  });
  
  // Ensure the patient from URL is properly selected in the form
  useEffect(() => {
    if (patientIdFromUrl && form.getValues("patientId") !== patientIdFromUrl) {
      form.setValue("patientId", patientIdFromUrl);
    }
  }, [patientIdFromUrl, form]);
  
  // Define the handleCreateLabWork function before it's used in useEffect
  const handleCreateLabWork = () => {
    form.reset({
      patientId: patientIdFromUrl || "",
      workType: "",
      status: "pending",
      description: "",
      startDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      completedDate: null,
      technician: "",
      shade: "",
      units: 1,
      labName: "",
      labCost: null,
      clinicCost: null,
      totalLabCost: null,
      totalClinicCost: null,
      paymentStatus: "pending",
      paymentDate: null,
      notes: "",
    });
    setSelectedLabWork(null);
    setIsDialogOpen(true);
  };

  // If patientId is provided in the URL, automatically open the dialog to create a new lab work
  useEffect(() => {
    if (patientIdFromUrl) {
      setCurrentTab("works");
      handleCreateLabWork();
    }
  }, [patientIdFromUrl]);

  // Form for inventory item
  const inventoryForm = useForm({
    resolver: zodResolver(
      z.object({
        itemName: z.string().min(1, "Item name is required"),
        quantity: z.coerce.number().min(0, "Quantity must be a positive number"),
        threshold: z.coerce.number().min(0, "Threshold must be a positive number").optional(),
        unitCost: z.coerce.number().min(0, "Unit cost must be a positive number"),
        supplier: z.string().optional(),
        lastRestock: z.string().optional(),
      })
    ),
    defaultValues: {
      itemName: "",
      quantity: 0,
      threshold: 10,
      unitCost: 0,
      supplier: "",
      lastRestock: new Date().toISOString().split("T")[0],
    },
  });

  // Create/Update lab work mutation
  const labWorkMutation = useMutation({
    mutationFn: async (values: LabWorkFormValues) => {
      if (selectedLabWork) {
        // Update existing lab work
        return apiRequest("PUT", `/api/lab-works/${selectedLabWork.id}`, values);
      } else {
        // Create new lab work
        return apiRequest("POST", "/api/lab-works", values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lab-works"] });
      setIsDialogOpen(false);
      setSelectedLabWork(null);
      toast({
        title: "Success",
        description: selectedLabWork ? "Lab work updated successfully" : "Lab work created successfully",
      });
    },
    onError: (error) => {
      console.error("Error saving lab work:", error);
      toast({
        title: "Error",
        description: "Failed to save lab work",
        variant: "destructive",
      });
    },
  });

  // Create/Update inventory item mutation
  const inventoryMutation = useMutation({
    mutationFn: async (values: any) => {
      if (selectedLabWork) {
        // Update existing inventory item
        return apiRequest("PUT", `/api/lab-inventory/${selectedLabWork.id}`, values);
      } else {
        // Create new inventory item
        return apiRequest("POST", "/api/lab-inventory", values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lab-inventory"] });
      setIsDialogOpen(false);
      setSelectedLabWork(null);
      toast({
        title: "Success",
        description: selectedLabWork ? "Inventory item updated successfully" : "Inventory item added successfully",
      });
    },
    onError: (error) => {
      console.error("Error saving inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to save inventory item",
        variant: "destructive",
      });
    },
  });

  // Delete lab work mutation
  const deleteLabWorkMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/lab-works/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lab-works"] });
      toast({
        title: "Success",
        description: "Lab work deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting lab work:", error);
      toast({
        title: "Error",
        description: "Failed to delete lab work",
        variant: "destructive",
      });
    },
  });

  // Delete inventory item mutation
  const deleteInventoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/lab-inventory/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lab-inventory"] });
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      });
    },
  });


  const handleEditLabWork = (labWork: any) => {
    form.reset({
      ...labWork,
      completedDate: labWork.completedDate || null,
    });
    setSelectedLabWork(labWork);
    setIsDialogOpen(true);
  };

  const handleCreateInventoryItem = () => {
    inventoryForm.reset({
      itemName: "",
      quantity: 0,
      threshold: 10,
      unitCost: 0,
      supplier: "",
      lastRestock: new Date().toISOString().split("T")[0],
    });
    setSelectedLabWork(null);
    setIsDialogOpen(true);
  };

  const handleEditInventoryItem = (item: any) => {
    inventoryForm.reset({
      ...item,
      lastRestock: item.lastRestock || new Date().toISOString().split("T")[0],
    });
    setSelectedLabWork(item);
    setIsDialogOpen(true);
  };

  const onLabWorkSubmit = (values: LabWorkFormValues) => {
    labWorkMutation.mutate(values);
  };

  const onInventorySubmit = (values: any) => {
    inventoryMutation.mutate(values);
  };

  const handleDeleteLabWork = (id: number) => {
    if (confirm("Are you sure you want to delete this lab work?")) {
      deleteLabWorkMutation.mutate(id);
    }
  };

  const handleDeleteInventoryItem = (id: number) => {
    if (confirm("Are you sure you want to delete this inventory item?")) {
      deleteInventoryMutation.mutate(id);
    }
  };

  // Filter lab works based on search query and status filter
  const filteredLabWorks = labWorks.filter((work: any) => {
    const matchesSearch =
      work.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      work.workType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (work.technician && work.technician.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || work.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter inventory based on search query
  const filteredInventory = inventory.filter((item: any) =>
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Layout title="Lab Management" showBackButton={true} backTo="/dashboard">
      <Tabs defaultValue="works" value={currentTab} onValueChange={setCurrentTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="works" className="flex gap-2 items-center">
              <FlaskRound className="h-4 w-4" />
              Lab Works
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex gap-2 items-center">
              <CheckCircle2 className="h-4 w-4" />
              Inventory
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8 w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {currentTab === "works" && (
              <div className="relative">
                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="pl-8 w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={currentTab === "works" ? handleCreateLabWork : handleCreateInventoryItem}>
              <Plus className="mr-2 h-4 w-4" />
              {currentTab === "works" ? "New Lab Work" : "Add Item"}
            </Button>
          </div>
        </div>

        <TabsContent value="works" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Lab Works</CardTitle>
              <CardDescription>
                Manage dental laboratory work orders and track their progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLabWorks ? (
                <div className="flex justify-center py-10">
                  <p>Loading lab works...</p>
                </div>
              ) : filteredLabWorks.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-neutral-600 mb-4">No lab works found</p>
                  <Button onClick={handleCreateLabWork}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Lab Work
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient ID</TableHead>
                        <TableHead>Work Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Technician</TableHead>
                        <TableHead>Shade</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLabWorks.map((work: any) => (
                        <TableRow key={work.id}>
                          <TableCell>{work.patientId}</TableCell>
                          <TableCell>{work.workType}</TableCell>
                          <TableCell>{getStatusBadge(work.status)}</TableCell>
                          <TableCell>{work.startDate}</TableCell>
                          <TableCell>{work.dueDate}</TableCell>
                          <TableCell>{work.technician || "-"}</TableCell>
                          <TableCell>{work.workType === "crown" && work.shade ? work.shade : "-"}</TableCell>
                          <TableCell className="text-right">₹{work.cost?.toLocaleString() || "0"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditLabWork(work)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteLabWork(work.id)}
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

        <TabsContent value="inventory" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Lab Inventory</CardTitle>
              <CardDescription>
                Manage dental laboratory supplies and materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingInventory ? (
                <div className="flex justify-center py-10">
                  <p>Loading inventory...</p>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-neutral-600 mb-4">No inventory items found</p>
                  <Button onClick={handleCreateInventoryItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Inventory Item
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Threshold</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Last Restock</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((item: any) => (
                        <TableRow key={item.id} className={item.quantity <= (item.threshold || 0) ? "bg-red-50" : ""}>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{item.threshold || "-"}</TableCell>
                          <TableCell className="text-right">₹{item.unitCost?.toLocaleString() || "0"}</TableCell>
                          <TableCell>{item.supplier || "-"}</TableCell>
                          <TableCell>{item.lastRestock || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditInventoryItem(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteInventoryItem(item.id)}
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
      </Tabs>

      {/* Dialog for Lab Work */}
      {currentTab === "works" && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedLabWork ? "Edit Lab Work" : "Create New Lab Work"}
              </DialogTitle>
              <DialogDescription>
                {selectedLabWork
                  ? "Update the details of the lab work order"
                  : "Fill in the details to create a new lab work order"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onLabWorkSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Patient ID */}
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient ID</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select patient" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {patients.map((patient: any) => (
                              <SelectItem key={patient.id} value={patient.patientId}>
                                {patient.patientId} - {patient.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Work Type */}
                  <FormField
                    control={form.control}
                    name="workType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select work type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(dropdownOptions?.settingValue?.workTypes || []).map((workType: string) => (
                              <SelectItem key={workType} value={workType}>
                                {workType}
                              </SelectItem>
                            )) || (
                              <>
                                <SelectItem value="crown">Crown</SelectItem>
                                <SelectItem value="bridge">Bridge</SelectItem>
                                <SelectItem value="denture">Denture</SelectItem>
                                <SelectItem value="implant">Implant</SelectItem>
                                <SelectItem value="veneer">Veneer</SelectItem>
                                <SelectItem value="retainer">Retainer</SelectItem>
                                <SelectItem value="night_guard">Night Guard</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Technician */}
                  <FormField
                    control={form.control}
                    name="technician"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Technician</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select technician" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(dropdownOptions?.settingValue?.labTechnicians || []).map((technician: string) => (
                              <SelectItem key={technician} value={technician}>
                                {technician}
                              </SelectItem>
                            )) || (
                              <SelectItem value="no-technician" disabled>
                                No technicians found
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Shade (only for crown work) */}
                  {form.watch("workType") === "crown" && (
                    <FormField
                      control={form.control}
                      name="shade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Crown Shade</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select shade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(dropdownOptions?.settingValue?.crownShades || []).map((shade: string) => (
                                <SelectItem key={shade} value={shade}>
                                  {shade}
                                </SelectItem>
                              )) || (
                                <SelectItem value="no-shade" disabled>
                                  No shades found
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Start Date */}
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Due Date */}
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Completed Date */}
                  <FormField
                    control={form.control}
                    name="completedDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Completed Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value || ""}
                            disabled={form.getValues("status") !== "completed"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Cost */}
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            {...field}
                            value={field.value === null || isNaN(field.value) ? '' : field.value.toString()}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={labWorkMutation.isPending}>
                    {labWorkMutation.isPending
                      ? "Saving..."
                      : selectedLabWork
                      ? "Update Lab Work"
                      : "Create Lab Work"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog for Inventory */}
      {currentTab === "inventory" && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedLabWork ? "Edit Inventory Item" : "Add Inventory Item"}
              </DialogTitle>
              <DialogDescription>
                {selectedLabWork
                  ? "Update the details of the inventory item"
                  : "Fill in the details to add a new inventory item"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={inventoryForm.handleSubmit(onInventorySubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Item Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Item Name</label>
                  <Input
                    {...inventoryForm.register("itemName")}
                    placeholder="Enter item name"
                  />
                  {inventoryForm.formState.errors.itemName && (
                    <p className="text-sm text-red-500">
                      {inventoryForm.formState.errors.itemName.message}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    min={0}
                    {...inventoryForm.register("quantity")}
                  />
                  {inventoryForm.formState.errors.quantity && (
                    <p className="text-sm text-red-500">
                      {inventoryForm.formState.errors.quantity.message}
                    </p>
                  )}
                </div>

                {/* Threshold */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Threshold (Low Stock Alert)</label>
                  <Input
                    type="number"
                    min={0}
                    {...inventoryForm.register("threshold")}
                  />
                  {inventoryForm.formState.errors.threshold && (
                    <p className="text-sm text-red-500">
                      {inventoryForm.formState.errors.threshold.message}
                    </p>
                  )}
                </div>

                {/* Unit Cost */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit Cost (₹)</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    {...inventoryForm.register("unitCost")}
                  />
                  {inventoryForm.formState.errors.unitCost && (
                    <p className="text-sm text-red-500">
                      {inventoryForm.formState.errors.unitCost.message}
                    </p>
                  )}
                </div>

                {/* Supplier */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Supplier</label>
                  <Input
                    {...inventoryForm.register("supplier")}
                    placeholder="Enter supplier name"
                  />
                </div>

                {/* Last Restock */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Restock Date</label>
                  <Input
                    type="date"
                    {...inventoryForm.register("lastRestock")}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={inventoryMutation.isPending}>
                  {inventoryMutation.isPending
                    ? "Saving..."
                    : selectedLabWork
                    ? "Update Item"
                    : "Add Item"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
}
