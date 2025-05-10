import { useState, Fragment } from "react";
import { useLocation } from "wouter";
import "./ExistingPatients.css";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Trash2, 
  MessageSquare, 
  Phone, 
  FileText, 
  Calendar,
  UserCircle2,
  CircleCheck,
  Clock,
  AlertCircle,
  PlusCircle,
  Filter
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ExistingPatients() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [patientToDelete, setPatientToDelete] = useState<number | null>(null);
  const itemsPerPage = 10;

  // Fetch patients
  const { data: patients, isLoading } = useQuery({
    queryKey: ["/api/patients"],
  });

  // Filter patients based on search query
  const filteredPatients = patients
    ? patients.filter((patient: any) => {
        const query = searchQuery.toLowerCase();
        return (
          patient.name.toLowerCase().includes(query) ||
          patient.patientId.toLowerCase().includes(query) ||
          patient.phoneNumber.includes(query)
        );
      })
    : [];

  // Paginate patients
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleViewPatient = (patientId: string) => {
    navigate(`/patients/record/${patientId}`);
  };

  const confirmDeletePatient = (patientId: number) => {
    setPatientToDelete(patientId);
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete) return;

    try {
      await apiRequest("DELETE", `/api/patients/${patientToDelete}`, undefined);
      
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      
      toast({
        title: "Success",
        description: "Patient deleted successfully.",
      });
      
      setPatientToDelete(null);
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast({
        title: "Error",
        description: "Failed to delete patient.",
        variant: "destructive",
      });
    }
  };

  const handleContactWhatsApp = (phoneNumber: string) => {
    window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}`, "_blank");
  };

  const handleContactSMS = (phoneNumber: string) => {
    window.open(`sms:${phoneNumber}`, "_blank");
  };

  return (
    <Layout
      title="Patient Database"
      showBackButton={true}
      backTo="/patients"
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="stats-card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 hover:border-blue-200">
          <CardContent className="p-4 flex items-center">
            <div className="bg-blue-100 rounded-full p-3 mr-4 shadow-inner">
              <UserCircle2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">Total Patients</p>
              <p className="text-2xl font-bold">{patients?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="stats-card bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 hover:border-green-200">
          <CardContent className="p-4 flex items-center">
            <div className="bg-green-100 rounded-full p-3 mr-4 shadow-inner">
              <CircleCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">Active Patients</p>
              <p className="text-2xl font-bold">{patients?.filter((p: any) => p.status !== 'inactive')?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="stats-card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 hover:border-amber-200">
          <CardContent className="p-4 flex items-center">
            <div className="bg-amber-100 rounded-full p-3 mr-4 shadow-inner">
              <Calendar className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">Last 30 Days</p>
              <p className="text-2xl font-bold">{patients?.filter((p: any) => {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return new Date(p.createdAt) >= thirtyDaysAgo;
              })?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    
      <Card className="shadow-md">
        <CardHeader className="border-b bg-neutral-50/80">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center">
              <div className="bg-primary/10 p-2 rounded-lg mr-3">
                <UserCircle2 className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl font-heading">Existing Patients</CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Button variant="outline" size="sm" className="border-dashed pr-10">
                  <Filter className="h-3.5 w-3.5 mr-2" />
                  <span>Filter</span>
                </Button>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                <Input
                  type="search"
                  placeholder="Search patients..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <Button size="sm" className="hidden sm:flex" onClick={() => navigate("/patients/new")}>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Patient
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>Loading patients...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-600">
                {searchQuery
                  ? "No patients found matching your search."
                  : "No patients in the database yet."}
              </p>
              <Button
                onClick={() => navigate("/patients/new")}
                className="mt-4"
              >
                Register New Patient
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPatients.map((patient: any) => {
                      // Generate a status based on visit history (mock data for visual enhancement)
                      const hasRecentVisit = patient.lastVisit && new Date(patient.lastVisit) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                      const status = patient.status || (hasRecentVisit ? 'active' : 'inactive');
                      
                      return (
                        <TableRow 
                          key={patient.id} 
                          className="patient-row cursor-pointer transition-colors hover:bg-neutral-50"
                          onClick={() => handleViewPatient(patient.patientId)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${
                                status === 'active' ? 'bg-green-500' : 
                                status === 'pending' ? 'bg-amber-500' : 'bg-neutral-300'
                              }`}></div>
                              <span className="font-medium text-primary">{patient.patientId}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className={`h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary mr-2`}>
                                {patient.name.split(' ').map((n: string) => n[0]).join('')}
                              </div>
                              <div>
                                <div className="font-medium">{patient.name}</div>
                                <div className="text-xs text-neutral-500">
                                  Last visit: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-neutral-50">
                              {patient.age} yrs
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={patient.sex === 'male' ? 'secondary' : 'destructive'} className="font-normal opacity-70">
                              {patient.sex.charAt(0).toUpperCase() + patient.sex.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 text-neutral-400" />
                              <span>{patient.phoneNumber}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <div className="flex justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleContactWhatsApp(patient.phoneNumber);
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <MessageSquare className="h-4 w-4 text-green-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>WhatsApp</p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleContactSMS(patient.phoneNumber);
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Phone className="h-4 w-4 text-blue-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Send SMS</p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                    >
                                      <FileText className="h-4 w-4 text-primary" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View Record</p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        confirmDeletePatient(patient.id);
                                      }}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete Patient</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-neutral-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredPatients.length)} of{" "}
                    {filteredPatients.length} patients
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      .map((page, index, array) => (
                        <Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <Button variant="outline" size="sm" disabled>
                              ...
                            </Button>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        </Fragment>
                      ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={patientToDelete !== null} onOpenChange={(open) => !open && setPatientToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this patient? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPatientToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePatient}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
