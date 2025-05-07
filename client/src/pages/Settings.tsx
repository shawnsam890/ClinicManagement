import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useSettings } from "@/hooks/useSettings";
import Layout from "@/components/Layout";

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
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const { dropdownOptions, updateDropdownOptions } = useSettings();
  const [activeTab, setActiveTab] = useState("general");
  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [newOptionValue, setNewOptionValue] = useState("");
  const [newOptionCategory, setNewOptionCategory] = useState("medicalHistory");
  const [isAddingOption, setIsAddingOption] = useState(false);
  
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

  const handleSaveClinicInfo = () => {
    updateClinicInfoMutation.mutate(clinicInfoState);
  };

  const handleSavePatientIdFormat = () => {
    updatePatientIdFormatMutation.mutate(patientIdFormatState);
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
        <TabsList className="grid w-full grid-cols-3">
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
                    {Object.entries(dropdownOptions || {}).map(([category, options]) => 
                      options.map((option: string, index: number) => (
                        <TableRow key={`${category}-${index}`}>
                          <TableCell>{getCategoryLabel(category)}</TableCell>
                          <TableCell>
                            {editingOption === `${category}-${option}` ? (
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
                            {editingOption === `${category}-${option}` ? (
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    handleUpdateOption(category, option, newOptionValue);
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
                                    setEditingOption(`${category}-${option}`);
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
                                  onClick={() => handleDeleteOption(category, option)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    
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
      </Tabs>
    </Layout>
  );
}
