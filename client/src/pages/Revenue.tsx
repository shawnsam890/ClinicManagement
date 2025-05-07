import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
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
import { Download, Printer, Search, Filter, Calendar } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [financialYear, setFinancialYear] = useState<string>(financialYears[0].value);
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });

  // Fetch all invoices
  const { data: rawInvoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["/api/invoices"],
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

  // Calculate total revenue
  const totalRevenue = filteredInvoices.reduce(
    (sum: number, invoice: any) => sum + (invoice.totalAmount || 0),
    0
  );

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
                ₹{filteredInvoices.length ? Math.round(totalRevenue / filteredInvoices.length).toLocaleString() : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Analysis</CardTitle>
            <CardDescription>Filter and analyze your revenue data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
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
                    placeholder="Search invoices..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="h-80">
                <h3 className="text-lg font-semibold mb-2">Revenue by Payment Method</h3>
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
              
              <div className="h-80">
                <h3 className="text-lg font-semibold mb-2">Revenue by Treatment Type</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={treatmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
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
            </div>

            {/* Invoices Table */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Invoices</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
              
              {isLoadingInvoices ? (
                <div className="flex justify-center py-10">
                  <p>Loading invoices...</p>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-neutral-600">No invoices found for the selected period.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Patient ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice: any) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.id}</TableCell>
                          <TableCell>{invoice.patientId}</TableCell>
                          <TableCell>{invoice.date}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              invoice.status === "paid"
                                ? "bg-green-100 text-green-800"
                                : invoice.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>{invoice.paymentMethod || "—"}</TableCell>
                          <TableCell className="text-right">₹{invoice.totalAmount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
