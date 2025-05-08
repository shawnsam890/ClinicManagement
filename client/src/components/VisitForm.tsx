import { useState, useEffect } from "react";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trash2, Save } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import PrescriptionForm from "./PrescriptionForm";
import InvoiceForm from "./InvoiceForm";

// Define the schema for the visit form
const visitFormSchema = z.object({
  chiefComplaint: z.string().min(1, { message: "Chief complaint is required" }),
  toothFindings: z.array(
    z.object({
      toothNumber: z.string().min(1, { message: "Tooth number is required" }),
      finding: z.string().min(1, { message: "Finding is required" })
    })
  ),
  generalizedFindings: z.array(
    z.object({
      finding: z.string().min(1, { message: "Finding is required" })
    })
  ),
  investigations: z.array(
    z.object({
      type: z.string().min(1, { message: "Investigation type is required" }),
      findings: z.string().optional()
    })
  ),
  treatmentPlan: z.string().optional(),
  treatmentDone: z.string().optional(),
  advice: z.string().optional(),
  notes: z.string().optional(),
  // Will handle prescriptions separately
  // Will handle invoice separately
  // Will handle follow-up separately
});

type VisitFormValues = z.infer<typeof visitFormSchema>;

interface VisitFormProps {
  patientId: string;
  initialData?: any; // For editing mode
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function VisitForm({ patientId, initialData, onSubmit, onCancel }: VisitFormProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  
  // Get dropdown options from settings
  const { data: settingsData } = useQuery({
    queryKey: ["/api/settings/category/patient_options"],
  });
  
  // Get medications for prescription form
  const { data: medicationsData } = useQuery({
    queryKey: ["/api/medications"],
  });
  
  // Form setup
  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: initialData || {
      chiefComplaint: "",
      toothFindings: [],
      generalizedFindings: [],
      investigations: [],
      treatmentPlan: "",
      treatmentDone: "",
      advice: "",
      notes: ""
    }
  });
  
  // Field arrays for dynamic fields
  const { fields: toothFindingFields, append: appendToothFinding, remove: removeToothFinding } = 
    useFieldArray({ control: form.control, name: "toothFindings" });
  
  const { fields: generalizedFindingFields, append: appendGeneralizedFinding, remove: removeGeneralizedFinding } = 
    useFieldArray({ control: form.control, name: "generalizedFindings" });
  
  const { fields: investigationFields, append: appendInvestigation, remove: removeInvestigation } = 
    useFieldArray({ control: form.control, name: "investigations" });
  
  // Handle form submission
  const handleFormSubmit = (values: VisitFormValues) => {
    // Combine all data
    const formData = {
      ...values,
      patientId,
      date: new Date().toISOString().split('T')[0],
      prescriptions: prescriptions.map(p => ({
        medicationId: p.medicationId,
        timing: p.timing,
        days: p.days,
        notes: p.notes
      })),
      invoice: invoiceData
    };
    
    onSubmit(formData);
  };
  
  // Get dropdown options
  const getDropdownOptions = (key: string) => {
    if (!settingsData) return [];
    
    const dropdownOptions = settingsData.find((setting: any) => 
      setting.settingKey === 'dropdown_options'
    );
    
    if (!dropdownOptions || !dropdownOptions.settingValue[key]) return [];
    
    return dropdownOptions.settingValue[key];
  };
  
  // Prescription handlers
  const handleAddPrescription = (prescription: any) => {
    setPrescriptions([...prescriptions, prescription]);
    setShowPrescriptionForm(false);
  };
  
  // Invoice handlers
  const handleSaveInvoice = (invoice: any) => {
    setInvoiceData(invoice);
    setShowInvoiceForm(false);
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="rx">Prescriptions</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
              {/* Chief Complaint */}
              <FormField
                control={form.control}
                name="chiefComplaint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chief Complaint</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select chief complaint" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getDropdownOptions('chiefComplaint').map((option: string) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Oral Examination */}
              <div>
                <h3 className="text-lg font-medium mb-2">Oral Examination</h3>
                
                {/* Tooth Findings */}
                <div className="space-y-2 mb-4">
                  <div className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center">
                    <FormLabel className="text-sm">Tooth Number</FormLabel>
                    <FormLabel className="text-sm">Finding</FormLabel>
                    <span></span>
                  </div>
                  
                  {toothFindingFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center">
                      <FormField
                        control={form.control}
                        name={`toothFindings.${index}.toothNumber`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input {...field} placeholder="e.g. 11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`toothFindings.${index}.finding`}
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select finding" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {getDropdownOptions('oralExamination').map((option: string) => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => removeToothFinding(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendToothFinding({ toothNumber: "", finding: "" })}
                    className="mt-2"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Tooth Finding
                  </Button>
                </div>
                
                {/* Generalized Findings */}
                <div className="space-y-2 mb-4">
                  <h4 className="text-md font-medium">Generalized Findings</h4>
                  
                  {generalizedFindingFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr_auto] gap-2 items-center">
                      <FormField
                        control={form.control}
                        name={`generalizedFindings.${index}.finding`}
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select finding" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {getDropdownOptions('oralExamination').map((option: string) => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={() => removeGeneralizedFinding(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendGeneralizedFinding({ finding: "" })}
                    className="mt-2"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Generalized Finding
                  </Button>
                </div>
              </div>
              
              {/* Investigations */}
              <div>
                <h3 className="text-lg font-medium mb-2">Investigations</h3>
                
                {investigationFields.map((field, index) => (
                  <div key={field.id} className="space-y-2 mb-4 border p-4 rounded-md">
                    <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                      <FormField
                        control={form.control}
                        name={`investigations.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type of Investigation</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select investigation type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {getDropdownOptions('investigation').map((option: string) => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        className="mt-8"
                        onClick={() => removeInvestigation(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Only show findings field if type is selected */}
                    {form.watch(`investigations.${index}.type`) && (
                      <FormField
                        control={form.control}
                        name={`investigations.${index}.findings`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Findings</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Enter findings" 
                                rows={3} 
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendInvestigation({ type: "", findings: "" })}
                  className="mt-2"
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Add Investigation
                </Button>
              </div>
              
              {/* Treatment Plan */}
              <FormField
                control={form.control}
                name="treatmentPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Treatment Plan</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select treatment plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getDropdownOptions('treatmentPlan').map((option: string) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Treatment Done */}
              <FormField
                control={form.control}
                name="treatmentDone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Treatment Done</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select treatment done" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getDropdownOptions('treatmentDone').map((option: string) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Advice */}
              <FormField
                control={form.control}
                name="advice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Advice</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select advice" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getDropdownOptions('advice').map((option: string) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Textarea 
                        {...field} 
                        placeholder="Enter any additional notes" 
                        rows={3}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <div className="space-x-2">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("rx")}>
                    Next: Prescriptions
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </div>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="rx">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Prescriptions</h3>
            
            {prescriptions.length === 0 ? (
              <div className="text-center py-8 border rounded-md">
                <p className="text-muted-foreground">No prescriptions added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((prescription, index) => {
                  const medication = medicationsData?.find((med: any) => med.id === prescription.medicationId);
                  return (
                    <div key={index} className="border p-4 rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{medication?.name || "Medication"}</h4>
                          <p className="text-sm text-muted-foreground">
                            Timing: {prescription.timing} | Days: {prescription.days}
                          </p>
                          {prescription.notes && (
                            <p className="text-sm mt-2">{prescription.notes}</p>
                          )}
                        </div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon"
                          onClick={() => {
                            const newPrescriptions = [...prescriptions];
                            newPrescriptions.splice(index, 1);
                            setPrescriptions(newPrescriptions);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowPrescriptionForm(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Add Prescription
            </Button>
            
            <div className="flex justify-between mt-6">
              <Button type="button" variant="outline" onClick={() => setActiveTab("details")}>
                Back
              </Button>
              <div className="space-x-2">
                <Button type="button" variant="outline" onClick={() => setActiveTab("invoice")}>
                  Next: Invoice
                </Button>
                <Button type="button" onClick={() => form.handleSubmit(handleFormSubmit)()}>
                  Save
                </Button>
              </div>
            </div>
          </div>
          
          {/* Prescription Form Dialog */}
          {showPrescriptionForm && (
            <Dialog open={showPrescriptionForm} onOpenChange={setShowPrescriptionForm}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Prescription</DialogTitle>
                </DialogHeader>
                <PrescriptionForm 
                  onSave={handleAddPrescription} 
                  onCancel={() => setShowPrescriptionForm(false)}
                  medications={medicationsData || []}
                />
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>
        
        <TabsContent value="invoice">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Invoice</h3>
            
            {!invoiceData ? (
              <div className="text-center py-8 border rounded-md">
                <p className="text-muted-foreground">No invoice created yet</p>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowInvoiceForm(true)} 
                  className="mt-4"
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Create Invoice
                </Button>
              </div>
            ) : (
              <div className="border p-4 rounded-md">
                <div className="flex justify-between">
                  <h4 className="font-medium">Invoice Total: ₹{invoiceData.totalAmount}</h4>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowInvoiceForm(true)}
                  >
                    Edit Invoice
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Items: {invoiceData.items?.length || 0} | 
                  Status: {invoiceData.status || "Draft"}
                </p>
              </div>
            )}
            
            <div className="flex justify-between mt-6">
              <Button type="button" variant="outline" onClick={() => setActiveTab("rx")}>
                Back
              </Button>
              <Button type="button" onClick={() => form.handleSubmit(handleFormSubmit)()}>
                <Save className="h-4 w-4 mr-2" /> Save Visit
              </Button>
            </div>
          </div>
          
          {/* Invoice Form Dialog */}
          {showInvoiceForm && (
            <Dialog open={showInvoiceForm} onOpenChange={setShowInvoiceForm}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create Invoice</DialogTitle>
                </DialogHeader>
                <InvoiceForm 
                  patientId={patientId}
                  initialData={invoiceData}
                  onSave={handleSaveInvoice}
                  onCancel={() => setShowInvoiceForm(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}