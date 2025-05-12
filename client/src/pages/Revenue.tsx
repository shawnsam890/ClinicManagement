import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, Printer, Search, Filter, Calendar, Trash2, Loader2 } from "lucide-react";

// Generate financial year options
const currentYear = new Date().getFullYear();
const financialYears = Array.from({ length: 5 }, (_, i) => {
  const year = currentYear - i;
  return {
    label: `FY ${year}-${year + 1}`,
    value: `${year}-${year + 1}`,
  };
});

// Chart colors
const COLORS = ["#0077B6", "#FF8C42", "#00C49F", "#FFBB28", "#FF8042"];

export default function Revenue() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("invoices");
  const [financialYear, setFinancialYear] = useState<string>(financialYears[0].value);
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });
  
  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      try {
        // First, find any appointments referencing this invoice
        const appointmentsRes = await fetch(`/api/appointments`);
        if (appointmentsRes.ok) {
          const appointments = await appointmentsRes.json();
          
          // Update any appointments that reference this invoice to remove the reference
          for (const appointment of appointments) {
            if (appointment.invoiceId === invoiceId) {
              // We need to use PUT for appointments since there's no PATCH endpoint
              // First get the full appointment data
              const appointmentData = { ...appointment };
              // Then update just the invoiceId field
              appointmentData.invoiceId = null;
              // Send the full object with PUT request
              await apiRequest("PUT", `/api/appointments/${appointment.id}`, appointmentData);
            }
          }
        }
        
        // Delete invoice items
        const itemsRes = await fetch(`/api/invoices/${invoiceId}/items`);
        if (itemsRes.ok) {
          const items = await itemsRes.json();
          for (const item of items) {
            await apiRequest("DELETE", `/api/invoice-items/${item.id}`);
          }
        }
        
        // Then delete the invoice
        await apiRequest("DELETE", `/api/invoices/${invoiceId}`);
        
        return invoiceId;
      } catch (error) {
        console.error("Error deleting invoice:", error);
        throw new Error("Failed to delete invoice");
      }
    },
    onSuccess: () => {
      // Invalidate both invoices and appointments queries since we're updating both
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch all invoices
  const { data: rawInvoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["/api/invoices"],
  });
  
  // Fetch lab works data
  const { data: labWorks = [], isLoading: isLoadingLabWorks } = useQuery<any[]>({
    queryKey: ["/api/lab-works"],
  });
  
  // Fetch lab costs data
  const { data: labCosts = [], isLoading: isLoadingLabCosts } = useQuery<any[]>({
    queryKey: ["/api/lab-work-costs"],
  });
  
  // Filter out duplicate invoices by ID
  const invoices = useMemo(() => {
    if (!rawInvoices) return [];
    
    // Use a Map to keep only the latest version of each invoice by ID
    const uniqueInvoicesMap = new Map();
    
    if (Array.isArray(rawInvoices)) {
      rawInvoices.forEach((invoice: any) => {
        uniqueInvoicesMap.set(invoice.id, invoice);
      });
    }
    
    return Array.from(uniqueInvoicesMap.values());
  }, [rawInvoices]);

  // Function to filter invoices by date range
  const filterInvoicesByDateRange = (invoices: any[]) => {
    if (!invoices) return [];
    
    return invoices.filter((invoice) => {
      const invoiceDate = parseISO(invoice.date);
      return isWithinInterval(invoiceDate, {
        start: parseISO(dateRange.startDate),
        end: parseISO(dateRange.endDate),
      });
    });
  };

  // Filter invoices based on search query and date range
  const filteredInvoices = invoices
    ? filterInvoicesByDateRange(invoices).filter((invoice: any) => {
        const query = searchQuery.toLowerCase();
        return (
          invoice.patientId.toLowerCase().includes(query) ||
          invoice.status.toLowerCase().includes(query) ||
          (invoice.paymentMethod && invoice.paymentMethod.toLowerCase().includes(query))
        );
      })
    : [];

  // Filter lab works based on date range
  const filteredLabWorks = labWorks.filter((work: any) => {
    if (!work.startDate) return false;
    const labWorkDate = parseISO(work.startDate);
    return isWithinInterval(labWorkDate, {
      start: parseISO(dateRange.startDate),
      end: parseISO(dateRange.endDate),
    });
  });
  
  // Calculate lab revenues and profits
  const labRevenue = filteredLabWorks.reduce((sum, work: any) => {
    const units = work.units || 1;
    const clinicCost = (work.clinicCost || 0) * units;
    return sum + clinicCost;
  }, 0);
  
  const labCostTotal = filteredLabWorks.reduce((sum, work: any) => {
    const units = work.units || 1;
    const labCost = (work.labCost || 0) * units;
    return sum + labCost;
  }, 0);
  
  const labProfit = labRevenue - labCostTotal;
  
  // Calculate total revenue (invoices + lab)
  const invoiceRevenue = filteredInvoices.reduce(
    (sum: number, invoice: any) => sum + (invoice.totalAmount || 0),
    0
  );
  
  const totalRevenue = invoiceRevenue + labRevenue;

  // Prepare data for charts
  const prepareChartData = () => {
    if (!filteredInvoices.length) return [];
    
    // Group by payment method
    const paymentMethodCounts = filteredInvoices.reduce((acc: any, invoice: any) => {
      const method = invoice.paymentMethod || "Unknown";
      if (!acc[method]) {
        acc[method] = {
          name: method,
          count: 0,
          amount: 0,
        };
      }
      acc[method].count += 1;
      acc[method].amount += invoice.totalAmount || 0;
      return acc;
    }, {});
    
    return Object.values(paymentMethodCounts);
  };

  const chartData = prepareChartData();

  // Prepare treatment type data
  const prepareTreatmentData = () => {
    if (!filteredInvoices.length) return [];
    
    // For now, we'll use mock treatment data
    // In a real implementation, this would pull from invoice items
    return [
      { name: "Consultation", value: 12000 },
      { name: "Root Canal", value: 45000 },
      { name: "Extraction", value: 15000 },
      { name: "Cleaning", value: 9000 },
      { name: "Crown", value: 30000 },
    ];
  };

  const treatmentData = prepareTreatmentData();

  return (
    <Layout title="Revenue Management" showBackButton={true} backTo="/dashboard">
      <div className="flex flex-col space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Revenue</CardTitle>
              <CardDescription>Current period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">₹{totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Invoices</CardTitle>
              <CardDescription>Current period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{filteredInvoices.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Average Value</CardTitle>
              <CardDescription>Per invoice</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                ₹{filteredInvoices.length ? Math.round(invoiceRevenue / filteredInvoices.length).toLocaleString() : 0}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Common Date Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
            <CardDescription>Filter data by date period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Financial Year</label>
                <Select
                  value={financialYear}
                  onValueChange={setFinancialYear}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {financialYears.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, startDate: e.target.value })
                    }
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                  <Input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, endDate: e.target.value })
                    }
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                  <Input
                    type="search"
                    placeholder={activeTab === "invoices" ? "Search invoices..." : "Search lab works..."}
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs for different revenue types */}
        <Tabs defaultValue="invoices" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="invoices">Treatment Revenue</TabsTrigger>
            <TabsTrigger value="lab">Lab Revenue</TabsTrigger>
          </TabsList>

          {/* Treatment Revenue Tab */}
          <TabsContent value="invoices">
            {/* Treatment Revenue Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-2">Revenue by Payment Method</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: any) => [`₹${value.toLocaleString()}`, "Amount"]}
                        />
                        <Legend />
                        <Bar dataKey="amount" fill="#0077B6" name="Amount" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-2">Revenue by Treatment Type</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={treatmentData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {treatmentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => [`₹${value.toLocaleString()}`, "Amount"]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Invoices Table */}
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>
                  View and manage financial transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingInvoices ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="ml-2">Loading invoices...</p>
                    </div>
                  ) : filteredInvoices.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-neutral-600">No invoices found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice ID</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Payment Method</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredInvoices.map((invoice: any) => (
                            <TableRow key={invoice.id}>
                              <TableCell>#{invoice.id}</TableCell>
                              <TableCell>{invoice.patientId}</TableCell>
                              <TableCell>{format(new Date(invoice.date), "yyyy-MM-dd")}</TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    invoice.status === "paid"
                                      ? "bg-green-100 text-green-800"
                                      : invoice.status === "pending"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                </span>
                              </TableCell>
                              <TableCell>{invoice.paymentMethod || "—"}</TableCell>
                              <TableCell className="text-right">₹{invoice.totalAmount?.toLocaleString() || 0}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete invoice #${invoice.id}?`)) {
                                      deleteInvoiceMutation.mutate(invoice.id);
                                    }
                                  }}
                                  disabled={deleteInvoiceMutation.isPending}
                                  title="Delete Invoice"
                                >
                                  {deleteInvoiceMutation.isPending && deleteInvoiceMutation.variables === invoice.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Lab Revenue Tab */}
          <TabsContent value="lab">
            {/* Lab Revenue Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Lab Revenue</CardTitle>
                  <CardDescription>Current period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">₹{labRevenue.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Lab Costs</CardTitle>
                  <CardDescription>Current period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">₹{labCostTotal.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Lab Profit</CardTitle>
                  <CardDescription>Current period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">₹{labProfit.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>
            
            {/* Lab Works Table */}
            <Card>
              <CardHeader>
                <CardTitle>Lab Works</CardTitle>
                <CardDescription>
                  View lab work financial details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingLabWorks ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="ml-2">Loading lab works...</p>
                    </div>
                  ) : filteredLabWorks.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-neutral-600">No lab works found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Patient ID</TableHead>
                            <TableHead>Work Type</TableHead>
                            <TableHead>Technician</TableHead>
                            <TableHead className="text-center">Units</TableHead>
                            <TableHead className="text-right">Lab Cost</TableHead>
                            <TableHead className="text-right">Clinic Cost</TableHead>
                            <TableHead className="text-right">Profit</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLabWorks.map((work: any) => {
                            const units = work.units || 1;
                            const labCost = work.labCost ? work.labCost * units : 0;
                            const clinicCost = work.clinicCost ? work.clinicCost * units : 0;
                            const profit = clinicCost - labCost;
                            
                            return (
                              <TableRow key={work.id}>
                                <TableCell>{work.patientId}</TableCell>
                                <TableCell>{work.workType}</TableCell>
                                <TableCell>{work.technician || "-"}</TableCell>
                                <TableCell className="text-center">{units}</TableCell>
                                <TableCell className="text-right">₹{labCost.toLocaleString()}</TableCell>
                                <TableCell className="text-right">₹{clinicCost.toLocaleString()}</TableCell>
                                <TableCell className="text-right">
                                  <span className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                                    ₹{profit.toLocaleString()}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs ${
                                      work.status === "completed"
                                        ? "bg-green-100 text-green-800"
                                        : work.status === "in progress"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {work.status?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}