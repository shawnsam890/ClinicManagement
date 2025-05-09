import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useSettings } from "@/hooks/useSettings";
import Layout from "@/components/Layout";
import SignatureCanvas from "react-signature-canvas";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Settings as SettingsIcon,
  User,
  Database,
  PlusCircle,
  Save,
  Trash2,
  X,
  Check,
  Edit,
  Pen,
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const { dropdownOptions, updateDropdownOptions } = useSettings();
  const [activeTab, setActiveTab] = useState("general");
  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [newOptionValue, setNewOptionValue] = useState("");
  const [newOptionCategory, setNewOptionCategory] = useState("medicalHistory");
  const [isAddingOption, setIsAddingOption] = useState(false);
  
  // Signature states
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const [doctorName, setDoctorName] = useState("");
  const [editingSignatureId, setEditingSignatureId] = useState<number | null>(null);
  
  // Medication management states
  const [medicationName, setMedicationName] = useState("");
  const [medicationQuantity, setMedicationQuantity] = useState(0);
  const [medicationThreshold, setMedicationThreshold] = useState(10);
  const [medicationNotes, setMedicationNotes] = useState("");
  const [editingMedicationId, setEditingMedicationId] = useState<number | null>(null);

  // Fetch clinic info
  const { data: clinicInfo, isLoading: isLoadingClinicInfo } = useQuery({
    queryKey: ["/api/settings/key/clinic_info"],
  });

  // Fetch patient ID format
  const { data: patientIdFormat, isLoading: isLoadingPatientIdFormat } = useQuery({
    queryKey: ["/api/settings/key/patient_id_format"],
  });
  
  // Fetch medications
  const { data: medications, isLoading: isLoadingMedications } = useQuery({
    queryKey: ["/api/medications"],
  });
  
  // Fetch doctor signatures
  const { data: doctorSignatures = [], isLoading: isLoadingSignatures } = useQuery({
    queryKey: ["/api/doctor-signatures"],
  });

  // Clinic Info State
  const [clinicInfoState, setClinicInfoState] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  // Patient ID Format State
  const [patientIdFormatState, setPatientIdFormatState] = useState({
    prefix: "PT",
    yearInFormat: true,
    digitCount: 4,
    separator: "-",
  });

  // Update clinic info once it's loaded
  useState(() => {
    if (clinicInfo?.settingValue) {
      setClinicInfoState({
        name: clinicInfo.settingValue.name || "",
        address: clinicInfo.settingValue.address || "",
        phone: clinicInfo.settingValue.phone || "",
        email: clinicInfo.settingValue.email || "",
      });
    }
  });

  // Update patient ID format once it's loaded
  useState(() => {
    if (patientIdFormat?.settingValue) {
      setPatientIdFormatState({
        prefix: patientIdFormat.settingValue.prefix || "PT",
        yearInFormat: patientIdFormat.settingValue.yearInFormat !== undefined ? patientIdFormat.settingValue.yearInFormat : true,
        digitCount: patientIdFormat.settingValue.digitCount || 4,
        separator: patientIdFormat.settingValue.separator || "-",
      });
    }
  });

  // Update clinic info mutation
  const updateClinicInfoMutation = useMutation({
    mutationFn: async (values: any) => {
      return apiRequest("PUT", `/api/settings/${clinicInfo.id}`, {
        settingValue: {
          ...clinicInfo.settingValue,
          ...values,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/key/clinic_info"] });
      toast({
        title: "Success",
        description: "Clinic information updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating clinic info:", error);
      toast({
        title: "Error",
        description: "Failed to update clinic information",
        variant: "destructive",
      });
    },
  });

  // Update patient ID format mutation
  const updatePatientIdFormatMutation = useMutation({
    mutationFn: async (values: any) => {
      return apiRequest("PUT", `/api/settings/${patientIdFormat.id}`, {
        settingValue: values,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/key/patient_id_format"] });
      toast({
        title: "Success",
        description: "Patient ID format updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating patient ID format:", error);
      toast({
        title: "Error",
        description: "Failed to update patient ID format",
        variant: "destructive",
      });
    },
  });
  
  // Medication mutations
  const createMedicationMutation = useMutation({
    mutationFn: async (values: any) => {
      return apiRequest("POST", "/api/medications", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      toast({
        title: "Success",
        description: "Medication added to inventory",
      });
      // Reset form
      setMedicationName("");
      setMedicationQuantity(0);
      setMedicationThreshold(10);
      setMedicationNotes("");
    },
    onError: (error) => {
      console.error("Error creating medication:", error);
      toast({
        title: "Error",
        description: "Failed to add medication to inventory",
        variant: "destructive",
      });
    },
  });
  
  const updateMedicationMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: any }) => {
      return apiRequest("PUT", `/api/medications/${id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      toast({
        title: "Success",
        description: "Medication updated successfully",
      });
      setEditingMedicationId(null);
    },
    onError: (error) => {
      console.error("Error updating medication:", error);
      toast({
        title: "Error",
        description: "Failed to update medication",
        variant: "destructive",
      });
    },
  });
  
  const deleteMedicationMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/medications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      toast({
        title: "Success",
        description: "Medication removed from inventory",
      });
    },
    onError: (error) => {
      console.error("Error deleting medication:", error);
      toast({
        title: "Error",
        description: "Failed to remove medication",
        variant: "destructive",
      });
    },
  });
  
  // Doctor signature mutations
  const createSignatureMutation = useMutation({
    mutationFn: async (values: any) => {
      return apiRequest("POST", "/api/doctor-signatures", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-signatures"] });
      toast({
        title: "Success",
        description: "Doctor signature added successfully",
      });
      // Reset form
      if (signatureRef.current) {
        signatureRef.current.clear();
      }
      setDoctorName("");
    },
    onError: (error) => {
      console.error("Error creating doctor signature:", error);
      toast({
        title: "Error",
        description: "Failed to add doctor signature",
        variant: "destructive",
      });
    }
  });
  
  const updateSignatureMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: any }) => {
      return apiRequest("PUT", `/api/doctor-signatures/${id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-signatures"] });
      toast({
        title: "Success",
        description: "Doctor signature updated successfully",
      });
      setEditingSignatureId(null);
      if (signatureRef.current) {
        signatureRef.current.clear();
      }
      setDoctorName("");
    },
    onError: (error) => {
      console.error("Error updating doctor signature:", error);
      toast({
        title: "Error",
        description: "Failed to update doctor signature",
        variant: "destructive",
      });
    }
  });
  
  const deleteSignatureMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/doctor-signatures/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctor-signatures"] });
      toast({
        title: "Success",
        description: "Doctor signature removed successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting doctor signature:", error);
      toast({
        title: "Error",
        description: "Failed to remove doctor signature",
        variant: "destructive",
      });
    }
  });

  const handleSaveClinicInfo = () => {
    updateClinicInfoMutation.mutate(clinicInfoState);
  };

  const handleSavePatientIdFormat = () => {
    updatePatientIdFormatMutation.mutate(patientIdFormatState);
  };
  
  // Medication operations
  const handleAddMedication = () => {
    if (!medicationName.trim()) {
      toast({
        title: "Error",
        description: "Medication name is required",
        variant: "destructive",
      });
      return;
    }
    
    createMedicationMutation.mutate({
      name: medicationName,
      quantity: medicationQuantity,
      threshold: medicationThreshold,
      notes: medicationNotes || "",
    });
  };
  
  const handleEditMedication = (medication: any) => {
    setMedicationName(medication.name);
    setMedicationQuantity(medication.quantity);
    setMedicationThreshold(medication.threshold);
    setMedicationNotes(medication.notes || "");
    setEditingMedicationId(medication.id);
  };
  
  const handleUpdateMedication = () => {
    if (!medicationName.trim() || !editingMedicationId) {
      return;
    }
    
    updateMedicationMutation.mutate({
      id: editingMedicationId,
      values: {
        name: medicationName,
        quantity: medicationQuantity,
        threshold: medicationThreshold,
        notes: medicationNotes || "",
      }
    });
  };
  
  const handleCancelEdit = () => {
    setEditingMedicationId(null);
    setMedicationName("");
    setMedicationQuantity(0);
    setMedicationThreshold(10);
    setMedicationNotes("");
  };
  
  // Signature operations
  const handleAddSignature = () => {
    if (!doctorName.trim()) {
      toast({
        title: "Error",
        description: "Doctor name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast({
        title: "Error",
        description: "Please provide a signature",
        variant: "destructive",
      });
      return;
    }
    
    const signatureImage = signatureRef.current.toDataURL("image/png");
    
    createSignatureMutation.mutate({
      doctorName,
      signatureImage,
    });
  };
  
  const handleEditSignature = (signature: any) => {
    setDoctorName(signature.doctorName);
    setEditingSignatureId(signature.id);
  };
  
  const handleUpdateSignature = () => {
    if (!doctorName.trim() || !editingSignatureId) {
      return;
    }
    
    let signatureImage;
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      signatureImage = signatureRef.current.toDataURL("image/png");
    }
    
    updateSignatureMutation.mutate({
      id: editingSignatureId,
      values: {
        doctorName,
        ...(signatureImage ? { signatureImage } : {})
      }
    });
  };
  
  const handleCancelSignatureEdit = () => {
    setEditingSignatureId(null);
    setDoctorName("");
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  const handleDeleteOption = (category: string, value: string) => {
    const currentOptions = { ...dropdownOptions };
    const updatedOptions = currentOptions[category].filter(
      (option: string) => option !== value
    );
    currentOptions[category] = updatedOptions;
    
    updateDropdownOptions(currentOptions);
  };

  const handleAddOption = () => {
    if (!newOptionValue.trim()) {
      toast({
        title: "Error",
        description: "Option value cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const currentOptions = { ...dropdownOptions };
    if (!currentOptions[newOptionCategory].includes(newOptionValue)) {
      currentOptions[newOptionCategory] = [
        ...currentOptions[newOptionCategory],
        newOptionValue,
      ];
      updateDropdownOptions(currentOptions);
      setNewOptionValue("");
      setIsAddingOption(false);
      
      toast({
        title: "Success",
        description: "Option added successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "This option already exists",
        variant: "destructive",
      });
    }
  };

  const handleUpdateOption = (category: string, oldValue: string, newValue: string) => {
    if (!newValue.trim()) {
      toast({
        title: "Error",
        description: "Option value cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const currentOptions = { ...dropdownOptions };
    const index = currentOptions[category].indexOf(oldValue);
    if (index !== -1) {
      currentOptions[category][index] = newValue;
      updateDropdownOptions(currentOptions);
      setEditingOption(null);
      
      toast({
        title: "Success",
        description: "Option updated successfully",
      });
    }
  };

  const getCategoryLabel = (key: string): string => {
    const labels: { [key: string]: string } = {
      medicalHistory: "Medical History",
      drugAllergy: "Drug Allergy",
      previousDentalHistory: "Previous Dental History",
      chiefComplaint: "Chief Complaint",
      oralExamination: "Oral Examination",
      investigation: "Investigation",
      treatmentPlan: "Treatment Plan",
      prescription: "Prescription",
      treatmentDone: "Treatment Done",
      advice: "Advice",
      labTechnicians: "Lab Technicians",
      doctors: "Doctors",
    };
    return labels[key] || key;
  };

  const previewPatientId = () => {
    const { prefix, yearInFormat, digitCount, separator } = patientIdFormatState;
    const year = yearInFormat ? new Date().getFullYear() : "";
    const number = "0".repeat(digitCount);
    return `${prefix}${year}${separator}${number}`;
  };

  return (
    <Layout title="Settings" showBackButton={true} backTo="/dashboard">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            General Settings
          </TabsTrigger>
          <TabsTrigger value="dropdown" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Dropdown Options
          </TabsTrigger>
          <TabsTrigger value="patient" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Patient ID Format
          </TabsTrigger>
          <TabsTrigger value="medications" className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="m19 19-6-6"></path>
              <path d="m13 13-6-6"></path>
              <rect x="3" y="3" width="4" height="4" rx="1"></rect>
              <rect x="17" y="17" width="4" height="4" rx="1"></rect>
              <path d="M14 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path>
              <path d="M8 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"></path>
            </svg>
            Medications
          </TabsTrigger>
          <TabsTrigger value="signatures" className="flex items-center gap-2">
            <Pen className="h-4 w-4" />
            Doctor Signatures
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Clinic Information</CardTitle>
              <CardDescription>
                Update your clinic details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingClinicInfo ? (
                <div className="flex justify-center py-6">
                  <p>Loading clinic information...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clinicName">Clinic Name</Label>
                      <Input
                        id="clinicName"
                        value={clinicInfoState.name}
                        onChange={(e) =>
                          setClinicInfoState({
                            ...clinicInfoState,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="clinicPhone">Phone Number</Label>
                      <Input
                        id="clinicPhone"
                        value={clinicInfoState.phone}
                        onChange={(e) =>
                          setClinicInfoState({
                            ...clinicInfoState,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="clinicEmail">Email</Label>
                      <Input
                        id="clinicEmail"
                        type="email"
                        value={clinicInfoState.email}
                        onChange={(e) =>
                          setClinicInfoState({
                            ...clinicInfoState,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clinicAddress">Address</Label>
                    <Textarea
                      id="clinicAddress"
                      value={clinicInfoState.address}
                      onChange={(e) =>
                        setClinicInfoState({
                          ...clinicInfoState,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveClinicInfo}
                      disabled={updateClinicInfoMutation.isPending}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {updateClinicInfoMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dropdown">
          <Card>
            <CardHeader>
              <CardTitle>Dropdown Options</CardTitle>
              <CardDescription>
                Customize the dropdown options available in patient records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select
                  value={newOptionCategory}
                  onValueChange={setNewOptionCategory}
                >
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(dropdownOptions || {}).map((category) => (
                      <SelectItem key={category} value={category}>
                        {getCategoryLabel(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Option</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dropdownOptions && dropdownOptions[newOptionCategory] ? 
                      dropdownOptions[newOptionCategory].map((option: string, index: number) => (
                        <TableRow key={`${newOptionCategory}-${index}`}>
                          <TableCell>{getCategoryLabel(newOptionCategory)}</TableCell>
                          <TableCell>
                            {editingOption === `${newOptionCategory}-${option}` ? (
                              <Input
                                value={newOptionValue}
                                onChange={(e) => setNewOptionValue(e.target.value)}
                                autoFocus
                              />
                            ) : (
                              option
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editingOption === `${newOptionCategory}-${option}` ? (
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    handleUpdateOption(newOptionCategory, option, newOptionValue);
                                  }}
                                >
                                  <Check className="h-4 w-4 text-green-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingOption(null)}
                                >
                                  <X className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingOption(`${newOptionCategory}-${option}`);
                                    setNewOptionValue(option);
                                  }}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4"
                                  >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteOption(newOptionCategory, option)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )) : <TableRow><TableCell colSpan={3} className="text-center">No options found for this category</TableCell></TableRow>
                    }
                    
                    {isAddingOption && (
                      <TableRow>
                        <TableCell>{getCategoryLabel(newOptionCategory)}</TableCell>
                        <TableCell>
                          <Input
                            value={newOptionValue}
                            onChange={(e) => setNewOptionValue(e.target.value)}
                            placeholder="Enter new option value"
                            autoFocus
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleAddOption}
                            >
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsAddingOption(false)}
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingOption(true);
                    setNewOptionValue("");
                  }}
                  disabled={isAddingOption}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Option
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="patient">
          <Card>
            <CardHeader>
              <CardTitle>Patient ID Format</CardTitle>
              <CardDescription>
                Configure how patient IDs are generated
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPatientIdFormat ? (
                <div className="flex justify-center py-6">
                  <p>Loading patient ID format...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700">Preview:</span>
                      <Badge variant="outline" className="text-lg px-4 py-2 bg-white">
                        {previewPatientId()}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="idPrefix">ID Prefix</Label>
                      <Input
                        id="idPrefix"
                        value={patientIdFormatState.prefix}
                        onChange={(e) =>
                          setPatientIdFormatState({
                            ...patientIdFormatState,
                            prefix: e.target.value,
                          })
                        }
                      />
                      <p className="text-sm text-neutral-500">
                        Letters that appear at the beginning of each ID
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="idSeparator">Separator</Label>
                      <Input
                        id="idSeparator"
                        value={patientIdFormatState.separator}
                        onChange={(e) =>
                          setPatientIdFormatState({
                            ...patientIdFormatState,
                            separator: e.target.value,
                          })
                        }
                      />
                      <p className="text-sm text-neutral-500">
                        Character that separates prefix and number
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="idDigits">Number of Digits</Label>
                      <Input
                        id="idDigits"
                        type="number"
                        min={1}
                        max={10}
                        value={patientIdFormatState.digitCount}
                        onChange={(e) =>
                          setPatientIdFormatState({
                            ...patientIdFormatState,
                            digitCount: parseInt(e.target.value),
                          })
                        }
                      />
                      <p className="text-sm text-neutral-500">
                        Number of digits in the sequential part
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="idIncludeYear">Include Year</Label>
                        <Switch
                          id="idIncludeYear"
                          checked={patientIdFormatState.yearInFormat}
                          onCheckedChange={(checked) =>
                            setPatientIdFormatState({
                              ...patientIdFormatState,
                              yearInFormat: checked,
                            })
                          }
                        />
                      </div>
                      <p className="text-sm text-neutral-500">
                        Include current year in the ID
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSavePatientIdFormat}
                      disabled={updatePatientIdFormatMutation.isPending}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {updatePatientIdFormatMutation.isPending ? "Saving..." : "Save Format"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="medications">
          <Card>
            <CardHeader>
              <CardTitle>Medication Inventory</CardTitle>
              <CardDescription>
                Manage medications for prescriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMedications ? (
                <div className="flex justify-center py-6">
                  <p>Loading medications...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-3">
                      {editingMedicationId ? "Update Medication" : "Add New Medication"}
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="medicationName">Medication Name</Label>
                          <Input
                            id="medicationName"
                            value={medicationName}
                            onChange={(e) => setMedicationName(e.target.value)}
                            placeholder="Enter medication name"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="medicationQuantity">Quantity in Stock</Label>
                          <Input
                            id="medicationQuantity"
                            type="number"
                            min={0}
                            value={medicationQuantity}
                            onChange={(e) => setMedicationQuantity(parseInt(e.target.value) || 0)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="medicationThreshold">
                            Reorder Threshold
                            <span className="text-sm text-muted-foreground ml-1">
                              (Alert when below this level)
                            </span>
                          </Label>
                          <Input
                            id="medicationThreshold"
                            type="number"
                            min={1}
                            value={medicationThreshold}
                            onChange={(e) => setMedicationThreshold(parseInt(e.target.value) || 10)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="medicationNotes">Notes</Label>
                        <Textarea
                          id="medicationNotes"
                          value={medicationNotes}
                          onChange={(e) => setMedicationNotes(e.target.value)}
                          placeholder="Additional information about the medication"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        {editingMedicationId ? (
                          <>
                            <Button variant="outline" onClick={handleCancelEdit}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleUpdateMedication}
                              disabled={updateMedicationMutation.isPending}
                            >
                              {updateMedicationMutation.isPending ? "Updating..." : "Update Medication"}
                            </Button>
                          </>
                        ) : (
                          <Button 
                            onClick={handleAddMedication}
                            disabled={createMedicationMutation.isPending}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {createMedicationMutation.isPending ? "Adding..." : "Add Medication"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medication Name</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {medications?.length > 0 ? (
                          medications.map((medication: any) => (
                            <TableRow key={medication.id}>
                              <TableCell className="font-medium">{medication.name}</TableCell>
                              <TableCell>{medication.quantity}</TableCell>
                              <TableCell>
                                {medication.quantity <= medication.threshold ? (
                                  <Badge variant="destructive">Low Stock</Badge>
                                ) : (
                                  <Badge variant="outline">In Stock</Badge>
                                )}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {medication.notes || "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditMedication(medication)}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="h-4 w-4"
                                    >
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteMedicationMutation.mutate(medication.id)}
                                    disabled={deleteMedicationMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                              No medications found. Add your first medication above.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="signatures">
          <Card>
            <CardHeader>
              <CardTitle>Doctor Signatures</CardTitle>
              <CardDescription>
                Manage signatures used in consent forms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="doctorName">Doctor Name</Label>
                  <Input
                    id="doctorName"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Enter doctor name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Signature</Label>
                  <div className="border border-gray-300 rounded-md overflow-hidden">
                    <SignatureCanvas
                      ref={signatureRef}
                      canvasProps={{
                        className: "w-full h-40 bg-white",
                      }}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (signatureRef.current) {
                          signatureRef.current.clear();
                        }
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  {editingSignatureId ? (
                    <div className="space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={handleCancelSignatureEdit}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleUpdateSignature}
                        disabled={updateSignatureMutation.isPending}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {updateSignatureMutation.isPending ? "Updating..." : "Update Signature"}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleAddSignature}
                      disabled={createSignatureMutation.isPending}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {createSignatureMutation.isPending ? "Saving..." : "Add Signature"}
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Saved Signatures</h3>
                {isLoadingSignatures ? (
                  <div className="flex justify-center py-4">
                    <p>Loading signatures...</p>
                  </div>
                ) : doctorSignatures && doctorSignatures.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {doctorSignatures.map((signature: any) => (
                      <div key={signature.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{signature.doctorName}</h4>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSignature(signature)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteSignatureMutation.mutate(signature.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="h-24 border rounded flex items-center justify-center bg-neutral-50 p-2">
                          <img 
                            src={signature.signatureImage} 
                            alt={`${signature.doctorName}'s signature`}
                            className="max-h-full object-contain"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-600 text-center py-4">No signatures saved yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
