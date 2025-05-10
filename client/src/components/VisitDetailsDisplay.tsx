import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';

interface VisitDetailsDisplayProps {
  visit: any; // Should be PatientVisit type
  isLoading?: boolean;
}

export default function VisitDetailsDisplay({ visit, isLoading = false }: VisitDetailsDisplayProps) {
  if (isLoading || !visit) {
    return (
      <div className="animate-pulse">
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-muted rounded"></div>
            <div className="h-4 w-32 bg-muted rounded mt-2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-24 w-full bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="shadow-sm border border-border/40">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-lg">
          {visit.chiefComplaint || 'Consultation'}
          <span className="text-sm font-normal text-muted-foreground ml-2">
            {format(new Date(visit.date), 'dd MMM yyyy')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="visit-details" className="visit-detail-tabs">
          <TabsList className="mb-2 bg-muted/50">
            <TabsTrigger value="visit-details">Visit Details</TabsTrigger>
            <TabsTrigger value="prescription">Prescription</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>
          
          <TabsContent value="visit-details" className="pt-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                <div className="p-3 bg-muted/30 rounded-md text-sm min-h-[80px] whitespace-pre-wrap">
                  {visit.oralExamination || 'No examination data recorded'}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Investigation</h4>
                <div className="p-3 bg-muted/30 rounded-md text-sm min-h-[80px] whitespace-pre-wrap">
                  {visit.investigation || 'No investigation data recorded'}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Treatment Plan</h4>
                <div className="p-3 bg-muted/30 rounded-md text-sm min-h-[80px] whitespace-pre-wrap">
                  {visit.treatmentPlan || 'No treatment plan recorded'}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Treatment Done</h4>
                <div className="p-3 bg-muted/30 rounded-md text-sm min-h-[80px] whitespace-pre-wrap">
                  {visit.treatmentDone || 'No treatment recorded'}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Advice</h4>
                <div className="p-3 bg-muted/30 rounded-md text-sm min-h-[80px] whitespace-pre-wrap">
                  {visit.advice || 'No advice recorded'}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Notes</h4>
                <div className="p-3 bg-muted/30 rounded-md text-sm min-h-[80px] whitespace-pre-wrap">
                  {visit.notes || 'No notes recorded'}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="prescription">
            <div className="p-3 bg-muted/30 rounded-md">
              {visit.prescriptions && visit.prescriptions.length > 0 ? (
                <div className="space-y-2">
                  {visit.prescriptions.map((prescription: any, index: number) => (
                    <div key={index} className="bg-card p-3 rounded border">
                      <h4 className="font-medium">{prescription.medicine}</h4>
                      <p className="text-sm text-muted-foreground">{prescription.dosage}</p>
                      <p className="text-xs">{prescription.duration}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No prescriptions issued for this visit</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="files">
            <div className="p-3 bg-muted/30 rounded-md min-h-[200px]">
              {visit.attachments && JSON.parse(visit.attachments).length > 0 ? (
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
                <p className="text-sm text-muted-foreground">No files attached to this visit</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}