import React from 'react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, Receipt } from "lucide-react";

interface VisitDetailsTabbedProps {
  visit: any; // PatientVisit type
  onGenerateInvoice?: (visitId: number) => void;
  onAddPrescription?: (visitId: number) => void;
}

export default function VisitDetailsTabbed({ 
  visit, 
  onGenerateInvoice = () => {}, 
  onAddPrescription = () => {}
}: VisitDetailsTabbedProps) {
  if (!visit) return null;
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-lg">{visit.chiefComplaint}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(new Date(visit.date), 'dd MMM yyyy')}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onAddPrescription(visit.id)}
            >
              <Pill className="h-4 w-4 mr-1" /> Add Follow-Up
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onGenerateInvoice(visit.id)}
            >
              <Receipt className="h-4 w-4 mr-1" /> Invoice
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="visit-details">
          <TabsList className="grid grid-cols-3 mb-2">
            <TabsTrigger value="visit-details">Visit Details</TabsTrigger>
            <TabsTrigger value="prescription">Prescription</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          <TabsContent value="visit-details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Chief Complaint</h4>
                <div className="p-3 bg-muted/30 rounded-md text-sm">
                  {visit.chiefComplaint || 'No complaint recorded'}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Area of Complaint</h4>
                <div className="p-3 bg-muted/30 rounded-md text-sm">
                  {visit.areaOfComplaint || 'Not specified'}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Oral Examination</h4>
                <div className="p-3 bg-muted/30 rounded-md text-sm h-24 overflow-auto whitespace-pre-wrap">
                  {visit.oralExamination || 'No examination data recorded'}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Investigation</h4>
                <div className="p-3 bg-muted/30 rounded-md text-sm h-24 overflow-auto whitespace-pre-wrap">
                  {visit.investigation || 'No investigation data recorded'}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Treatment Plan</h4>
                <div className="p-3 bg-muted/30 rounded-md text-sm h-24 overflow-auto whitespace-pre-wrap">
                  {visit.treatmentPlan || 'No treatment plan recorded'}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Treatment Done</h4>
                <div className="p-3 bg-muted/30 rounded-md text-sm h-24 overflow-auto whitespace-pre-wrap">
                  {visit.treatmentDone || 'No treatment recorded'}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Advice</h4>
                <div className="p-3 bg-muted/30 rounded-md text-sm h-24 overflow-auto whitespace-pre-wrap">
                  {visit.advice || 'No advice recorded'}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Notes</h4>
                <div className="p-3 bg-muted/30 rounded-md text-sm h-24 overflow-auto whitespace-pre-wrap">
                  {visit.notes || 'No notes recorded'}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="prescription">
            <div className="space-y-2">
              {visit.prescriptions && visit.prescriptions.length > 0 ? (
                visit.prescriptions.map((prescription: any, index: number) => (
                  <div key={index} className="p-3 border rounded-md">
                    <div className="font-medium">{prescription.medicine}</div>
                    <div className="text-sm">{prescription.dosage}</div>
                    <div className="text-xs text-muted-foreground">{prescription.duration}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No prescriptions for this visit
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="files">
            <div className="space-y-2">
              {visit.attachments && typeof visit.attachments === 'string' && JSON.parse(visit.attachments).length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {JSON.parse(visit.attachments).map((file: string, index: number) => (
                    <div key={index} className="border rounded p-2 text-sm">
                      <a href={`/uploads/${file}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {file.split('-').pop()}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No files attached to this visit
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}