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
import { useLabWorks } from "@/hooks/useLabWorks";

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
  id: number;
  settingKey: string;
  settingValue: {
    labTechnicians: string[];
    crownShades?: string[];
    workTypes: string[];
    [key: string]: any;
  };
  category: string;
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
  FormDescription,
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
  
  // Debug output - will show in the console
  console.log("Patient ID from URL:", patientIdFromUrl);

  // Use the custom hook that automatically handles patient-specific lab works
  // Pass the patientId directly - the hook will handle null/undefined cases
  const { 
    labWorks = [], 
    isLoadingLabWorks 
  } = useLabWorks(patientIdFromUrl);

  // Fetch all patients for the dropdown
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Fetch lab inventory
  const { data: inventory = [], isLoading: isLoadingInventory } = useQuery<InventoryItem[]>({
    queryKey: ["/api/lab-inventory"],
  });

  // Fetch dropdown options from settings
  const { data: dropdownOptions } = useQuery<DropdownOptions>({
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
  
  // Watch for changes to work type and technician for dynamic lab cost lookup
  const workType = form.watch("workType");
  const technician = form.watch("technician");
  
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
    // Find the lab cost from settings based on technician and workType
    const labCost = findLabCostFromSettings(values.technician, values.workType);
    
    // Calculate total costs based on per-unit costs and number of units
    const totalLabCost = labCost && values.units ? labCost * values.units : null;
    const totalClinicCost = values.clinicCost && values.units ? values.clinicCost * values.units : null;
    
    // Update the values with calculated totals and lab cost from settings
    const updatedValues = {
      ...values,
      labCost,
      totalLabCost,
      totalClinicCost
    };
    
    labWorkMutation.mutate(updatedValues);
  };
  
  // Fetch the lab cost based on work type and technician
  const { data: labWorkCost, isLoading: isLabCostLoading } = useQuery<any>({
    queryKey: ["/api/lab-work-costs/lookup", workType, technician],
    queryFn: async () => {
      if (!workType || !technician) return null;
      const response = await fetch(`/api/lab-work-costs/lookup?workType=${encodeURIComponent(workType)}&labTechnician=${encodeURIComponent(technician)}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No cost found for this combination
        }
        throw new Error('Failed to fetch lab work cost');
      }
      return response.json();
    },
    enabled: !!workType && !!technician,
  });
  
  // Function to find lab cost from settings based on technician and work type
  // This function now uses our API-based data and falls back to the local data if needed
  const findLabCostFromSettings = (technician: string | null, workType: string): number | null => {
    if (!technician || !workType) return null;
    
    // First try to use the data from our specialized hook
    if (labWorkCost && !isLabCostLoading) {
      return labWorkCost.cost;
    }
    
    // Fall back to the old method of finding in the full list
    const matchingCost = labCosts.find(cost => 
      cost.labTechnician === technician && 
      cost.workType === workType
    );
    
    return matchingCost ? matchingCost.cost : null;
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

  // Filter lab works based on search query, status filter, and patient ID
  console.log('Filtering lab works. Initial count:', labWorks?.length);
  console.log('Patient ID from URL for filtering:', patientIdFromUrl);

  const filteredLabWorks = labWorks.filter((work: any) => {
    // First check: If we have a patient ID from URL, only show lab works for that patient
    if (patientIdFromUrl && work.patientId !== patientIdFromUrl) {
      return false;
    }
    
    // Second check: Apply search filter
    const matchesSearch =
      work.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      work.workType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (work.technician && work.technician.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Third check: Apply status filter
    const matchesStatus = statusFilter === "all" || work.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  console.log('After filtering. Final count:', filteredLabWorks.length);
  
  // Extra logging to see if our patient filter is working
  if (patientIdFromUrl) {
    console.log('Lab works for patient ' + patientIdFromUrl + ':', 
      filteredLabWorks.map(work => work.id + ' - ' + work.patientId));
  }

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
    <Layout 
      title="Lab Management" 
      showBackButton={true} 
      backTo={patientIdFromUrl ? `/patients/${patientIdFromUrl}` : "/dashboard"}
    >
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
              <CardTitle>
                {patientIdFromUrl ? "Patient Lab Works" : "All Lab Works"}
              </CardTitle>
              <CardDescription>
                {patientIdFromUrl 
                  ? `Viewing lab orders for patient ID: ${patientIdFromUrl}`
                  : "Manage dental laboratory work orders and track their progress"}
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
                        <TableHead>Technician</TableHead>
                        <TableHead className="text-center">Units</TableHead>
                        <TableHead>Shade</TableHead>
                        <TableHead className="text-right">Due Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLabWorks.map((work: any) => {
                        // Calculate lab cost from settings if not already stored
                        const labCost = work.labCost || findLabCostFromSettings(work.technician, work.workType);
                        const totalLabCost = labCost && work.units ? labCost * work.units : null;
                        const totalClinicCost = work.totalClinicCost || (work.clinicCost && work.units ? work.clinicCost * work.units : null);
                        
                        // Calculate profit (clinic cost - lab cost)
                        const profit = totalClinicCost !== null && totalLabCost !== null 
                          ? totalClinicCost - totalLabCost 
                          : null;
                          
                        return (
                          <TableRow key={work.id}>
                            <TableCell>{work.patientId}</TableCell>
                            <TableCell>{work.workType}</TableCell>
                            <TableCell>{getStatusBadge(work.status)}</TableCell>
                            <TableCell>{work.technician || "-"}</TableCell>
                            <TableCell className="text-center">{work.units || 1}</TableCell>
                            <TableCell>{work.workType === "crown" && work.shade ? work.shade : "-"}</TableCell>
                            <TableCell className="text-right">{work.dueDate}</TableCell>
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
                        );
                      })}
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
                            <SelectItem value="PFM Ceramic crown">PFM Ceramic crown</SelectItem>
                            <SelectItem value="Metal Crown">Metal Crown</SelectItem>
                            <SelectItem value="bridge">Bridge</SelectItem>
                            <SelectItem value="denture">Denture</SelectItem>
                            <SelectItem value="implant">Implant</SelectItem>
                            <SelectItem value="veneer">Veneer</SelectItem>
                            <SelectItem value="retainer">Retainer</SelectItem>
                            <SelectItem value="night_guard">Night Guard</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
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
                            <SelectItem value="Nirmal">Nirmal</SelectItem>
                            <SelectItem value="Ace Dental Lab">Ace Dental Lab</SelectItem>
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
                              <SelectItem value="A1">A1</SelectItem>
                              <SelectItem value="A2">A2</SelectItem>
                              <SelectItem value="A3">A3</SelectItem>
                              <SelectItem value="A3.5">A3.5</SelectItem>
                              <SelectItem value="A4">A4</SelectItem>
                              <SelectItem value="B1">B1</SelectItem>
                              <SelectItem value="B2">B2</SelectItem>
                              <SelectItem value="B3">B3</SelectItem>
                              <SelectItem value="B4">B4</SelectItem>
                              <SelectItem value="C1">C1</SelectItem>
                              <SelectItem value="C2">C2</SelectItem>
                              <SelectItem value="C3">C3</SelectItem>
                              <SelectItem value="C4">C4</SelectItem>
                              <SelectItem value="D2">D2</SelectItem>
                              <SelectItem value="D3">D3</SelectItem>
                              <SelectItem value="D4">D4</SelectItem>
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

                  {/* Units (for all lab works) */}
                  <FormField
                    control={form.control}
                    name="units"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Units</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            step="1"
                            {...field}
                            value={field.value === null || isNaN(field.value) ? '1' : field.value.toString()}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 1 : parseInt(e.target.value);
                              field.onChange(isNaN(value) ? 1 : value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of units (e.g., 2 crowns)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Lab Cost from Settings */}
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <div className="font-medium">Lab Cost (from Settings)</div>
                      <div className="text-right font-semibold">
                        {(() => {
                          const workType = form.watch("workType");
                          const technician = form.watch("technician");
                          const labCost = findLabCostFromSettings(technician, workType);
                          return labCost !== null ? `₹${labCost.toLocaleString()} per unit` : "Not set";
                        })()}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      This cost is configured in the Settings page and is used to calculate the profit.
                    </div>
                  </div>
                  
                  {/* Clinic Cost (per unit) */}
                  <FormField
                    control={form.control}
                    name="clinicCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clinic Cost (₹ per unit)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            {...field}
                            value={field.value === null || isNaN(field.value) ? '' : field.value.toString()}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? null : value);
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

                {/* Total Cost & Profit Preview */}
                <div className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-900 mb-4">
                  <h3 className="text-lg font-semibold">Cost Summary</h3>
                  
                  {(() => {
                    const units = form.watch("units") || 1;
                    const clinicCost = form.watch("clinicCost") || 0;
                    const workType = form.watch("workType");
                    const technician = form.watch("technician");
                    const labCost = findLabCostFromSettings(technician, workType) || 0;
                    
                    const totalLabCost = labCost * units;
                    const totalClinicCost = clinicCost * units;
                    const profit = totalClinicCost - totalLabCost;
                    
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Lab Cost per Unit:</span>
                          <span>₹{labCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Clinic Cost per Unit:</span>
                          <span>₹{clinicCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Units:</span>
                          <span>{units}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Lab Cost:</span>
                          <span>₹{totalLabCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Clinic Cost:</span>
                          <span>₹{totalClinicCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-2">
                          <span>Expected Profit:</span>
                          <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                            ₹{profit.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

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
